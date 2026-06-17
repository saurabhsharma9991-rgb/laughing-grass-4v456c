import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken } from "@/lib/auth/jwt.js";
import { generateToken } from "@/lib/auth-tokens.js";
import { AuthError } from "@/lib/auth/guards.js";

export function formatUserResponse(user, attorney) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isPro: user.isPro,
    subscriptionPlan: user.subscriptionPlan,
    subscriptionExpires: user.subscriptionExpires,
    user_metadata: {
      full_name: attorney?.name || user.email.split("@")[0],
      bar_number: attorney?.barNumber || null,
      bar_state: attorney?.stateBar || null,
    },
  };
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

  if (!user.emailVerified && user.role !== "admin") {
    throw new AuthError(
      "Please verify your email before logging in. Check your inbox for the confirmation link.",
      403,
      "EMAIL_NOT_VERIFIED"
    );
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    isPro: user.isPro,
  });

  return {
    user: formatUserResponse(user, user.attorney),
    access_token: token,
  };
}

export async function registerUser({ email, password, data }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new AuthError("User already exists with this email.", 409, "EMAIL_EXISTS");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = generateToken();
  const fullName = data?.full_name?.trim() || normalizedEmail.split("@")[0];
  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: "attorney",
        emailVerified: false,
        verificationToken,
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

    return newUser;
  });

  return { user, verificationToken };
}
