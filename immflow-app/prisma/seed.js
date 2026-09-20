import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import { getMariaDbPoolConfig } from "../src/lib/db-config.js";
import {
  buildFullPermissions,
  normalizePermissions,
  SUPER_ADMIN_SLUG,
} from "../src/lib/constants/admin-permissions.js";

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
  await prisma.providerCredential.deleteMany({});
  await prisma.providerLanguagePair.deleteMany({});
  await prisma.provider.deleteMany({});
  await prisma.attorney.deleteMany({});
  await prisma.siteContent.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.adminRole.deleteMany({});

  // Ensure marketplace categories exist (idempotent)
  const categoryDefs = [
    {
      slug: "attorney",
      name: "Immigration Attorneys",
      description: "Verified immigration attorneys for hearing coverage, outsourcing, and referrals.",
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
        fields: ["translatorType", "languagePairs", "certification", "turnaround", "rushAvailable", "documentTypes"],
      },
    },
    {
      slug: "interpreter",
      name: "Interpreters",
      description: "In-person, phone, and video interpretation for legal and immigration settings.",
      icon: "mic",
      sortOrder: 3,
      profileSchema: {
        fields: ["languagePairs", "serviceTypes", "hourlyRate", "minimumBooking"],
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
          "licenseExpires",
          "evaluationTypes",
          "telehealth",
        ],
      },
    },
  ];

  for (const cat of categoryDefs) {
    await prisma.serviceCategory.upsert({
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
  const attorneyCategory = await prisma.serviceCategory.findUnique({ where: { slug: "attorney" } });

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
        signupStatus: "approved",
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

    if (attorneyCategory) {
      const provider = await prisma.provider.create({
        data: {
          userId: user.id,
          categoryId: attorneyCategory.id,
          displayName: a.name,
          initials: a.initials,
          location: a.location,
          experienceYears: a.experienceYears,
          languages: a.languages,
          rate: a.rate,
          availability: a.availability,
          stars: a.stars,
          reviewsCount: a.reviewsCount,
          verificationStatus: "verified",
          remoteAvailable: true,
          inPersonAvailable: true,
          profileData: {
            barNumber: a.barNumber,
            stateBar: a.stateBar,
            specialties: a.specialties,
          },
        },
      });
      await prisma.providerCredential.create({
        data: {
          providerId: provider.id,
          label: "State bar",
          organization: a.stateBar,
          credentialNumber: a.barNumber,
          status: "verified",
        },
      });
    }
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

  // 3. Seed admin roles and default super admin
  const superAdminRole = await prisma.adminRole.create({
    data: {
      name: "Super Admin",
      slug: SUPER_ADMIN_SLUG,
      description: "Full access to every admin area. Cannot be deleted.",
      permissions: JSON.stringify(buildFullPermissions()),
      isSystem: true,
    },
  });

  await prisma.adminRole.create({
    data: {
      name: "Content Manager",
      slug: "content_manager",
      description: "Edit site content and view platform settings.",
      permissions: JSON.stringify(
        normalizePermissions({
          cms: { view: true, edit: true },
          settings: { view: true },
          analytics: { view: true },
        })
      ),
      isSystem: false,
    },
  });

  await prisma.adminRole.create({
    data: {
      name: "Support",
      slug: "support",
      description: "Moderate providers, orders, bookings, attorneys, and listings.",
      permissions: JSON.stringify(
        normalizePermissions({
          categories: { view: true },
          providers: { view: true, edit: true },
          orders: { view: true, edit: true },
          bookings: { view: true, edit: true },
          attorneys: { view: true, edit: true },
          listings: { view: true, edit: true, delete: true },
          analytics: { view: true },
        })
      ),
      isSystem: false,
    },
  });

  await prisma.user.create({
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
  console.log("Admin user seeded: admin@myimmflow.com / password (Super Admin role)");

  // 4. Seed Site Content Blocks
  const contentData = [
    // Navigation
    { key: "nav.logo_text", value: "ImmFlow", type: "text", section: "navigation", label: "Logo Brand Name" },
    { key: "nav.btn_login", value: "Log in", type: "text", section: "navigation", label: "Login Button Text" },
    { key: "nav.btn_signup", value: "Sign up", type: "text", section: "navigation", label: "Signup Button Text" },
    
    // Home Hero
    { key: "home.hero.badge", value: "Verified immigration service professionals", type: "text", section: "home.hero", label: "Hero Badge Tag" },
    { key: "home.hero.title", value: "Find the immigration service you need", type: "textarea", section: "home.hero", label: "Hero Heading Title" },
    { key: "home.hero.subtitle", value: "Discover verified attorneys, certified translators, interpreters, and psychological evaluation professionals.", type: "textarea", section: "home.hero", label: "Hero Subheading Description" },
    { key: "home.hero.cta_primary", value: "Browse services", type: "text", section: "home.hero", label: "Primary Button Label (Browse Services)" },
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
    { key: "footer.description", value: "A marketplace for verified immigration attorneys, translators, interpreters, and psychological service professionals.", type: "textarea", section: "footer", label: "Footer Description Paragraph" },
    { key: "footer.copyright", value: "© 2026 ImmFlow. All rights reserved.", type: "text", section: "footer", label: "Copyright text" },
    { key: "footer.notes", value: "Verified providers · Discovery and connection only", type: "text", section: "footer", label: "Security Verification Note" },

    // Help & FAQ
    {
      key: "help.intro",
      value: "ImmFlow helps you discover and connect with independent immigration service professionals. ImmFlow does not provide legal, medical, interpreting, or translation advice.",
      type: "textarea",
      section: "help",
      label: "Help page introduction",
      translations: {
        es: "ImmFlow le ayuda a encontrar profesionales independientes de servicios de inmigración. ImmFlow no brinda asesoramiento legal, médico, de interpretación ni de traducción.",
        hi: "ImmFlow स्वतंत्र इमिग्रेशन सेवा पेशेवरों को खोजने और उनसे जुड़ने में मदद करता है। ImmFlow कानूनी, चिकित्सा, दुभाषिया या अनुवाद सलाह नहीं देता।",
        ru: "ImmFlow помогает найти независимых специалистов по иммиграционным услугам. ImmFlow не предоставляет юридические, медицинские, устные или письменные переводы.",
        zh: "ImmFlow 帮助您寻找并联系独立的移民服务专业人士。ImmFlow 不提供法律、医疗、口译或翻译建议。"
      }
    },
    {
      key: "help.faq",
      value: "How are providers verified?|Administrators review the credentials appropriate to each provider category.\nHow do payments work?|Applicable orders and bookings use Stripe Checkout. Providers do not receive card details.\nWhat does the AI finder do?|It only helps identify a service category and relevant providers. It does not give professional advice.\nWho is responsible for the service?|The independent provider is responsible for the service and its professional quality.",
      type: "textarea",
      section: "help",
      label: "FAQ (one question|answer per line)",
      translations: {
        es: "¿Cómo se verifican los proveedores?|Los administradores revisan las credenciales correspondientes a cada categoría.\n¿Cómo funcionan los pagos?|Los pedidos y reservas aplicables usan Stripe Checkout.\n¿Qué hace el buscador de IA?|Solo ayuda a identificar servicios y proveedores; no ofrece asesoramiento profesional.\n¿Quién es responsable del servicio?|El proveedor independiente es responsable del servicio y de su calidad.",
        hi: "प्रदाताओं का सत्यापन कैसे होता है?|प्रशासक प्रत्येक श्रेणी के उपयुक्त प्रमाणपत्रों की समीक्षा करते हैं।\nभुगतान कैसे होता है?|लागू ऑर्डर और बुकिंग Stripe Checkout का उपयोग करते हैं।\nAI फ़ाइंडर क्या करता है?|यह केवल सेवा और प्रदाता खोजता है; पेशेवर सलाह नहीं देता।\nसेवा के लिए कौन जिम्मेदार है?|स्वतंत्र प्रदाता सेवा और उसकी गुणवत्ता के लिए जिम्मेदार है।",
        ru: "Как проверяются поставщики?|Администраторы проверяют документы для каждой категории.\nКак работают платежи?|Для соответствующих заказов используется Stripe Checkout.\nЧто делает ИИ-поиск?|Он только помогает найти услугу и поставщика, но не даёт профессиональных советов.\nКто отвечает за услугу?|Независимый поставщик отвечает за услугу и её качество.",
        zh: "如何验证服务商？|管理员会审核各服务类别所需的资质。\n如何付款？|适用的订单和预约使用 Stripe Checkout。\nAI 查找器做什么？|它只帮助寻找服务和服务商，不提供专业建议。\n谁对服务负责？|独立服务商对服务及其专业质量负责。"
      }
    },
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
