import React from "react";

/** 24×24 stroke icons. Names and older emoji values both resolve here. */
const PATHS = {
  scale: "M12 3v18M6 7h12M8 7 6.2 14.2a2.2 2.2 0 0 0 4.3 0L8 7M16 7l-1.8 7.2a2.2 2.2 0 0 0 4.3 0L16 7",
  document: "M8 3.5h6.2L19 8.2V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 7 20V5A1.5 1.5 0 0 1 8.5 3.5H8zM14 3.5V8.5H19M9.5 12.5h5M9.5 16h5",
  microphone: "M12 15.5a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6.5a3 3 0 0 0 3 3zM7 11.5a5 5 0 0 0 10 0M12 16.5V20M9 20h6",
  brain: "M9.5 5.5a3 3 0 0 1 5 0 3.2 3.2 0 0 1 3.2 4.2A3.2 3.2 0 0 1 15 14.5v1.2A2.3 2.3 0 0 1 12.7 18h-1.4A2.3 2.3 0 0 1 9 15.7V14.5a3.2 3.2 0 0 1-2.7-4.8A3.2 3.2 0 0 1 9.5 5.5zM12 8.5v6",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-3.5-3.5",
  chat: "M6 17.5 4 20V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v8A2.5 2.5 0 0 1 17.5 17H6z",
  home: "M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z",
  users: "M16 19v-1.2a3.2 3.2 0 0 0-2.2-3 4 4 0 1 0-1.2-7.6M8.5 11.2a3.2 3.2 0 0 0-2.3 3V19M9 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z",
  chart: "M4 19V5M4 19h16M8 16v-4M12 16V8M16 16v-6",
  cpu: "M9 9h6v6H9zM9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3",
  star: "M12 3.6 14.1 8.8l5.6.5-4.3 3.6 1.3 5.4L12 15.8 7.3 18.3l1.3-5.4L4.3 9.3l5.6-.5L12 3.6z",
  card: "M3.5 7.5h17v10h-17zM3.5 11h17",
  clipboard: "M9 4.5h6v2H9zM8 6.5H6.5A1.5 1.5 0 0 0 5 8v11.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8a1.5 1.5 0 0 0-1.5-1.5H16",
  pen: "M4 20l1.2-4.2L16.5 4.5a1.8 1.8 0 0 1 2.5 2.5L7.7 18.8 4 20z",
  user: "M12 12.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2zM5.5 20a6.5 6.5 0 0 1 13 0",
  calendar: "M5 6.5h14v13H5zM5 10.5h14M8 4.5v3M16 4.5v3",
  mail: "M4 7h16v11H4zM4 7l8 6 8-6",
  megaphone: "M5 10v4l9 3V7L5 10zM14 8.5c1.8.6 3 2 3 3.5s-1.2 2.9-3 3.5M6.5 14.2 7.4 18",
  settings: "M4 8h10M18 8h2M4 16h2M10 16h10M14 8a2 2 0 1 0 4 0 2 2 0 0 0-4 0zM6 16a2 2 0 1 0 4 0 2 2 0 0 0-4 0z",
  folder: "M3.5 7.5h6l2 2h9v9.5h-17z",
  shield: "M12 3.5 19 6.5v5.2c0 4.2-2.8 7.2-7 8.8-4.2-1.6-7-4.6-7-8.8V6.5L12 3.5z",
  alert: "M12 4.2 20.5 19H3.5L12 4.2zM12 10v4.2M12 16.8v.6",
  check: "M5 12.5 9.2 17 19 7",
  close: "M6 6l12 12M18 6 6 18",
  lock: "M8 11V8a4 4 0 0 1 8 0v3M6.5 11h11V20h-11z",
  building: "M5 20V5.5h8V20M13 20V9.5h6V20M8 8.5h2M8 12h2M8 15.5h2M16 12.5h2M16 16h2M4 20h16",
  banknotes: "M3.5 8h17v9h-17zM7 12.5h.01M17 12.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z",
  clock: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 8v4.5l3 2",
  briefcase: "M4 8.5h16v10.5H4zM9 8.5V6.8A1.8 1.8 0 0 1 10.8 5h2.4A1.8 1.8 0 0 1 15 6.8v1.7M4 13h16",
  id: "M3.5 6.5h17v11h-17zM8 12.2a1.6 1.6 0 1 0 0-3.2 1.6 1.6 0 0 0 0 3.2zM6.2 15.2c.4-1.1 1.2-1.6 1.8-1.6s1.4.5 1.8 1.6M12 10.5h6M12 13.5h5",
  image: "M4 6.5h16v11H4zM4 15l4-3.5 3 2.5 3-3 6 4",
  help: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM9.8 9.4a2.2 2.2 0 1 1 3.3 2c-.8.5-1.1 1-1.1 1.8V14M12 16.6v.4",
  layout: "M4 5h16v14H4zM4 10h16M10 10v9",
  minus: "M5 12h14",
  code: "M9 8.5 5.5 12 9 15.5M15 8.5 18.5 12 15 15.5",
  quote: "M8 16.5c-2.2 0-3.5-1.6-3.5-3.6 1.6-.2 2.8-1.4 2.8-3V8H4.5v5.2c0 2.4 1.6 3.3 3.5 3.3zM16.5 16.5c-2.2 0-3.5-1.6-3.5-3.6 1.6-.2 2.8-1.4 2.8-3V8H13v5.2c0 2.4 1.6 3.3 3.5 3.3z",
  spark: "M12 3.5v4M12 16.5v4M3.5 12h4M16.5 12h4M6.2 6.2l2.6 2.6M15.2 15.2l2.6 2.6M17.8 6.2l-2.6 2.6M8.8 15.2l-2.6 2.6",
  inbox: "M4 13.5 6.5 5.5h11L20 13.5V19H4zM4 13.5h4.2l1 2.2h5.6l1-2.2H20",
  globe: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM4 12h16M12 4c2.2 2.2 3.3 4.8 3.3 8S14.2 17.8 12 20c-2.2-2.2-3.3-4.8-3.3-8S9.8 6.2 12 4z",
  target: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12.6v-.2",
  text: "M6 6h12M8 6v12M16 6v12M6 18h12",
  arrow: "M5 12h14M13 6l6 6-6 6",
  "chevron-up": "M6 14.5 12 8.5l6 6",
  "chevron-down": "M6 9.5 12 15.5l6-6",
  info: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM12 11v5M12 8v.4",
  edit: "M4 20h4l10.2-10.2a2 2 0 0 0 0-2.8l-.2-.2a2 2 0 0 0-2.8 0L5 17v3z",
  layers: "M12 4 4 8.5 12 13l8-4.5L12 4zM4 12.5 12 17l8-4.5M4 16.5 12 21l8-4.5",
};

const ALIASES = {
  "⚖️": "scale",
  "⚖": "scale",
  attorney: "scale",
  "📄": "document",
  translation: "document",
  pages: "document",
  orders: "document",
  "🎙️": "microphone",
  "🎤": "microphone",
  interpreter: "microphone",
  "🧠": "brain",
  psychological: "brain",
  "🔍": "search",
  "💬": "chat",
  messages: "chat",
  "🏠": "home",
  overview: "home",
  "🤝": "users",
  network: "users",
  "📊": "chart",
  "🗂️": "layers",
  "🗂": "layers",
  categories: "layers",
  "🤖": "cpu",
  "⭐": "star",
  "🌟": "star",
  reviews: "star",
  "💳": "card",
  billing: "card",
  "📋": "clipboard",
  listings: "clipboard",
  "✍️": "pen",
  "✍": "pen",
  "👤": "user",
  profile: "user",
  "👥": "users",
  clients: "user",
  users: "users",
  "📅": "calendar",
  bookings: "calendar",
  "📨": "inbox",
  applications: "inbox",
  "📢": "megaphone",
  broadcast: "megaphone",
  "⚙️": "settings",
  "⚙": "settings",
  settings: "settings",
  "📁": "folder",
  "🛡️": "shield",
  "🛡": "shield",
  "⚠️": "alert",
  "⚠": "alert",
  "✓": "check",
  "✔": "check",
  "✕": "close",
  "✖": "close",
  "🔒": "lock",
  "🏢": "building",
  "💰": "banknotes",
  "🕐": "clock",
  "💼": "briefcase",
  "🪪": "id",
  providers: "id",
  "🖼️": "image",
  "🖼": "image",
  "❓": "help",
  "✉️": "mail",
  "✉": "mail",
  "❝": "quote",
  "✦": "spark",
  "🎉": "spark",
  "🎯": "target",
  "🌐": "globe",
  "🔠": "text",
  "¶": "text",
  "▦": "layout",
  "👉": "arrow",
  "</>": "code",
  "—": "minus",
  "✏️": "edit",
  "✏": "edit",
  cms: "edit",
  attorneys: "scale",
};

export function resolveIconName(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "spark";
  if (PATHS[raw]) return raw;
  if (ALIASES[raw]) return ALIASES[raw];
  return "spark";
}

export function iconSvg(name, className = "w-6 h-6") {
  const d = PATHS[resolveIconName(name)];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="${className}" aria-hidden="true"><path d="${d}"/></svg>`;
}

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}✦★☆✓✔✕✖⚠🔒🎉🌟]/gu;

/** Drop pictorial characters from visitor-facing copy. */
export function plainCopy(value) {
  if (typeof value !== "string") return value;
  return value.replace(EMOJI_RE, "").replace(/[ \t]{2,}/g, " ").trim();
}

export function Icon({ name, className = "w-5 h-5" }) {
  const d = PATHS[resolveIconName(name)];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export function StarIcon({ className = "w-3.5 h-3.5" }) {
  return <Icon name="star" className={className} />;
}

export function StarRow({ count = 0, className = "w-3.5 h-3.5" }) {
  const n = Math.max(0, Math.min(5, Number(count) || 0));
  return (
    <span className="inline-flex items-center gap-0.5 text-amber">
      {Array.from({ length: n }, (_, i) => (
        <Icon key={i} name="star" className={className} />
      ))}
    </span>
  );
}
