import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth/jwt.js";
import { AuthError } from "@/lib/auth/guards.js";
import { generateToken } from "@/lib/auth-tokens";
import { validateProfileData } from "@/lib/validators/category-profile-schema";
import { enforceSubscriptionExpiry } from "@/lib/services/subscription";

export function formatUserResponse(user, attorney) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isPro: user.isPro,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpires: user.subscriptionExpires,
    signupStatus: user.signupStatus || "approved",
    preferredLocale: user.preferredLocale || "en",
    user_metadata: {
      full_name: attorney?.name || user.displayName || user.email.split("@")[0],
      bar_number: attorney?.barNumber || null,
      bar_state: attorney?.stateBar || null,
    },
  };
}

function assertSignupApproved(user) {
  if (user.role === "admin") return;
  // Seekers are auto-approved after email verification
  if (user.role === "public") return;

  const status = user.signupStatus || "approved";
  if (status === "rejected") {
    throw new AuthError(
      "Your registration was not approved. Contact support@myimmflow.com if you believe this is an error.",
      403,
      "SIGNUP_REJECTED"
    );
  }
  if (status === "pending") {
    throw new AuthError(
      "Your account is pending admin approval. You will receive an email once your credentials are verified.",
      403,
      "SIGNUP_PENDING"
    );
  }
}

export async function loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { attorney: true },
  });

  if (!user) {
    throw new AuthError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AuthError("Invalid email or password.", 401, "INVALID_CREDENTIALS");
  }

  if (!user.emailVerified) {
    throw new AuthError(
      "Please verify your email before logging in. Check your inbox for the verification link.",
      403,
      "EMAIL_NOT_VERIFIED"
    );
  }

  assertSignupApproved(user);
  await enforceSubscriptionExpiry(user.id);

  const refreshed = await prisma.user.findUnique({
    where: { id: user.id },
    include: { attorney: true },
  });

  const token = signToken({
    userId: refreshed.id,
    email: refreshed.email,
    role: refreshed.role,
    isPro: refreshed.isPro,
  });

  return {
    user: formatUserResponse(refreshed, refreshed.attorney),
    access_token: token,
  };
}

export async function registerUser({ email, password, data, accountType = "attorney" }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new AuthError("User already exists with this email.", 409, "EMAIL_EXISTS");
  }

  const type = accountType || data?.account_type || "attorney";
  const passwordHash = await bcrypt.hash(password, 10);
  const fullName = data?.full_name?.trim() || normalizedEmail.split("@")[0];
  const verificationToken = generateToken();
  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (type === "seeker") {
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "public",
        displayName: fullName,
        emailVerified: false,
        verificationToken,
        signupStatus: "approved",
        preferredLocale: data?.locale || "en",
      },
    });
    return { user, verificationToken, fullName, accountType: "seeker" };
  }

  if (type === "provider") {
    let category = null;
    if (data?.category_id) {
      category = await prisma.serviceCategory.findUnique({
        where: { id: Number(data.category_id) },
      });
    } else if (data?.category_slug) {
      category = await prisma.serviceCategory.findUnique({
        where: { slug: String(data.category_slug) },
      });
    }
    if (!category || !category.isActive || category.slug === "attorney") {
      throw new AuthError(
        "Select a valid non-attorney service category, or sign up as an attorney.",
        400,
        "INVALID_CATEGORY"
      );
    }

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: "provider",
          displayName: fullName,
          emailVerified: false,
          verificationToken,
          signupStatus: "pending",
          preferredLocale: data?.locale || "en",
        },
      });

      const profileData = validateProfileData(
        category.profileSchema || { fields: [] },
        data?.profile_data,
        { partial: false }
      );
      if (data?.translator_type) profileData.translatorType = data.translator_type;
      if (data?.offers_certified != null) {
        profileData.offersCertified = Boolean(data.offers_certified);
      }
      if (data?.turnaround_days != null) {
        profileData.turnaroundDays = Number(data.turnaround_days) || null;
      }
      if (data?.rush_available != null) {
        profileData.rushAvailable = Boolean(data.rush_available);
      }
      if (data?.base_price_cents != null) {
        profileData.basePriceCents = Number(data.base_price_cents) || null;
      }
      if (data?.certification_note) {
        profileData.certificationNote = String(data.certification_note).slice(0, 2000);
      }
      if (data?.specializations) {
        profileData.specializations = Array.isArray(data.specializations)
          ? data.specializations
          : String(data.specializations)
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
      }

      const provider = await tx.provider.create({
        data: {
          userId: newUser.id,
          categoryId: category.id,
          displayName: fullName,
          initials,
          verificationStatus: "pending",
          languages: data?.languages
            ? JSON.stringify(
                Array.isArray(data.languages)
                  ? data.languages
                  : String(data.languages)
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
              )
            : null,
          location: data?.location || null,
          rate: data?.rate || null,
          remoteAvailable: data?.remote_available !== false,
          inPersonAvailable: Boolean(data?.in_person_available),
          experienceYears: data?.experience_years ? Number(data.experience_years) : null,
          profileData,
        },
      });

      const pairs = Array.isArray(data?.language_pairs) ? data.language_pairs : [];
      for (const pair of pairs.slice(0, 20)) {
        const source = String(pair.source || pair.sourceLanguage || "").trim();
        const target = String(pair.target || pair.targetLanguage || "").trim();
        if (!source || !target || source.toLowerCase() === target.toLowerCase()) continue;
        await tx.providerLanguagePair.create({
          data: {
            providerId: provider.id,
            sourceLanguage: source,
            targetLanguage: target,
          },
        });
      }

      if (data?.credential_number || data?.credential_org) {
        await tx.providerCredential.create({
          data: {
            providerId: provider.id,
            label: data?.credential_label || "Translation certification",
            organization: data?.credential_org || null,
            credentialNumber: data?.credential_number || null,
            expiresAt: data?.credential_expires
              ? new Date(data.credential_expires)
              : null,
            status: "pending",
          },
        });
      }

      return newUser;
    });

    return { user, verificationToken, fullName, accountType: "provider" };
  }

  const attorneyCategory = await prisma.serviceCategory.findUnique({
    where: { slug: "attorney" },
  });

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "attorney",
        displayName: fullName,
        emailVerified: false,
        verificationToken,
        signupStatus: "pending",
        preferredLocale: data?.locale || "en",
      },
    });

    await tx.attorney.create({
      data: {
        userId: newUser.id,
        name: fullName,
        initials,
        barNumber: data?.bar_number?.trim() || null,
        stateBar: data?.bar_state?.trim() || null,
        isVerified: false,
      },
    });

    if (attorneyCategory) {
      const provider = await tx.provider.create({
        data: {
          userId: newUser.id,
          categoryId: attorneyCategory.id,
          displayName: fullName,
          initials,
          verificationStatus: "pending",
          profileData: {
            barNumber: data?.bar_number?.trim() || null,
            stateBar: data?.bar_state?.trim() || null,
          },
        },
      });

      if (data?.bar_number?.trim()) {
        await tx.providerCredential.create({
          data: {
            providerId: provider.id,
            label: "State bar",
            organization: data?.bar_state?.trim() || null,
            credentialNumber: data.bar_number.trim(),
            status: "pending",
          },
        });
      }
    }

    return newUser;
  });

  return { user, verificationToken, fullName, accountType: "attorney" };
}

export async function verifyUserEmail(token) {
  const user = await prisma.user.findFirst({
    where: { verificationToken: token },
    include: { attorney: true },
  });

  if (!user) {
    throw new AuthError("Invalid or expired verification link.", 400, "INVALID_TOKEN");
  }

  if (user.emailVerified) {
    assertSignupApproved(user);
    await enforceSubscriptionExpiry(user.id);
    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      include: { attorney: true },
    });
    const access_token = signToken({
      userId: refreshed.id,
      email: refreshed.email,
      role: refreshed.role,
      isPro: refreshed.isPro,
    });
    return {
      user: formatUserResponse(refreshed, refreshed.attorney),
      access_token,
      alreadyVerified: true,
      pendingApproval: false,
    };
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null },
    include: { attorney: true },
  });

  const pendingApproval = updated.signupStatus === "pending";
  if (pendingApproval) {
    return {
      user: formatUserResponse(updated, updated.attorney),
      access_token: null,
      alreadyVerified: false,
      pendingApproval: true,
    };
  }

  if (updated.signupStatus === "rejected") {
    throw new AuthError(
      "Your registration was not approved. Contact support@myimmflow.com if you believe this is an error.",
      403,
      "SIGNUP_REJECTED"
    );
  }

  const access_token = signToken({
    userId: updated.id,
    email: updated.email,
    role: updated.role,
    isPro: updated.isPro,
  });

  return {
    user: formatUserResponse(updated, updated.attorney),
    access_token,
    alreadyVerified: false,
    pendingApproval: false,
  };
}

export async function resendVerificationEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { attorney: true },
  });

  if (!user || user.emailVerified) {
    return { sent: false, user: null, verificationToken: null, fullName: null };
  }

  const verificationToken = generateToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken },
  });

  const fullName = user.attorney?.name || user.displayName || user.email.split("@")[0];
  return { sent: true, user, verificationToken, fullName };
}
