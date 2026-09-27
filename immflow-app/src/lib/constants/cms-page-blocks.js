/** Pre-built section types admins can drop onto a CMS page. */

export const PAGE_BLOCK_TYPES = [
  {
    type: "hero",
    label: "Hero banner",
    description: "Large title, subtitle, and optional button",
    icon: "🎯",
  },
  {
    type: "heading",
    label: "Heading",
    description: "Section title (H2 / H3)",
    icon: "🔠",
  },
  {
    type: "paragraph",
    label: "Paragraph",
    description: "Body text with line breaks",
    icon: "¶",
  },
  {
    type: "richtext",
    label: "Rich text",
    description: "Formatted HTML content area",
    icon: "✍️",
  },
  {
    type: "image",
    label: "Image",
    description: "Image with optional caption",
    icon: "🖼️",
  },
  {
    type: "cards",
    label: "Feature cards",
    description: "2–3 cards in a row",
    icon: "▦",
  },
  {
    type: "faq",
    label: "FAQ accordion",
    description: "Questions and answers",
    icon: "❓",
  },
  {
    type: "cta",
    label: "Call to action",
    description: "Highlighted box with button",
    icon: "👉",
  },
  {
    type: "contact",
    label: "Contact details",
    description: "Email, phone, address block",
    icon: "✉️",
  },
  {
    type: "quote",
    label: "Quote",
    description: "Pull quote / testimonial",
    icon: "❝",
  },
  {
    type: "divider",
    label: "Divider",
    description: "Horizontal rule between sections",
    icon: "—",
  },
  {
    type: "html",
    label: "Custom HTML",
    description: "Free-hand HTML block",
    icon: "</>",
  },
];

export function createBlockId() {
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function defaultBlockData(type) {
  switch (type) {
    case "hero":
      return {
        eyebrow: "ImmFlow",
        title: "Page headline",
        subtitle: "Supporting sentence that explains this page.",
        buttonLabel: "Get started",
        buttonHref: "/",
        align: "left",
      };
    case "heading":
      return { text: "Section heading", level: 2 };
    case "paragraph":
      return { text: "Write your paragraph here." };
    case "richtext":
      return {
        html: "<p>Add formatted content. Use &lt;strong&gt;, lists, and links.</p>",
      };
    case "image":
      return {
        url: "",
        alt: "",
        caption: "",
        fullWidth: true,
      };
    case "cards":
      return {
        items: [
          { icon: "⚖️", title: "Card one", body: "Short description." },
          { icon: "🌐", title: "Card two", body: "Short description." },
          { icon: "🤝", title: "Card three", body: "Short description." },
        ],
      };
    case "faq":
      return {
        items: [
          { question: "Question one?", answer: "Answer for question one." },
          { question: "Question two?", answer: "Answer for question two." },
        ],
      };
    case "cta":
      return {
        title: "Ready to get started?",
        text: "Create a free account or browse services.",
        buttonLabel: "Browse services",
        buttonHref: "/services",
      };
    case "contact":
      return {
        email: "support@myimmflow.com",
        phone: "",
        address: "",
        note: "We usually reply within one business day.",
      };
    case "quote":
      return {
        text: "A short quote or testimonial.",
        attribution: "",
      };
    case "divider":
      return {};
    case "html":
      return {
        html: "<div class=\"custom\">\n  <p>Your custom HTML here</p>\n</div>",
      };
    default:
      return {};
  }
}

export function createBlock(type) {
  return {
    id: createBlockId(),
    type,
    data: defaultBlockData(type),
  };
}

export function createEmptyDocument({ mode = "blocks" } = {}) {
  return {
    version: 1,
    mode,
    blocks: mode === "blocks" ? [createBlock("paragraph")] : [],
    html: mode === "html" ? "<p>Start writing your page HTML…</p>" : "",
  };
}
