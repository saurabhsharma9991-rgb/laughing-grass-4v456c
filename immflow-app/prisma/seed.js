import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import { getMariaDbPoolConfig } from "../src/lib/db-config.js";

const adapter = new PrismaMariaDb({
  ...getMariaDbPoolConfig(),
  connectionLimit: 5,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding started...");

  // Clean the database in order
  await prisma.application.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.listing.deleteMany({});
  await prisma.attorney.deleteMany({});
  await prisma.siteContent.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash("password", 10);

  // 1. Seed Users and Attorneys
  const attorneyData = [
    {
      name: "Maria Reyes, Esq.",
      email: "maria.reyes@lawfirm.com",
      initials: "MR",
      location: "Los Angeles, CA",
      experienceYears: 12,
      specialties: JSON.stringify(["Removal defense", "Asylum", "DACA"]),
      languages: JSON.stringify(["Spanish"]),
      rate: "$175/hr",
      availability: "Available now",
      stars: 4.9,
      reviewsCount: 38,
      barNumber: "BAR123456",
      stateBar: "CA",
    },
    {
      name: "James Kim, Esq.",
      email: "james.kim@lawfirm.com",
      initials: "JK",
      location: "New York, NY",
      experienceYears: 8,
      specialties: JSON.stringify(["H-1B", "EB-1/2", "L-1"]),
      languages: JSON.stringify(["Korean"]),
      rate: "$200/hr",
      availability: "Avail. in 3 days",
      stars: 4.8,
      reviewsCount: 22,
      barNumber: "BAR654321",
      stateBar: "NY",
    },
    {
      name: "Sunita Patel, Esq.",
      email: "sunita.patel@lawfirm.com",
      initials: "SP",
      location: "Chicago, IL",
      experienceYears: 15,
      specialties: JSON.stringify(["Family petition", "Naturalization"]),
      languages: JSON.stringify(["Hindi", "Gujarati"]),
      rate: "$225/hr",
      availability: "Available now",
      stars: 5.0,
      reviewsCount: 61,
      barNumber: "BAR987654",
      stateBar: "IL",
    },
    {
      name: "Tomás Navarro, Esq.",
      email: "tomas.navarro@lawfirm.com",
      initials: "TN",
      location: "Miami, FL",
      experienceYears: 10,
      specialties: JSON.stringify(["Asylum", "TPS"]),
      languages: JSON.stringify(["Spanish", "Portuguese"]),
      rate: "$160/hr",
      availability: "2 wk wait",
      stars: 4.7,
      reviewsCount: 19,
      barNumber: "BAR456789",
      stateBar: "FL",
    },
    {
      name: "Diana Lopez, Esq.",
      email: "diana.lopez@lawfirm.com",
      initials: "DL",
      location: "Houston, TX",
      experienceYears: 9,
      specialties: JSON.stringify(["Removal defense", "EOIR", "Hearing coverage"]),
      languages: JSON.stringify(["Spanish"]),
      rate: "$400 flat",
      availability: "Available now",
      stars: 4.9,
      reviewsCount: 40,
      barNumber: "BAR321654",
      stateBar: "TX",
    },
    {
      name: "Aisha Williams, Esq.",
      email: "aisha.williams@lawfirm.com",
      initials: "AW",
      location: "Atlanta, GA",
      experienceYears: 11,
      specialties: JSON.stringify(["BIA appeals", "Co-counsel", "9th Cir", "Asylum"]),
      languages: JSON.stringify([]),
      rate: "$250/hr",
      availability: "Avail. in 5 days",
      stars: 5.0,
      reviewsCount: 33,
      barNumber: "BAR789123",
      stateBar: "GA",
    }
  ];

  const createdUsers = [];

  for (const a of attorneyData) {
    const user = await prisma.user.create({
      data: {
        email: a.email,
        passwordHash,
        role: "attorney",
        emailVerified: true,
      }
    });

    createdUsers.push(user);

    await prisma.attorney.create({
      data: {
        userId: user.id,
        name: a.name,
        initials: a.initials,
        location: a.location,
        experienceYears: a.experienceYears,
        specialties: a.specialties,
        languages: a.languages,
        rate: a.rate,
        availability: a.availability,
        stars: a.stars,
        reviewsCount: a.reviewsCount,
        barNumber: a.barNumber,
        stateBar: a.stateBar,
        isVerified: true,
      }
    });
  }

  // 2. Seed Listings
  const listingsData = [
    {
      title: "Associate attorney — immigration boutique",
      org: "Pacific Immigration Law",
      location: "San Francisco, CA",
      type: "Full-time",
      badge: "New",
      tags: JSON.stringify(["Removal defense", "3+ yrs", "Spanish preferred"]),
      pay: "$85k–$110k",
      applicantsCount: 14,
    },
    {
      title: "Hearing coverage — master calendar, June 10",
      org: "Gonzalez & Associates",
      location: "Miami, FL",
      type: "One-time",
      badge: "Urgent",
      tags: JSON.stringify(["EOIR", "Spanish required", "Hearing"]),
      pay: "$500 flat",
      applicantsCount: 4,
    },
    {
      title: "Outsource — 20 DACA renewal filings",
      org: "Midwest Legal Group",
      location: "Chicago, IL",
      type: "Project",
      badge: "Open",
      tags: JSON.stringify(["DACA", "20 cases", "Flat rate"]),
      pay: "$150/case",
      applicantsCount: 9,
    },
    {
      title: "Senior attorney — nonprofit immigration org",
      org: "RAICES",
      location: "San Antonio, TX",
      type: "Full-time",
      badge: "Featured",
      tags: JSON.stringify(["Asylum", "Removal", "5+ yrs"]),
      pay: "$75k–$95k",
      applicantsCount: 31,
    },
    {
      title: "Of counsel — immigration practice group",
      org: "Hartley & Partners LLP",
      location: "Seattle, WA",
      type: "Of counsel",
      badge: "New",
      tags: JSON.stringify(["Employment visas", "H-1B", "EB categories"]),
      pay: "$200/hr",
      applicantsCount: 7,
    },
    {
      title: "Contract attorney — USCIS filings (remote)",
      org: "ImmAssist Network",
      location: "Remote",
      type: "Contract",
      badge: "Open",
      tags: JSON.stringify(["Remote", "USCIS", "I-485", "I-130"]),
      pay: "$125/hr",
      applicantsCount: 22,
    }
  ];

  for (const l of listingsData) {
    await prisma.listing.create({
      data: {
        title: l.title,
        org: l.org,
        location: l.location,
        type: l.type,
        badge: l.badge,
        tags: l.tags,
        pay: l.pay,
        applicantsCount: l.applicantsCount,
        postedById: createdUsers[0].id,
      }
    });
  }

  // 3. Seed Default Admin User
  await prisma.user.create({
    data: {
      email: "admin@myimmflow.com",
      passwordHash,
      role: "admin",
      emailVerified: true,
    }
  });
  console.log("Admin user seeded: admin@myimmflow.com / password");

  // 4. Seed Site Content Blocks
  const contentData = [
    // Navigation
    { key: "nav.logo_text", value: "ImmFlow", type: "text", section: "navigation", label: "Logo Brand Name" },
    { key: "nav.btn_login", value: "Log in", type: "text", section: "navigation", label: "Login Button Text" },
    { key: "nav.btn_signup", value: "Sign up", type: "text", section: "navigation", label: "Signup Button Text" },
    
    // Home Hero
    { key: "home.hero.badge", value: "Immigration only · Verified attorneys", type: "text", section: "home.hero", label: "Hero Badge Tag" },
    { key: "home.hero.title", value: "The network built for\nimmigration attorneys", type: "textarea", section: "home.hero", label: "Hero Heading Title" },
    { key: "home.hero.subtitle", value: "Find hearing coverage, outsource cases, post jobs, and connect with fellow immigration practitioners — all in one verified network.", type: "textarea", section: "home.hero", label: "Hero Subheading Description" },
    { key: "home.hero.cta_primary", value: "Find an attorney", type: "text", section: "home.hero", label: "Primary Button Label (Find Attorney)" },
    { key: "home.hero.cta_secondary", value: "Browse job board", type: "text", section: "home.hero", label: "Secondary Button Label (Browse Jobs)" },
    { key: "home.hero.cta_tertiary", value: "Join free →", type: "text", section: "home.hero", label: "Tertiary Link Label (Join Free)" },
    
    // Home Stats Banner
    { key: "home.stats.attorneys_count", value: "1,800+", type: "text", section: "home.stats", label: "Attorneys Count Stat" },
    { key: "home.stats.attorneys_label", value: "Verified attorneys", type: "text", section: "home.stats", label: "Attorneys Count Sublabel" },
    { key: "home.stats.states_count", value: "50 states", type: "text", section: "home.stats", label: "States Coverage Stat" },
    { key: "home.stats.states_label", value: "Coverage", type: "text", section: "home.stats", label: "States Coverage Sublabel" },
    { key: "home.stats.listings_count", value: "340+", type: "text", section: "home.stats", label: "Active Listings Stat" },
    { key: "home.stats.listings_label", value: "Active listings", type: "text", section: "home.stats", label: "Active Listings Sublabel" },
    { key: "home.stats.languages_count", value: "28", type: "text", section: "home.stats", label: "Languages Count Stat" },
    { key: "home.stats.languages_label", value: "Languages", type: "text", section: "home.stats", label: "Languages Count Sublabel" },
    
    // Home How It Works
    { key: "home.how_it_works.badge", value: "How it works", type: "text", section: "home.how_it_works", label: "Section Badge Tag" },
    { key: "home.how_it_works.title", value: "Three ways to use ImmFlow", type: "text", section: "home.how_it_works", label: "Section Heading Title" },
    
    // Home Card 1
    { key: "home.card1.icon", value: "⚖️", type: "text", section: "home.card1", label: "Card 1 Icon Emoji" },
    { key: "home.card1.title", value: "Find an attorney", type: "text", section: "home.card1", label: "Card 1 Header Title" },
    { key: "home.card1.desc", value: "Browse verified immigration attorneys by case type, language, and availability.", type: "textarea", section: "home.card1", label: "Card 1 Body Paragraph" },
    { key: "home.card1.cta", value: "Browse attorneys", type: "text", section: "home.card1", label: "Card 1 Button Label" },
    
    // Home Card 2
    { key: "home.card2.icon", value: "📋", type: "text", section: "home.card2", label: "Card 2 Icon Emoji" },
    { key: "home.card2.title", value: "Job board", type: "text", section: "home.card2", label: "Card 2 Header Title" },
    { key: "home.card2.desc", value: "Post and find full-time roles, hearing coverage, and outsource projects.", type: "textarea", section: "home.card2", label: "Card 2 Body Paragraph" },
    { key: "home.card2.cta", value: "View listings", type: "text", section: "home.card2", label: "Card 2 Button Label" },
    
    // Home Card 3
    { key: "home.card3.icon", value: "🤝", type: "text", section: "home.card3", label: "Card 3 Icon Emoji" },
    { key: "home.card3.title", value: "Attorney network", type: "text", section: "home.card3", label: "Card 3 Header Title" },
    { key: "home.card3.desc", value: "Attorney-to-attorney connections for coverage, co-counsel, and referrals.", type: "textarea", section: "home.card3", label: "Card 3 Body Paragraph" },
    { key: "home.card3.cta", value: "Join network", type: "text", section: "home.card3", label: "Card 3 Button Label" },
    
    // Home AI Section
    { key: "home.ai.badge", value: "AI-powered", type: "text", section: "home.ai", label: "AI Section Badge" },
    { key: "home.ai.title", value: "Smart matching, not just search", type: "text", section: "home.ai", label: "AI Section Title" },
    { key: "home.ai.cta", value: "Try the AI matcher ✦", type: "text", section: "home.ai", label: "AI Section CTA Button" },

    // Home Featured Section
    { key: "home.featured.badge", value: "Featured", type: "text", section: "home.featured", label: "Featured Section Badge" },
    { key: "home.featured.title", value: "Top-rated attorneys", type: "text", section: "home.featured", label: "Featured Section Title" },
    { key: "home.featured.cta", value: "See all", type: "text", section: "home.featured", label: "Featured Section See All Link" },

    // Home Pricing Section
    { key: "home.pricing.badge", value: "Pricing", type: "text", section: "home.pricing", label: "Pricing Section Badge" },
    { key: "home.pricing.title", value: "Simple, transparent pricing", type: "text", section: "home.pricing", label: "Pricing Section Title" },
    { key: "home.pricing.subtitle", value: "Free to start. Upgrade when you're ready to grow.", type: "textarea", section: "home.pricing", label: "Pricing Section Subtitle" },

    // Home Join CTA Section
    { key: "home.join.title", value: "Ready to join ImmFlow?", type: "text", section: "home.join", label: "CTA Banner Title" },
    { key: "home.join.subtitle", value: "Free to join. Post listings, find coverage, build your reputation.", type: "textarea", section: "home.join", label: "CTA Banner Subtitle" },
    { key: "home.join.cta", value: "Create free attorney account →", type: "text", section: "home.join", label: "CTA Banner Primary Button" },
    { key: "home.join.cta_secondary", value: "Browse listings", type: "text", section: "home.join", label: "CTA Banner Secondary Button" },
    
    // Footer
    { key: "footer.logo_text", value: "ImmFlow", type: "text", section: "footer", label: "Footer Logo Brand Name" },
    { key: "footer.description", value: "The immigration attorney network. Find coverage, post listings, and connect with fellow practitioners.", type: "textarea", section: "footer", label: "Footer Description Paragraph" },
    { key: "footer.copyright", value: "© 2026 ImmFlow. All rights reserved.", type: "text", section: "footer", label: "Copyright text" },
    { key: "footer.notes", value: "Immigration attorneys only · Verified network", type: "text", section: "footer", label: "Security Verification Note" },
  ];

  for (const c of contentData) {
    await prisma.siteContent.create({
      data: c
    });
  }
  console.log(`${contentData.length} site content blocks seeded successfully.`);
  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
