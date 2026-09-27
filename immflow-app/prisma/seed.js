/**
 * Full demo seed for ImmFlow.
 * All NEW demo accounts use password: password
 *
 * Modes:
 *   SEED_MODE=reset     Wipe DB then seed (default for local/empty DBs)
 *   SEED_MODE=additive  Keep all existing data; only create missing demo rows
 *
 * Live / production (keep current data):
 *   SEED_MODE=additive npx prisma db seed
 *   # or
 *   npm run seed:additive
 *
 * Local clean slate:
 *   SEED_MODE=reset npx prisma db seed
 *   # or just: npx prisma db seed
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import { getMariaDbPoolConfig } from "../src/lib/db-config.js";
import {
  buildFullPermissions,
  normalizePermissions,
  SUPER_ADMIN_SLUG,
} from "../src/lib/constants/admin-permissions.js";
import { buildDefaultHomepageDocument } from "../src/lib/constants/homepage-blocks.js";
import { serializeHomepageDocument } from "../src/lib/utils/homepage-document.js";

const PASSWORD = "password";
const SEED_MODE = (process.env.SEED_MODE || "reset").toLowerCase();
const ADDITIVE = SEED_MODE === "additive" || SEED_MODE === "keep" || SEED_MODE === "safe";

if (!process.env.DATABASE_URL) {
  console.error(
    "DATABASE_URL is not set.\n" +
      "Make sure /var/www/immflow/immflow-app/.env exists and contains DATABASE_URL,\n" +
      "or export it before seeding:\n" +
      "  export $(grep -v '^#' .env | xargs) && npm run seed:additive"
  );
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && !ADDITIVE && process.env.SEED_FORCE_RESET !== "1") {
  console.error(
    "Refusing to wipe production data.\n" +
      "Use: SEED_MODE=additive npx prisma db seed\n" +
      "Or set SEED_FORCE_RESET=1 if you really intend to wipe."
  );
  process.exit(1);
}

function blockId() {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function pageDoc(blocks) {
  return JSON.stringify({
    version: 1,
    mode: "blocks",
    blocks,
    html: "",
  });
}

function hero(title, subtitle, buttonLabel = "Get started", buttonHref = "/") {
  return {
    id: blockId(),
    type: "hero",
    data: { eyebrow: "ImmFlow", title, subtitle, buttonLabel, buttonHref, align: "left" },
  };
}

function paragraph(text) {
  return { id: blockId(), type: "paragraph", data: { text } };
}

function heading(text, level = 2) {
  return { id: blockId(), type: "heading", data: { text, level } };
}

function faq(items) {
  return { id: blockId(), type: "faq", data: { items } };
}

function contact(email = "support@myimmflow.com") {
  return {
    id: blockId(),
    type: "contact",
    data: {
      email,
      phone: "(415) 555-0142",
      address: "Remote-first · United States",
      note: "We usually reply within one business day.",
    },
  };
}

function cta(title, text, buttonLabel, buttonHref) {
  return {
    id: blockId(),
    type: "cta",
    data: { title, text, buttonLabel, buttonHref },
  };
}

const adapter = new PrismaMariaDb({
  ...getMariaDbPoolConfig(),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

const CITIES = [
  ["Los Angeles, CA", "CA"],
  ["New York, NY", "NY"],
  ["Chicago, IL", "IL"],
  ["Miami, FL", "FL"],
  ["Houston, TX", "TX"],
  ["Atlanta, GA", "GA"],
  ["Seattle, WA", "WA"],
  ["Boston, MA", "MA"],
  ["Phoenix, AZ", "AZ"],
  ["Denver, CO", "CO"],
  ["San Francisco, CA", "CA"],
  ["Dallas, TX", "TX"],
  ["San Diego, CA", "CA"],
  ["Philadelphia, PA", "PA"],
  ["Portland, OR", "OR"],
];

const FIRST = [
  "Maria", "James", "Sunita", "Tomas", "Diana", "Aisha", "Chen", "Omar",
  "Elena", "Priya", "Carlos", "Nadia", "Wei", "Sofia", "Andre", "Fatima",
];
const LAST = [
  "Reyes", "Kim", "Patel", "Navarro", "Lopez", "Williams", "Zhang", "Hassan",
  "Petrov", "Sharma", "Mendez", "Okoro", "Liu", "Rossi", "Dubois", "Alami",
];

function initials(first, last) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

function pick(arr, i) {
  return arr[i % arr.length];
}

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function wipe() {
  if (ADDITIVE) {
    console.log("Additive mode — keeping all existing data (no wipe).");
    return;
  }
  console.log("Reset mode — clearing existing data…");
  await prisma.translationOrderFile.deleteMany({});
  await prisma.translationOrder.deleteMany({});
  await prisma.serviceBooking.deleteMany({});
  await prisma.providerReview.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.providerCredential.deleteMany({});
  await prisma.providerLanguagePair.deleteMany({});
  await prisma.provider.deleteMany({});
  await prisma.attorney.deleteMany({});
  await prisma.cmsPage.deleteMany({});
  await prisma.aiResponseCache.deleteMany({});
  await prisma.siteContent.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.adminRole.deleteMany({});
}

async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function seedCategories() {
  const defs = [
    {
      slug: "attorney",
      name: "Immigration Attorneys",
      description: "Verified immigration attorneys for hearings, outsourcing, and referrals.",
      icon: "scale",
      sortOrder: 1,
      profileSchema: { fields: ["barNumber", "stateBar", "specialties"] },
    },
    {
      slug: "translation",
      name: "Certified Translation",
      description: "Certified and professional document translation services.",
      icon: "translate",
      sortOrder: 2,
      profileSchema: {
        fields: [
          "translatorType",
          "languagePairs",
          "certification",
          "turnaround",
          "rushAvailable",
          "documentTypes",
        ],
      },
    },
    {
      slug: "interpreter",
      name: "Interpreters",
      description:
        "In-person ($200/hr), phone, and video ($150/hr) interpretation for legal and immigration settings.",
      icon: "mic",
      sortOrder: 3,
      profileSchema: {
        fields: ["languagePairs", "serviceTypes", "hourlyRate", "minimumBooking"],
        defaultRates: { remote: 150, inPerson: 200 },
      },
    },
    {
      slug: "psychological",
      name: "Psychological Services",
      description: "Licensed mental-health professionals for immigration-related evaluations.",
      icon: "heart",
      sortOrder: 4,
      profileSchema: {
        fields: [
          "professionalType",
          "licenseType",
          "licenseState",
          "licenseNumber",
          "evaluationTypes",
          "telehealth",
        ],
      },
    },
  ];

  const map = {};
  for (const cat of defs) {
    map[cat.slug] = await prisma.serviceCategory.upsert({
      where: { slug: cat.slug },
      create: { ...cat, isActive: true },
      update: {
        name: cat.name,
        description: cat.description,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        profileSchema: cat.profileSchema,
        isActive: true,
      },
    });
  }
  return map;
}

async function seedAdmin(passwordHash) {
  const superAdminRole = await prisma.adminRole.upsert({
    where: { slug: SUPER_ADMIN_SLUG },
    create: {
      name: "Super Admin",
      slug: SUPER_ADMIN_SLUG,
      description: "Full access to every admin area.",
      permissions: JSON.stringify(buildFullPermissions()),
      isSystem: true,
    },
    update: ADDITIVE ? {} : { permissions: JSON.stringify(buildFullPermissions()), isSystem: true },
  });

  const contentRole = await prisma.adminRole.upsert({
    where: { slug: "content_manager" },
    create: {
      name: "Content Manager",
      slug: "content_manager",
      description: "Edit site content, pages, and view settings.",
      permissions: JSON.stringify(
        normalizePermissions({
          cms: { view: true, create: true, edit: true, delete: true },
          settings: { view: true },
          analytics: { view: true },
        })
      ),
      isSystem: false,
    },
    update: {},
  });

  await prisma.adminRole.upsert({
    where: { slug: "support" },
    create: {
      name: "Support",
      slug: "support",
      description: "Moderate providers, clients, orders, bookings, and listings.",
      permissions: JSON.stringify(
        normalizePermissions({
          categories: { view: true },
          providers: { view: true, edit: true },
          clients: { view: true, edit: true },
          orders: { view: true, edit: true },
          bookings: { view: true, edit: true },
          attorneys: { view: true, edit: true },
          listings: { view: true, edit: true, delete: true },
          applications: { view: true, edit: true },
          reviews: { view: true, delete: true },
          analytics: { view: true },
        })
      ),
      isSystem: false,
    },
    update: {},
  });

  let admin = await findUserByEmail("admin@myimmflow.com");
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: "admin@myimmflow.com",
        passwordHash,
        role: "admin",
        emailVerified: true,
        signupStatus: "approved",
        displayName: "Super Admin",
        adminRoleId: superAdminRole.id,
      },
    });
  } else if (!admin.adminRoleId) {
    admin = await prisma.user.update({
      where: { id: admin.id },
      data: { adminRoleId: superAdminRole.id },
    });
  }

  if (!(await findUserByEmail("content@myimmflow.com"))) {
    await prisma.user.create({
      data: {
        email: "content@myimmflow.com",
        passwordHash,
        role: "admin",
        emailVerified: true,
        signupStatus: "approved",
        displayName: "Content Manager",
        adminRoleId: contentRole.id,
      },
    });
  }

  return admin;
}

async function seedAttorneys(passwordHash, attorneyCategory) {
  const specialtiesPool = [
    ["Removal defense", "Asylum", "DACA"],
    ["H-1B", "EB-1/2", "L-1"],
    ["Family petition", "Naturalization"],
    ["Asylum", "TPS", "U-visa"],
    ["EOIR", "Hearing coverage", "Bond"],
    ["BIA appeals", "Co-counsel"],
    ["Employment visas", "PERM"],
    ["VAWA", "Cancellation of removal"],
  ];
  const langsPool = [
    ["Spanish"],
    ["Korean"],
    ["Hindi", "Gujarati"],
    ["Spanish", "Portuguese"],
    ["Mandarin"],
    ["Arabic"],
    ["Russian"],
    ["French"],
    ["English"],
  ];

  const attorneys = [];
  for (let i = 0; i < 15; i++) {
    const first = pick(FIRST, i);
    const last = pick(LAST, i + 3);
    const [city, state] = pick(CITIES, i);
    const isPro = i < 8;
    const email = `attorney${i + 1}@demo.immflow.test`;
    const name = `${first} ${last}, Esq.`;

    const existing = await findUserByEmail(email);
    if (existing) {
      const attorney = await prisma.attorney.findUnique({ where: { userId: existing.id } });
      const provider = await prisma.provider.findFirst({
        where: { userId: existing.id, categoryId: attorneyCategory.id },
      });
      if (attorney && provider) {
        attorneys.push({ user: existing, attorney, provider, reused: true });
        continue;
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "attorney",
        emailVerified: true,
        signupStatus: "approved",
        displayName: name,
        isPro,
        subscriptionPlan: isPro ? "Pro" : "Free",
        preferredLocale: pick(["en", "es", "hi"], i),
      },
    });

    const attorney = await prisma.attorney.create({
      data: {
        userId: user.id,
        name,
        initials: initials(first, last),
        location: city,
        experienceYears: 5 + (i % 12),
        specialties: JSON.stringify(pick(specialtiesPool, i)),
        languages: JSON.stringify(pick(langsPool, i)),
        rate: i % 5 === 0 ? "$400 flat" : `$${150 + i * 10}/hr`,
        availability: i % 3 === 0 ? "Available now" : `Avail. in ${i % 7 || 1} days`,
        stars: 4.2 + (i % 8) * 0.1,
        reviewsCount: 8 + i * 3,
        barNumber: `BAR${100000 + i}`,
        stateBar: state,
        isVerified: i !== 14,
        bio: `${name} focuses on immigration law in ${city}.`,
      },
    });

    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        categoryId: attorneyCategory.id,
        displayName: name,
        initials: initials(first, last),
        location: city,
        experienceYears: 5 + (i % 12),
        languages: JSON.stringify(pick(langsPool, i)),
        rate: `$${150 + i * 10}/hr`,
        availability: "Available now",
        stars: 4.2 + (i % 8) * 0.1,
        reviewsCount: 8 + i * 3,
        verificationStatus: i === 14 ? "pending" : "verified",
        remoteAvailable: true,
        inPersonAvailable: i % 2 === 0,
        bio: `${name} focuses on immigration law in ${city}.`,
        profileData: {
          barNumber: `BAR${100000 + i}`,
          stateBar: state,
          specialties: pick(specialtiesPool, i),
        },
      },
    });

    await prisma.providerCredential.create({
      data: {
        providerId: provider.id,
        label: "State bar",
        organization: state,
        credentialNumber: `BAR${100000 + i}`,
        status: i === 14 ? "pending" : "verified",
      },
    });

    attorneys.push({ user, attorney, provider });
  }
  return attorneys;
}

async function seedProviders(passwordHash, categories) {
  const translators = [];
  const interpreters = [];
  const psychs = [];

  const langPairs = [
    ["Spanish", "English"],
    ["Hindi", "English"],
    ["Mandarin", "English"],
    ["Arabic", "English"],
    ["Russian", "English"],
    ["Portuguese", "English"],
    ["French", "English"],
    ["Korean", "English"],
  ];

  for (let i = 0; i < 12; i++) {
    const first = pick(FIRST, i + 2);
    const last = pick(LAST, i + 5);
    const [city] = pick(CITIES, i + 1);
    const [source, target] = pick(langPairs, i);
    const isPro = i < 5;
    const name = `${first} ${last}`;
    const email = `translator${i + 1}@demo.immflow.test`;

    const existing = await findUserByEmail(email);
    if (existing) {
      const provider = await prisma.provider.findFirst({
        where: { userId: existing.id, categoryId: categories.translation.id },
      });
      if (provider) {
        translators.push({ user: existing, provider, reused: true });
        continue;
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "provider",
        emailVerified: true,
        signupStatus: "approved",
        displayName: name,
        isPro,
        subscriptionPlan: isPro ? "Pro" : "Free",
      },
    });

    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        categoryId: categories.translation.id,
        displayName: `${name} Translations`,
        initials: initials(first, last),
        location: city,
        experienceYears: 3 + (i % 10),
        languages: JSON.stringify([source, target]),
        rate: `$${0.12 + i * 0.01}/word`,
        availability: "3–5 business days",
        stars: 4.3 + (i % 7) * 0.1,
        reviewsCount: 5 + i * 2,
        verificationStatus: i === 11 ? "pending" : "verified",
        remoteAvailable: true,
        inPersonAvailable: false,
        bio: `Certified document translator specializing in ${source} ↔ ${target}.`,
        profileData: {
          translatorType: i % 2 === 0 ? "Certified translator" : "Professional translator",
          offersCertified: i % 2 === 0,
          rushAvailable: i % 3 !== 0,
          turnaround: i % 3 === 0 ? "rush" : "regular",
          documentTypes: ["Birth certificate", "Marriage certificate", "Court document"],
          // Flat document starting price used for quotes (rate above is display-only per-word).
          basePriceCents: 4900,
          certificationNote:
            "ATA-style certification statement available for immigration filings.",
        },
      },
    });

    await prisma.providerLanguagePair.create({
      data: {
        providerId: provider.id,
        sourceLanguage: source,
        targetLanguage: target,
      },
    });

    await prisma.providerCredential.create({
      data: {
        providerId: provider.id,
        label: "Translation certification",
        organization: "ATA / Independent",
        credentialNumber: `TR-${2000 + i}`,
        status: i === 11 ? "pending" : "verified",
      },
    });

    translators.push({ user, provider });
  }

  for (let i = 0; i < 12; i++) {
    const first = pick(FIRST, i + 4);
    const last = pick(LAST, i + 1);
    const [city] = pick(CITIES, i + 2);
    const [source, target] = pick(langPairs, i + 2);
    const isPro = i < 4;
    const name = `${first} ${last}`;
    const email = `interpreter${i + 1}@demo.immflow.test`;

    const existing = await findUserByEmail(email);
    if (existing) {
      const provider = await prisma.provider.findFirst({
        where: { userId: existing.id, categoryId: categories.interpreter.id },
      });
      if (provider) {
        interpreters.push({ user: existing, provider, reused: true });
        continue;
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "provider",
        emailVerified: true,
        signupStatus: "approved",
        displayName: name,
        isPro,
        subscriptionPlan: isPro ? "Pro" : "Free",
      },
    });

    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        categoryId: categories.interpreter.id,
        displayName: `${name} Interpreting`,
        initials: initials(first, last),
        location: city,
        experienceYears: 4 + (i % 9),
        languages: JSON.stringify([...new Set([source, target, "English"])]),
        rate: "$150/hr remote · $200/hr in-person",
        availability: "Book 48h ahead",
        stars: 4.4 + (i % 6) * 0.1,
        reviewsCount: 6 + i * 2,
        verificationStatus: "verified",
        remoteAvailable: true,
        inPersonAvailable: true,
        bio: `${source}/${target} interpreter for immigration interviews and court.`,
        profileData: {
          serviceTypes: [
            "Immigration interview",
            "USCIS-related appointment",
            "Immigration court",
            "Phone interpretation",
            "Video interpretation",
          ],
          hourlyRateRemote: 150,
          hourlyRateInPerson: 200,
          minimumBooking: 60,
        },
      },
    });

    await prisma.providerLanguagePair.create({
      data: {
        providerId: provider.id,
        sourceLanguage: source,
        targetLanguage: target,
      },
    });

    interpreters.push({ user, provider });
  }

  for (let i = 0; i < 12; i++) {
    const first = pick(FIRST, i + 6);
    const last = pick(LAST, i + 7);
    const [city, state] = pick(CITIES, i + 3);
    const isPro = i < 3;
    const name = `Dr. ${first} ${last}`;
    const email = `psych${i + 1}@demo.immflow.test`;

    const existing = await findUserByEmail(email);
    if (existing) {
      const provider = await prisma.provider.findFirst({
        where: { userId: existing.id, categoryId: categories.psychological.id },
      });
      if (provider) {
        psychs.push({ user: existing, provider, reused: true });
        continue;
      }
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "provider",
        emailVerified: true,
        signupStatus: "approved",
        displayName: name,
        isPro,
        subscriptionPlan: isPro ? "Pro" : "Free",
      },
    });

    const provider = await prisma.provider.create({
      data: {
        userId: user.id,
        categoryId: categories.psychological.id,
        displayName: name,
        initials: initials(first, last),
        location: city,
        experienceYears: 6 + (i % 10),
        languages: JSON.stringify(pick([["English"], ["Spanish", "English"], ["English", "Hindi"]], i)),
        rate: `$${350 + i * 25} eval`,
        availability: "Telehealth available",
        stars: 4.5 + (i % 5) * 0.1,
        reviewsCount: 4 + i,
        verificationStatus: "verified",
        remoteAvailable: true,
        inPersonAvailable: i % 2 === 0,
        bio: `Licensed clinician providing immigration psychological evaluations in ${city}.`,
        profileData: {
          professionalType: i % 2 === 0 ? "Licensed Psychologist" : "LCSW",
          licenseType: i % 2 === 0 ? "PhD / PsyD" : "LCSW",
          licenseState: state,
          licenseNumber: `LIC-${3000 + i}`,
          evaluationTypes: [
            "Hardship evaluation",
            "Asylum-related psychological evaluation",
            "VAWA-related evaluation",
          ],
          telehealth: true,
        },
      },
    });

    await prisma.providerCredential.create({
      data: {
        providerId: provider.id,
        label: "Professional license",
        organization: state,
        credentialNumber: `LIC-${3000 + i}`,
        status: "verified",
      },
    });

    psychs.push({ user, provider });
  }

  return { translators, interpreters, psychs };
}

async function seedClients(passwordHash) {
  const clients = [];
  for (let i = 0; i < 15; i++) {
    const first = pick(FIRST, i + 1);
    const last = pick(LAST, i + 8);
    const isPro = i < 5;
    const email = `client${i + 1}@demo.immflow.test`;
    const existing = await findUserByEmail(email);
    if (existing) {
      clients.push(existing);
      continue;
    }
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "public",
        emailVerified: true,
        signupStatus: "approved",
        displayName: `${first} ${last}`,
        isPro,
        subscriptionPlan: isPro ? "Pro" : "Free",
        preferredLocale: pick(["en", "es", "hi", "ru", "zh"], i),
      },
    });
    clients.push(user);
  }

  // One pending seeker for admin approval testing
  if (!(await findUserByEmail("pending.client@demo.immflow.test"))) {
    await prisma.user.create({
      data: {
        email: "pending.client@demo.immflow.test",
        passwordHash,
        role: "public",
        emailVerified: true,
        signupStatus: "pending",
        displayName: "Pending Seeker",
      },
    });
  }

  return clients;
}

async function seedListings(attorneys) {
  const types = [
    ["Full-time", "Associate attorney — immigration boutique", "Jobs"],
    ["Full-time", "Staff attorney — nonprofit immigration clinic", "Jobs"],
    ["Full-time", "Senior counsel — employment immigration", "Jobs"],
    ["One-time", "Hearing coverage — master calendar", "Hearings"],
    ["One-time", "Bond hearing coverage — next week", "Hearings"],
    ["One-time", "Merits hearing coverage — asylum", "Hearings"],
    ["Project", "Outsource — 20 DACA renewal filings", "Outsource"],
    ["Project", "Outsource — family petition package review", "Outsource"],
    ["Project", "Outsource — U-visa declarations (batch)", "Outsource"],
    ["Contract", "Contract attorney — USCIS filings (remote)", "Contract"],
    ["Contract", "Temp counsel — EOIR calendar support", "Contract"],
    ["Of counsel", "Of counsel — immigration practice group", "Contract"],
    ["Full-time", "Junior associate — removal defense", "Jobs"],
    ["One-time", "Same-day interpreter-assisted hearing coverage", "Hearings"],
    ["Project", "Outsource — naturalization interview prep packets", "Outsource"],
  ];

  const listings = [];
  for (let i = 0; i < types.length; i++) {
    const [type, title] = types[i];
    const poster = attorneys[i % attorneys.length];
    const listing = await prisma.listing.create({
      data: {
        title,
        org: pick(
          [
            "Pacific Immigration Law",
            "Gonzalez & Associates",
            "Midwest Legal Group",
            "RAICES Partner Clinic",
            "Hartley & Partners LLP",
            "ImmAssist Network",
          ],
          i
        ),
        location: pick(CITIES, i)[0],
        description: `${title}. Looking for a qualified immigration attorney. Posted for demo/testing.`,
        type,
        badge: pick(["New", "Urgent", "Open", "Featured"], i),
        tags: JSON.stringify(
          pick(
            [
              ["Removal defense", "Spanish preferred"],
              ["EOIR", "Hearing", "Spanish required"],
              ["DACA", "Flat rate"],
              ["Remote", "USCIS", "I-485"],
              ["Asylum", "5+ yrs"],
            ],
            i
          )
        ),
        pay: pick(["$85k–$110k", "$500 flat", "$150/case", "$125/hr", "$200/hr"], i),
        applicantsCount: 0,
        status: i === 13 ? "filled" : i === 14 ? "closed" : "open",
        postedById: poster.user.id,
      },
    });
    listings.push(listing);
  }
  return listings;
}

async function seedApplications(listings, attorneys, clients) {
  let count = 0;
  for (let i = 0; i < Math.min(12, listings.length); i++) {
    const listing = listings[i];
    // Attorneys apply to other attorneys' listings
    const applicant = attorneys[(i + 3) % attorneys.length];
    if (applicant.user.id === listing.postedById) continue;
    await prisma.application.create({
      data: {
        listingId: listing.id,
        applicantId: applicant.user.id,
        status: pick(["applied", "reviewed", "accepted", "rejected"], i),
        message: `I am available for “${listing.title}”. Happy to discuss coverage details.`,
      },
    });
    count += 1;
    await prisma.listing.update({
      where: { id: listing.id },
      data: { applicantsCount: { increment: 1 } },
    });
  }
  // A few clients shouldn't typically apply, but attorneys applying is main path
  return count;
}

async function seedTranslationOrders(clients, translators) {
  const statuses = [
    "pending_payment",
    "pending",
    "accepted",
    "in_progress",
    "quality_review",
    "completed",
    "delivered",
    "cancelled",
    "pending",
    "in_progress",
    "delivered",
    "accepted",
  ];
  const docs = [
    "Birth certificate",
    "Marriage certificate",
    "Passport / ID",
    "Court document",
    "Academic transcript",
    "Affidavit / letter",
  ];
  const pairs = [
    ["Spanish", "English"],
    ["Hindi", "English"],
    ["Mandarin", "English"],
    ["Arabic", "English"],
    ["Russian", "English"],
  ];

  const orders = [];
  for (let i = 0; i < 12; i++) {
    const [source, target] = pick(pairs, i);
    const status = statuses[i];
    const paid = !["pending_payment", "cancelled"].includes(status);
    const order = await prisma.translationOrder.create({
      data: {
        clientId: clients[i % clients.length].id,
        providerId: translators[i % translators.length].provider.id,
        sourceLanguage: source,
        targetLanguage: target,
        documentType: pick(docs, i),
        translationType: i % 2 === 0 ? "certified" : "standard",
        turnaround: i % 3 === 0 ? "rush" : "regular",
        status,
        priceCents: 8900 + i * 1200,
        currency: "usd",
        certificationNote:
          i % 2 === 0
            ? "Translator certification statement included for immigration use."
            : null,
        clientNotes: `Please preserve names exactly. Needed for USCIS filing #DEMO-${1000 + i}.`,
        providerNotes: status === "in_progress" ? "Working on draft delivery." : null,
        paidAt: paid ? daysFromNow(-i - 1) : null,
        deliveredAt: ["delivered", "completed"].includes(status) ? daysFromNow(-1) : null,
      },
    });

    await prisma.translationOrderFile.create({
      data: {
        orderId: order.id,
        kind: "source",
        originalName: `source-doc-${i + 1}.pdf`,
        storedName: `seed_source_${i + 1}.pdf`,
        relativePath: `seed/translation/${order.id}/source-doc-${i + 1}.pdf`,
        mimeType: "application/pdf",
        sizeBytes: 120000 + i * 1000,
        uploadedById: clients[i % clients.length].id,
      },
    });

    if (["delivered", "completed", "quality_review"].includes(status)) {
      await prisma.translationOrderFile.create({
        data: {
          orderId: order.id,
          kind: "delivery",
          originalName: `delivery-${i + 1}.pdf`,
          storedName: `seed_delivery_${i + 1}.pdf`,
          relativePath: `seed/translation/${order.id}/delivery-${i + 1}.pdf`,
          mimeType: "application/pdf",
          sizeBytes: 140000 + i * 800,
          uploadedById: translators[i % translators.length].user.id,
        },
      });
    }

    orders.push(order);
  }
  return orders;
}

async function seedBookings(clients, interpreters, psychs) {
  const bookings = [];
  for (let i = 0; i < 12; i++) {
    const isPsych = i % 2 === 0;
    const provider = isPsych
      ? psychs[i % psychs.length].provider
      : interpreters[i % interpreters.length].provider;
    const status = pick(
      ["requested", "confirmed", "completed", "pending_payment", "cancelled", "declined"],
      i
    );
    const modality = isPsych
      ? pick(["telehealth", "remote", "in_person"], i)
      : pick(["remote", "video", "phone", "in_person"], i);

    const booking = await prisma.serviceBooking.create({
      data: {
        clientId: clients[(i + 2) % clients.length].id,
        providerId: provider.id,
        bookingType: isPsych ? "psychological" : "interpreter",
        status,
        language: pick(["Spanish", "Hindi", "Mandarin", "Arabic"], i),
        sourceLanguage: isPsych ? null : pick(["Spanish", "Hindi"], i),
        targetLanguage: isPsych ? null : "English",
        serviceType: isPsych
          ? pick(
              [
                "Hardship evaluation",
                "Asylum-related psychological evaluation",
                "VAWA-related evaluation",
              ],
              i
            )
          : pick(
              [
                "Immigration interview",
                "USCIS-related appointment",
                "Immigration court",
                "Phone interpretation",
              ],
              i
            ),
        modality,
        scheduledAt: daysFromNow(i + 2),
        durationMinutes: isPsych ? 90 : modality === "in_person" ? 120 : 60,
        location: modality === "in_person" ? pick(CITIES, i)[0] : "Remote",
        priceCents: isPsych
          ? 45000 + i * 2500
          : modality === "in_person"
            ? 20000
            : 15000,
        currency: "usd",
        paidAt: ["confirmed", "completed"].includes(status) ? daysFromNow(-2) : null,
        clientNotes: "Demo booking for ImmFlow QA testing.",
        disclaimerAck: true,
      },
    });
    bookings.push(booking);
  }
  return bookings;
}

async function seedMessages(clients, attorneys, translators) {
  let n = 0;
  for (let i = 0; i < 12; i++) {
    const client = clients[i % clients.length];
    const attorney = attorneys[i % attorneys.length];
    await prisma.message.create({
      data: {
        senderId: client.id,
        receiverId: attorney.user.id,
        content: `Hi ${attorney.attorney.name}, I need help with my immigration case. This is demo message ${i + 1}.`,
      },
    });
    await prisma.message.create({
      data: {
        senderId: attorney.user.id,
        receiverId: client.id,
        content: `Thanks for reaching out. I can review your situation — please share case type and deadlines. (Demo reply ${i + 1})`,
      },
    });
    n += 2;
  }

  // Peer attorney chat (Pro)
  for (let i = 0; i < 6; i++) {
    const a = attorneys[i];
    const b = attorneys[i + 1];
    if (!a || !b) continue;
    await prisma.message.create({
      data: {
        senderId: a.user.id,
        receiverId: b.user.id,
        content: `Looking for hearing coverage next Thursday — are you available? (Peer demo ${i + 1})`,
      },
    });
    n += 1;
  }

  // Client → translator
  for (let i = 0; i < 6; i++) {
    await prisma.message.create({
      data: {
        senderId: clients[i].id,
        receiverId: translators[i % translators.length].user.id,
        content: `I need a certified birth certificate translation. Turnaround? (Demo ${i + 1})`,
      },
    });
    n += 1;
  }

  return n;
}

async function seedReviews(attorneys, clients, translators) {
  let n = 0;
  for (let i = 0; i < 12; i++) {
    const attorney = attorneys[i % attorneys.length];
    const reviewer = attorneys[(i + 5) % attorneys.length];
    if (attorney.attorney.id === reviewer.attorney?.id) continue;
    try {
      await prisma.review.create({
        data: {
          attorneyId: attorney.attorney.id,
          reviewerId: reviewer.user.id,
          rating: 4 + (i % 2),
          comment: `Professional and responsive. Demo peer review ${i + 1}.`,
        },
      });
      n += 1;
    } catch {
      // unique constraint skip
    }
  }

  for (let i = 0; i < 10; i++) {
    try {
      await prisma.providerReview.create({
        data: {
          providerId: translators[i % translators.length].provider.id,
          reviewerId: clients[i % clients.length].id,
          rating: 4 + (i % 2),
          comment: `Accurate translation and clear communication. Demo review ${i + 1}.`,
        },
      });
      n += 1;
    } catch {
      // skip
    }
  }
  return n;
}

async function seedCmsPages() {
  const pages = [
    {
      slug: "about",
      title: "About ImmFlow",
      excerpt: "A marketplace for verified immigration service professionals.",
      footerColumn: "company",
      footerSort: 10,
      body: pageDoc([
        hero(
          "About ImmFlow",
          "We help people find verified immigration attorneys, translators, interpreters, and psychological evaluation professionals.",
          "Browse services",
          "/services"
        ),
        heading("What we do"),
        paragraph(
          "ImmFlow is a discovery and connection marketplace. Professionals operate independently. ImmFlow does not provide legal advice, clinical care, or translation services."
        ),
        faq([
          {
            question: "Who can join?",
            answer: "Clients seeking help, and verified attorneys and service providers.",
          },
          {
            question: "How are providers verified?",
            answer: "Admins review credentials appropriate to each category before listing.",
          },
        ]),
        cta("Join ImmFlow", "Create a free account to get started.", "Sign up", "/"),
      ]),
    },
    {
      slug: "contact",
      title: "Contact us",
      excerpt: "Get in touch with the ImmFlow team.",
      footerColumn: "company",
      footerSort: 20,
      body: pageDoc([
        hero("Contact ImmFlow", "Questions about your account, listing, or order? We’re here to help.", "Email support", "mailto:support@myimmflow.com"),
        contact(),
        paragraph("For marketplace help and common questions, visit Help & FAQ."),
      ]),
    },
    {
      slug: "terms",
      title: "Terms of use",
      excerpt: "Terms that govern use of the ImmFlow marketplace.",
      footerColumn: "company",
      footerSort: 40,
      body: pageDoc([
        hero("Terms of use", "By using ImmFlow you agree to use the platform lawfully and respectfully."),
        heading("Marketplace role"),
        paragraph(
          "ImmFlow is a discovery and connection marketplace. Profiles, listings, and messages are created by independent users. ImmFlow does not provide legal advice, legal representation, translation, interpretation, or clinical services."
        ),
        heading("Your responsibilities"),
        paragraph(
          "You are responsible for the accuracy of information you post. We may suspend accounts that misuse the platform, spam others, or violate applicable law."
        ),
        heading("Updates"),
        paragraph(
          "These terms may be updated from time to time. Continued use of ImmFlow after changes means you accept the updated terms."
        ),
        contact(),
      ]),
    },
    {
      slug: "pricing",
      title: "Pricing",
      excerpt: "Free discovery for clients. ImmFlow Pro for professionals and power users.",
      footerColumn: "attorneys",
      footerSort: 30,
      body: pageDoc([
        hero("Simple pricing", "Free to start. Upgrade when you need Pro tools.", "Go to dashboard", "/dashboard"),
        heading("Free"),
        paragraph(
          "Browse professionals, apply to full-time job listings, and contact professionals as a client."
        ),
        heading("ImmFlow Pro"),
        paragraph(
          "AI matcher, unlimited active listings, hearing/outsource/contract listings, professional peer messaging, and priority intake for Pro clients."
        ),
        heading("Interpreter rates (typical)"),
        paragraph("$150/hour for remote, video, and phone. $200/hour for in-person sessions."),
        cta("Upgrade when ready", "Manage billing anytime from your dashboard.", "Open billing", "/dashboard"),
      ]),
    },
    {
      slug: "create-profile",
      title: "Create a professional profile",
      excerpt: "Join ImmFlow as an attorney or service provider.",
      footerColumn: "attorneys",
      footerSort: 10,
      body: pageDoc([
        hero(
          "Create your profile",
          "Attorneys, translators, interpreters, and clinicians can join ImmFlow.",
          "Sign up",
          "/"
        ),
        paragraph(
          "Sign up, choose a professional account, complete your profile, and submit for verification. Once approved, you can appear in search and receive inquiries."
        ),
        contact(),
      ]),
    },
    {
      slug: "privacy",
      title: "Privacy policy",
      excerpt: "How ImmFlow handles account and marketplace data.",
      footerColumn: "company",
      footerSort: 50,
      showInNav: false,
      body: pageDoc([
        hero("Privacy policy", "We collect account, profile, and transaction data to operate the marketplace."),
        paragraph(
          "We use industry-standard practices to protect your information. Payment card details are processed by Stripe and are not stored on ImmFlow servers."
        ),
        contact(),
      ]),
    },
  ];

  let created = 0;
  if (!prisma.cmsPage) {
    console.warn(
      "Skipping CMS pages — Prisma client has no cmsPage model.\n" +
        "On the server run:\n" +
        "  npx prisma migrate deploy\n" +
        "  npx prisma generate\n" +
        "Then re-run: npm run seed:additive"
    );
    return 0;
  }
  for (const p of pages) {
    const existing = await prisma.cmsPage.findUnique({ where: { slug: p.slug } });
    if (existing) {
      // Additive: never overwrite live-edited page content
      if (ADDITIVE) continue;
      await prisma.cmsPage.update({
        where: { slug: p.slug },
        data: {
          title: p.title,
          excerpt: p.excerpt,
          body: p.body,
          footerColumn: p.footerColumn,
          showInFooter: true,
          showInNav: Boolean(p.showInNav),
          footerSort: p.footerSort,
          isPublished: true,
        },
      });
      created += 1;
      continue;
    }
    await prisma.cmsPage.create({
      data: {
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        body: p.body,
        footerColumn: p.footerColumn,
        showInFooter: true,
        showInNav: Boolean(p.showInNav),
        footerSort: p.footerSort,
        navSort: 0,
        isPublished: true,
      },
    });
    created += 1;
  }
  return created;
}

async function seedSiteContent() {
  const contentData = [
    { key: "nav.logo_text", value: "ImmFlow", type: "text", section: "navigation", label: "Logo Brand Name" },
    { key: "nav.btn_login", value: "Log in", type: "text", section: "navigation", label: "Login Button Text" },
    { key: "nav.btn_signup", value: "Sign up", type: "text", section: "navigation", label: "Signup Button Text" },
    { key: "home.hero.badge", value: "Verified immigration service professionals", type: "text", section: "home.hero", label: "Hero Badge Tag" },
    { key: "home.hero.title", value: "Find the immigration service you need", type: "textarea", section: "home.hero", label: "Hero Heading Title" },
    { key: "home.hero.subtitle", value: "Discover verified attorneys, certified translators, interpreters, and psychological evaluation professionals.", type: "textarea", section: "home.hero", label: "Hero Subheading Description" },
    { key: "home.hero.cta_primary", value: "Browse services", type: "text", section: "home.hero", label: "Primary Button Label" },
    { key: "home.hero.cta_secondary", value: "Browse job board", type: "text", section: "home.hero", label: "Secondary Button Label" },
    { key: "home.hero.cta_tertiary", value: "Join free →", type: "text", section: "home.hero", label: "Tertiary Link Label" },
    { key: "home.stats.attorneys_count", value: "1,800+", type: "text", section: "home.stats", label: "Attorneys Count Stat" },
    { key: "home.stats.attorneys_label", value: "Verified attorneys", type: "text", section: "home.stats", label: "Attorneys Count Sublabel" },
    { key: "home.stats.states_count", value: "50 states", type: "text", section: "home.stats", label: "States Coverage Stat" },
    { key: "home.stats.states_label", value: "Coverage", type: "text", section: "home.stats", label: "States Coverage Sublabel" },
    { key: "home.stats.listings_count", value: "340+", type: "text", section: "home.stats", label: "Active Listings Stat" },
    { key: "home.stats.listings_label", value: "Active listings", type: "text", section: "home.stats", label: "Active Listings Sublabel" },
    { key: "home.stats.languages_count", value: "28", type: "text", section: "home.stats", label: "Languages Count Stat" },
    { key: "home.stats.languages_label", value: "Languages", type: "text", section: "home.stats", label: "Languages Count Sublabel" },
    { key: "home.how_it_works.badge", value: "Ways to use ImmFlow", type: "text", section: "home.how_it_works", label: "Section Badge Tag" },
    { key: "home.how_it_works.title", value: "Ways to use ImmFlow", type: "text", section: "home.how_it_works", label: "Section Heading Title" },
    { key: "home.card1.icon", value: "⚖️", type: "text", section: "home.card1", label: "Card 1 Icon Emoji" },
    { key: "home.card1.title", value: "Find an attorney", type: "text", section: "home.card1", label: "Card 1 Header Title" },
    { key: "home.card1.desc", value: "Browse verified immigration attorneys by case type, language, and availability.", type: "textarea", section: "home.card1", label: "Card 1 Body Paragraph" },
    { key: "home.card1.cta", value: "Browse attorneys", type: "text", section: "home.card1", label: "Card 1 Button Label" },
    { key: "home.card2.icon", value: "🌐", type: "text", section: "home.card2", label: "Card 2 Icon Emoji" },
    { key: "home.card2.title", value: "Translation, interpreters & psych", type: "text", section: "home.card2", label: "Card 2 Header Title" },
    { key: "home.card2.desc", value: "Book certified translation, interpreters ($150/hr remote · $200/hr in-person), and psychological evaluations.", type: "textarea", section: "home.card2", label: "Card 2 Body Paragraph" },
    { key: "home.card2.cta", value: "Browse services", type: "text", section: "home.card2", label: "Card 2 Button Label" },
    { key: "home.card3.icon", value: "🤝", type: "text", section: "home.card3", label: "Card 3 Icon Emoji" },
    { key: "home.card3.title", value: "Job board & attorney network", type: "text", section: "home.card3", label: "Card 3 Header Title" },
    { key: "home.card3.desc", value: "Post and find roles, hearing coverage, and peer connections for coverage, co-counsel, and referrals.", type: "textarea", section: "home.card3", label: "Card 3 Body Paragraph" },
    { key: "home.card3.cta", value: "Explore network", type: "text", section: "home.card3", label: "Card 3 Button Label" },
    { key: "home.ai.badge", value: "AI-powered", type: "text", section: "home.ai", label: "AI Section Badge" },
    { key: "home.ai.title", value: "Smart matching, not just search", type: "text", section: "home.ai", label: "AI Section Title" },
    { key: "home.ai.cta", value: "Try the AI matcher ✦", type: "text", section: "home.ai", label: "AI Section CTA Button" },
    { key: "home.featured.badge", value: "Featured", type: "text", section: "home.featured", label: "Featured Section Badge" },
    { key: "home.featured.title", value: "Top-rated attorneys", type: "text", section: "home.featured", label: "Featured Section Title" },
    { key: "home.featured.cta", value: "See all", type: "text", section: "home.featured", label: "Featured Section See All Link" },
    { key: "home.pricing.badge", value: "Pricing", type: "text", section: "home.pricing", label: "Pricing Section Badge" },
    { key: "home.pricing.title", value: "Simple, transparent pricing", type: "text", section: "home.pricing", label: "Pricing Section Title" },
    { key: "home.pricing.subtitle", value: "Free to start. Upgrade when you're ready to grow.", type: "textarea", section: "home.pricing", label: "Pricing Section Subtitle" },
    { key: "home.join.title", value: "Ready to join ImmFlow?", type: "text", section: "home.join", label: "CTA Banner Title" },
    { key: "home.join.subtitle", value: "Free to join. Find services, post listings, and grow your practice.", type: "textarea", section: "home.join", label: "CTA Banner Subtitle" },
    { key: "home.join.cta", value: "Create free account →", type: "text", section: "home.join", label: "CTA Banner Primary Button" },
    { key: "home.join.cta_secondary", value: "Browse listings", type: "text", section: "home.join", label: "CTA Banner Secondary Button" },
    { key: "footer.logo_text", value: "ImmFlow", type: "text", section: "footer", label: "Footer Logo Brand Name" },
    { key: "footer.description", value: "A marketplace for verified immigration attorneys, translators, interpreters, and psychological service professionals.", type: "textarea", section: "footer", label: "Footer Description Paragraph" },
    { key: "footer.copyright", value: "© 2026 ImmFlow. All rights reserved.", type: "text", section: "footer", label: "Copyright text" },
    { key: "footer.notes", value: "Verified providers · Discovery and connection only", type: "text", section: "footer", label: "Security Verification Note" },
    {
      key: "help.intro",
      value:
        "ImmFlow helps you discover and connect with independent immigration service professionals. ImmFlow does not provide legal, medical, interpreting, or translation advice.",
      type: "textarea",
      section: "help",
      label: "Help page introduction",
    },
    {
      key: "help.faq",
      value:
        "How are providers verified?|Administrators review the credentials appropriate to each provider category.\nHow do payments work?|Applicable orders and bookings use Stripe Checkout.\nWhat does the AI finder do?|It only helps identify a service category and relevant providers.\nWho is responsible for the service?|The independent provider is responsible for the service and its professional quality.",
      type: "textarea",
      section: "help",
      label: "FAQ (one question|answer per line)",
    },
  ];

  const contentByKey = Object.fromEntries(contentData.map((row) => [row.key, row.value]));
  const getSeedContent = (key, fallback) => contentByKey[key] ?? fallback;
  contentData.push({
    key: "home.layout",
    value: serializeHomepageDocument(buildDefaultHomepageDocument(getSeedContent)),
    type: "textarea",
    section: "home.layout",
    label: "Homepage layout (JSON blocks)",
  });

  let created = 0;
  for (const c of contentData) {
    const existing = await prisma.siteContent.findUnique({ where: { key: c.key } });
    if (existing) {
      // Additive: keep live CMS edits intact
      if (ADDITIVE) continue;
      await prisma.siteContent.update({ where: { key: c.key }, data: { value: c.value } });
      created += 1;
      continue;
    }
    await prisma.siteContent.create({ data: c });
    created += 1;
  }
  return created;
}

async function main() {
  console.log(`Seeding ImmFlow demo data… (mode=${ADDITIVE ? "additive / keep data" : "reset / wipe"})`);
  await wipe();

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const categories = await seedCategories();
  await seedAdmin(passwordHash);

  const attorneys = await seedAttorneys(passwordHash, categories.attorney);
  const { translators, interpreters, psychs } = await seedProviders(
    passwordHash,
    categories
  );
  const clients = await seedClients(passwordHash);

  // Avoid duplicating demo marketplace activity when re-seeding live
  const alreadySeededActivity =
    ADDITIVE &&
    attorneys.every((a) => a.reused) &&
    (await prisma.listing.count({ where: { postedById: attorneys[0]?.user?.id } })) > 0;

  let listings = [];
  let apps = 0;
  let orders = [];
  let bookings = [];
  let messages = 0;
  let reviews = 0;

  if (alreadySeededActivity) {
    console.log("Demo activity already present — skipping duplicate listings/orders/bookings/messages.");
    listings = await prisma.listing.findMany({
      where: { postedById: { in: attorneys.map((a) => a.user.id) } },
      take: 50,
    });
  } else {
    listings = await seedListings(attorneys);
    apps = await seedApplications(listings, attorneys, clients);
    orders = await seedTranslationOrders(clients, translators);
    bookings = await seedBookings(clients, interpreters, psychs);
    messages = await seedMessages(clients, attorneys, translators);
    reviews = await seedReviews(attorneys, clients, translators);
  }

  const pages = await seedCmsPages();
  const contentBlocks = await seedSiteContent();

  console.log("\n========== DEMO SEED COMPLETE ==========");
  console.log(`Attorneys:          ${attorneys.length}  (attorney1..15@demo.immflow.test)`);
  console.log(`Translators:        ${translators.length}  (translator1..12@demo.immflow.test)`);
  console.log(`Interpreters:       ${interpreters.length}  (interpreter1..12@demo.immflow.test)`);
  console.log(`Psych providers:    ${psychs.length}  (psych1..12@demo.immflow.test)`);
  console.log(`Clients:            ${clients.length}  (client1..15@demo.immflow.test)`);
  console.log(`Listings:           ${listings.length}`);
  console.log(`Applications:       ${apps}`);
  console.log(`Translation orders: ${orders.length}`);
  console.log(`Bookings:           ${bookings.length}`);
  console.log(`Messages:           ${messages}`);
  console.log(`Reviews:            ${reviews}`);
  console.log(`CMS pages:          ${pages}`);
  console.log(`Site content:       ${contentBlocks}`);
  console.log("\nPassword for ALL demo accounts: password");
  console.log("Admin:   admin@myimmflow.com / password");
  console.log("Content: content@myimmflow.com / password");
  console.log("Pro client:  client1@demo.immflow.test");
  console.log("Free client: client6@demo.immflow.test");
  console.log("Pro attorney: attorney1@demo.immflow.test");
  console.log("Free attorney: attorney9@demo.immflow.test");
  console.log("========================================\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
