import React, { useState, useEffect, useRef } from "react";

const SUPABASE_URL = "https://ghdyntpgzgzkhrolshcj.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoZHludHBnemd6a2hyb2xzaGNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTg4MzIsImV4cCI6MjA5NDQ5NDgzMn0.F6VVHOLRsbGNjfpLEixEqEw-NNhUrQxlr6Mwbgm-w6g";

const api = (path, method = "GET", body) =>
  fetch(SUPABASE_URL + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: "Bearer " + SUPABASE_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => r.json());

const authApi = (path, body) =>
  fetch(SUPABASE_URL + "/auth/v1" + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_KEY },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const G = "#0F6E56";
const GD = "#085041";
const GL = "#E1F5EE";
const GM = "#5DCAA5";
const TX = "#1a1a18";
const MU = "#6b6b66";
const HI = "#a0a09a";
const BG = "#f7f6f2";
const WH = "#ffffff";
const BO = "rgba(0,0,0,0.09)";
const BM = "rgba(0,0,0,0.15)";
const AM = "#BA7517";
const AL = "#FAEEDA";
const RE = "#A32D2D";
const RL = "#FCEBEB";
const BL = "#185FA5";
const BLL = "#E6F1FB";

const attorneys = [
  {
    id: 1,
    initials: "MR",
    bg: "#E1F5EE",
    fg: "#085041",
    name: "Maria Reyes, Esq.",
    location: "Los Angeles, CA",
    exp: "12 yrs",
    tags: ["Removal defense", "Asylum", "DACA", "Spanish"],
    rate: "$175/hr",
    avail: "Available now",
    dot: G,
    stars: "4.9",
    reviews: 38,
  },
  {
    id: 2,
    initials: "JK",
    bg: "#E6F1FB",
    fg: "#0C447C",
    name: "James Kim, Esq.",
    location: "New York, NY",
    exp: "8 yrs",
    tags: ["H-1B", "EB-1/2", "L-1", "Korean"],
    rate: "$200/hr",
    avail: "Avail. in 3 days",
    dot: AM,
    stars: "4.8",
    reviews: 22,
  },
  {
    id: 3,
    initials: "SP",
    bg: "#EEEDFE",
    fg: "#3C3489",
    name: "Sunita Patel, Esq.",
    location: "Chicago, IL",
    exp: "15 yrs",
    tags: ["Family petition", "Naturalization", "Hindi", "Gujarati"],
    rate: "$225/hr",
    avail: "Available now",
    dot: G,
    stars: "5.0",
    reviews: 61,
  },
  {
    id: 4,
    initials: "TN",
    bg: "#FAEEDA",
    fg: "#633806",
    name: "Tomás Navarro, Esq.",
    location: "Miami, FL",
    exp: "10 yrs",
    tags: ["Asylum", "TPS", "Spanish", "Portuguese"],
    rate: "$160/hr",
    avail: "2 wk wait",
    dot: RE,
    stars: "4.7",
    reviews: 19,
  },
  {
    id: 5,
    initials: "DL",
    bg: "#FAECE7",
    fg: "#712B13",
    name: "Diana Lopez, Esq.",
    location: "Houston, TX",
    exp: "9 yrs",
    tags: ["Removal defense", "EOIR", "Spanish", "Hearing coverage"],
    rate: "$400 flat",
    avail: "Available now",
    dot: G,
    stars: "4.9",
    reviews: 40,
  },
  {
    id: 6,
    initials: "AW",
    bg: "#E1F5EE",
    fg: "#085041",
    name: "Aisha Williams, Esq.",
    location: "Atlanta, GA",
    exp: "11 yrs",
    tags: ["BIA appeals", "Co-counsel", "9th Cir", "Asylum"],
    rate: "$250/hr",
    avail: "Avail. in 5 days",
    dot: AM,
    stars: "5.0",
    reviews: 33,
  },
];

const jobs = [
  {
    id: 1,
    title: "Associate attorney — immigration boutique",
    org: "Pacific Immigration Law",
    location: "San Francisco, CA",
    type: "Full-time",
    badge: "New",
    bc: G,
    bb: GL,
    tags: ["Removal defense", "3+ yrs", "Spanish preferred"],
    pay: "$85k–$110k",
    applicants: 14,
    posted: "Today",
  },
  {
    id: 2,
    title: "Hearing coverage — master calendar, June 10",
    org: "Gonzalez & Associates",
    location: "Miami, FL",
    type: "One-time",
    badge: "Urgent",
    bc: RE,
    bb: RL,
    tags: ["EOIR", "Spanish required", "Hearing"],
    pay: "$500 flat",
    applicants: 4,
    posted: "2 hrs ago",
  },
  {
    id: 3,
    title: "Outsource — 20 DACA renewal filings",
    org: "Midwest Legal Group",
    location: "Chicago, IL",
    type: "Project",
    badge: "Open",
    bc: BL,
    bb: BLL,
    tags: ["DACA", "20 cases", "Flat rate"],
    pay: "$150/case",
    applicants: 9,
    posted: "1 day ago",
  },
  {
    id: 4,
    title: "Senior attorney — nonprofit immigration org",
    org: "RAICES",
    location: "San Antonio, TX",
    type: "Full-time",
    badge: "Featured",
    bc: AM,
    bb: AL,
    tags: ["Asylum", "Removal", "5+ yrs"],
    pay: "$75k–$95k",
    applicants: 31,
    posted: "3 days ago",
  },
  {
    id: 5,
    title: "Of counsel — immigration practice group",
    org: "Hartley & Partners LLP",
    location: "Seattle, WA",
    type: "Of counsel",
    badge: "New",
    bc: G,
    bb: GL,
    tags: ["Employment visas", "H-1B", "EB categories"],
    pay: "$200/hr",
    applicants: 7,
    posted: "Today",
  },
  {
    id: 6,
    title: "Contract attorney — USCIS filings (remote)",
    org: "ImmAssist Network",
    location: "Remote",
    type: "Contract",
    badge: "Open",
    bc: BL,
    bb: BLL,
    tags: ["Remote", "USCIS", "I-485", "I-130"],
    pay: "$125/hr",
    applicants: 22,
    posted: "5 days ago",
  },
];

function Tag({ children, green }) {
  return (
    <span
      style={{
        fontSize: 11,
        padding: "3px 9px",
        borderRadius: 20,
        background: green ? GL : "#f1efe8",
        border: "0.5px solid " + (green ? GM : BO),
        color: green ? GD : MU,
      }}
    >
      {children}
    </span>
  );
}

function Avatar({ initials, bg, fg }) {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function AttorneyCard({ a }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: WH,
        border: "0.5px solid " + (hov ? GM : BO),
        borderRadius: 14,
        padding: "1.25rem",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
        <Avatar initials={a.initials} bg={a.bg} fg={a.fg} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>{a.name}</div>
          <div style={{ fontSize: 12, color: MU }}>
            {a.location} · {a.exp}
          </div>
        </div>
      </div>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}
      >
        {a.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 12,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: a.dot,
              display: "inline-block",
            }}
          />
          <span style={{ color: MU }}>{a.avail}</span>
        </span>
        <span style={{ color: AM }}>★ {a.stars}</span>
        <span style={{ fontWeight: 500 }}>{a.rate}</span>
      </div>
    </div>
  );
}

function JobCard({ j }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: WH,
        border: "0.5px solid " + (hov ? GM : BO),
        borderRadius: 14,
        padding: "1.25rem",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            flex: 1,
            paddingRight: 10,
            lineHeight: 1.3,
          }}
        >
          {j.title}
        </div>
        <span
          style={{
            fontSize: 11,
            padding: "3px 9px",
            borderRadius: 20,
            background: j.bb,
            color: j.bc,
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          {j.badge}
        </span>
      </div>
      <div style={{ fontSize: 12, color: MU, marginBottom: 10 }}>
        🏢 {j.org} · {j.location}
      </div>
      <div
        style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}
      >
        <Tag green>{j.type}</Tag>
        {j.tags.map((t) => (
          <Tag key={t}>{t}</Tag>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, fontSize: 12, color: HI }}>
        <span>💰 {j.pay}</span>
        <span>👤 {j.applicants}</span>
        <span>🕐 {j.posted}</span>
      </div>
    </div>
  );
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onAuth }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [barNumber, setBarNumber] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handle = async () => {
    setError("");
    setSuccess("");
    setLoading(true);
    if (mode === "signup") {
      const res = await authApi("/signup", {
        email,
        password,
        data: { full_name: name, bar_number: barNumber, bar_state: state },
      });
      if (res.error) {
        setError(res.error.message);
      } else {
        setSuccess(
          "Account created! Please check your email to confirm, then log in."
        );
      }
    } else {
      const res = await authApi("/token?grant_type=password", {
        email,
        password,
      });
      if (res.error) {
        setError(res.error.message);
      } else {
        onAuth(res.user, res.access_token);
        onClose();
      }
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: WH,
          borderRadius: 16,
          padding: "2rem",
          width: 420,
          maxWidth: "90vw",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            Imm<span style={{ color: G }}>Flow</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: MU,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: "1.5rem" }}>
          {[
            ["signup", "Create account"],
            ["login", "Log in"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setMode(key);
                setError("");
                setSuccess("");
              }}
              style={{
                flex: 1,
                padding: "8px",
                borderRadius: 8,
                border: "0.5px solid " + (mode === key ? G : BO),
                background: mode === key ? G : "transparent",
                color: mode === key ? WH : MU,
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: mode === key ? 500 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "signup" && (
          <>
            <div style={{ marginBottom: "1rem" }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: MU,
                  marginBottom: 5,
                }}
              >
                Full name
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith, Esq."
                style={{
                  width: "100%",
                  fontFamily: "inherit",
                  fontSize: 14,
                  padding: "8px 12px",
                  border: "0.5px solid " + BM,
                  borderRadius: 8,
                  color: TX,
                }}
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: "1rem",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: MU,
                    marginBottom: 5,
                  }}
                >
                  Bar number
                </div>
                <input
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value)}
                  placeholder="e.g. 123456"
                  style={{
                    width: "100%",
                    fontFamily: "inherit",
                    fontSize: 14,
                    padding: "8px 12px",
                    border: "0.5px solid " + BM,
                    borderRadius: 8,
                    color: TX,
                  }}
                />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: MU,
                    marginBottom: 5,
                  }}
                >
                  State bar
                </div>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. CA"
                  style={{
                    width: "100%",
                    fontFamily: "inherit",
                    fontSize: 14,
                    padding: "8px 12px",
                    border: "0.5px solid " + BM,
                    borderRadius: 8,
                    color: TX,
                  }}
                />
              </div>
            </div>
          </>
        )}

        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: MU,
              marginBottom: 5,
            }}
          >
            Email
          </div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@lawfirm.com"
            style={{
              width: "100%",
              fontFamily: "inherit",
              fontSize: 14,
              padding: "8px 12px",
              border: "0.5px solid " + BM,
              borderRadius: 8,
              color: TX,
            }}
          />
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: MU,
              marginBottom: 5,
            }}
          >
            Password
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            style={{
              width: "100%",
              fontFamily: "inherit",
              fontSize: 14,
              padding: "8px 12px",
              border: "0.5px solid " + BM,
              borderRadius: 8,
              color: TX,
            }}
          />
        </div>

        {error && (
          <div
            style={{
              background: RL,
              color: RE,
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: "1rem",
            }}
          >
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div
            style={{
              background: GL,
              color: GD,
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 13,
              marginBottom: "1rem",
            }}
          >
            ✓ {success}
          </div>
        )}

        <button
          onClick={handle}
          disabled={loading}
          style={{
            background: G,
            color: WH,
            width: "100%",
            padding: "12px",
            borderRadius: 8,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            fontSize: 15,
            fontWeight: 500,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading
            ? "Please wait…"
            : mode === "signup"
            ? "Create attorney account"
            : "Log in"}
        </button>

        <p
          style={{
            fontSize: 12,
            color: HI,
            textAlign: "center",
            marginTop: "1rem",
            lineHeight: 1.6,
          }}
        >
          Immigration attorneys only. Bar number required for verification.
        </p>
      </div>
    </div>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
function Dashboard({ user, onLogout, setPage }) {
  const initials = (user?.user_metadata?.full_name || user?.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1.5rem" }}>
      <div
        style={{
          background: WH,
          border: "0.5px solid " + BO,
          borderRadius: 16,
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: GL,
              color: GD,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 500 }}>
              {user?.user_metadata?.full_name || "Attorney"}
            </div>
            <div style={{ fontSize: 13, color: MU }}>{user?.email}</div>
            <div style={{ fontSize: 12, color: G, marginTop: 2 }}>
              ✓ ImmFlow member · Bar: {user?.user_metadata?.bar_state || "—"}{" "}
              {user?.user_metadata?.bar_number || ""}
            </div>
          </div>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 10,
          }}
        >
          {[
            ["0", "Active listings"],
            ["0", "Applications"],
            ["0", "Profile views"],
          ].map(([n, l]) => (
            <div
              key={l}
              style={{
                background: BG,
                borderRadius: 10,
                padding: "1rem",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 24,
                  fontWeight: 800,
                }}
              >
                {n}
              </div>
              <div style={{ fontSize: 12, color: MU, marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: "1.5rem",
        }}
      >
        {[
          {
            icon: "📋",
            title: "Post a listing",
            desc: "Post a hearing, job, or outsource request",
            action: () => setPage("post"),
          },
          {
            icon: "🔍",
            title: "Find attorneys",
            desc: "Browse the attorney network",
            action: () => setPage("attorneys"),
          },
          {
            icon: "✦",
            title: "AI matcher",
            desc: "Find the perfect match with AI",
            action: () => setPage("matcher"),
          },
          {
            icon: "💼",
            title: "Job board",
            desc: "Browse all immigration listings",
            action: () => setPage("jobs"),
          },
        ].map((f) => (
          <div
            key={f.title}
            onClick={f.action}
            style={{
              background: WH,
              border: "0.5px solid " + BO,
              borderRadius: 14,
              padding: "1.25rem",
              cursor: "pointer",
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div style={{ fontSize: 24 }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 2 }}>
                {f.title}
              </div>
              <div style={{ fontSize: 12, color: MU }}>{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onLogout}
        style={{
          background: "transparent",
          color: RE,
          padding: "10px 22px",
          borderRadius: 8,
          border: "0.5px solid " + RE,
          cursor: "pointer",
          fontFamily: "inherit",
          fontSize: 13,
        }}
      >
        Log out
      </button>
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────
function Nav({ page, setPage, user, setShowAuth }) {
  return (
    <nav
      style={{
        background: WH,
        borderBottom: "0.5px solid " + BO,
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 1.5rem",
          height: 60,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          onClick={() => setPage("home")}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 22,
            fontWeight: 800,
            cursor: "pointer",
            color: TX,
          }}
        >
          Imm<span style={{ color: G }}>Flow</span>
        </div>
        <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          {[
            ["Find attorneys", "attorneys"],
            ["Job board", "jobs"],
            ["Network", "network"],
            ["AI matcher", "matcher"],
          ].map(([label, key]) => (
            <span
              key={key}
              onClick={() => setPage(key)}
              style={{
                fontSize: 14,
                color: page === key ? G : MU,
                fontWeight: page === key ? 500 : 400,
                cursor: "pointer",
              }}
            >
              {label}
            </span>
          ))}
          {user ? (
            <div
              onClick={() => setPage("dashboard")}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: GL,
                color: GD,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                border: "2px solid " + G,
              }}
            >
              {(user?.user_metadata?.full_name || user?.email || "?")
                .split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setShowAuth(true)}
                style={{
                  background: "transparent",
                  color: TX,
                  padding: "8px 16px",
                  borderRadius: 8,
                  fontSize: 14,
                  border: "0.5px solid " + BM,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Log in
              </button>
              <button
                onClick={() => setShowAuth(true)}
                style={{
                  background: G,
                  color: WH,
                  padding: "8px 18px",
                  borderRadius: 8,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function Footer({ setPage }) {
  return (
    <footer style={{ background: GD, padding: "3rem 1.5rem" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: "3rem",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 20,
              fontWeight: 800,
              color: WH,
              marginBottom: "0.75rem",
            }}
          >
            Imm<span style={{ color: GM }}>Flow</span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.55)",
              lineHeight: 1.7,
            }}
          >
            The immigration attorney network. Find coverage, post listings, and
            connect with fellow practitioners.
          </p>
        </div>
        {[
          [
            "Platform",
            [
              ["Find attorneys", "attorneys"],
              ["Job board", "jobs"],
              ["Network", "network"],
              ["AI matcher", "matcher"],
            ],
          ],
          [
            "Attorneys",
            [
              ["Create profile", "home"],
              ["Post listing", "post"],
              ["Pricing", "home"],
            ],
          ],
          [
            "Company",
            [
              ["About", "home"],
              ["Contact", "home"],
              ["Terms", "home"],
            ],
          ],
        ].map(([heading, links]) => (
          <div key={heading}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginBottom: "1rem",
              }}
            >
              {heading}
            </div>
            {links.map(([label, key]) => (
              <span
                key={label}
                onClick={() => setPage(key)}
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.65)",
                  display: "block",
                  marginBottom: "0.5rem",
                  cursor: "pointer",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div
        style={{
          maxWidth: 1100,
          margin: "2rem auto 0",
          paddingTop: "1.5rem",
          borderTop: "0.5px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          © 2026 ImmFlow. All rights reserved.
        </span>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Immigration attorneys only · Verified network
        </span>
      </div>
    </footer>
  );
}

function HomePage({ setPage, setShowAuth }) {
  return (
    <div>
      <section
        style={{
          background: WH,
          borderBottom: "0.5px solid " + BO,
          padding: "5rem 1.5rem 4rem",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1fr 400px",
            gap: "4rem",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: G,
                marginBottom: "1rem",
              }}
            >
              Immigration only · Verified attorneys
            </div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 50,
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-1px",
                marginBottom: "1.25rem",
                color: TX,
              }}
            >
              The network built for
              <br />
              <span style={{ color: G }}>immigration attorneys</span>
            </h1>
            <p
              style={{
                fontSize: 17,
                color: MU,
                lineHeight: 1.7,
                marginBottom: "2rem",
                maxWidth: 480,
              }}
            >
              Find hearing coverage, outsource cases, post jobs, and connect
              with fellow immigration practitioners.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                onClick={() => setPage("attorneys")}
                style={{
                  background: G,
                  color: WH,
                  padding: "12px 26px",
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Find an attorney
              </button>
              <button
                onClick={() => setPage("jobs")}
                style={{
                  background: "transparent",
                  color: TX,
                  padding: "12px 26px",
                  borderRadius: 8,
                  fontSize: 15,
                  border: "1px solid " + BM,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Browse job board
              </button>
              <button
                onClick={() => setShowAuth(true)}
                style={{
                  background: "transparent",
                  color: G,
                  padding: "12px 26px",
                  borderRadius: 8,
                  fontSize: 15,
                  border: "1px solid " + G,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Join free →
              </button>
            </div>
          </div>
          <div
            style={{
              background: WH,
              borderRadius: 16,
              border: "0.5px solid " + BO,
              padding: "1.5rem",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 500,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color: G,
                marginBottom: "0.75rem",
              }}
            >
              ✦ AI matched for you
            </div>
            {attorneys.slice(0, 3).map((a) => (
              <div
                key={a.id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "0.5px solid " + BO,
                }}
              >
                <Avatar initials={a.initials} bg={a.bg} fg={a.fg} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: MU }}>{a.location}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: G }}>
                    97%
                  </div>
                  <div style={{ fontSize: 10, color: HI }}>fit score</div>
                </div>
              </div>
            ))}
            <button
              onClick={() => setPage("matcher")}
              style={{
                background: G,
                color: WH,
                width: "100%",
                marginTop: "1rem",
                padding: "10px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                fontWeight: 500,
              }}
            >
              Run AI match ✦
            </button>
          </div>
        </div>
      </section>

      <div style={{ background: GD, padding: "1.5rem" }}>
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            gap: "3rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            ["1,800+", "Verified attorneys"],
            ["50 states", "Coverage"],
            ["340+", "Active listings"],
            ["28", "Languages"],
          ].map(([n, l]) => (
            <div key={l} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 28,
                  fontWeight: 800,
                  color: WH,
                }}
              >
                {n}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "rgba(255,255,255,0.6)",
                  marginTop: 2,
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      </div>

      <section style={{ background: WH, padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: G,
              marginBottom: "0.75rem",
            }}
          >
            How it works
          </div>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 36,
              fontWeight: 800,
              marginBottom: "2rem",
              color: TX,
            }}
          >
            Three ways to use ImmFlow
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
            }}
          >
            {[
              {
                icon: "⚖️",
                title: "Find an attorney",
                desc: "Browse verified immigration attorneys by case type, language, and availability.",
                cta: "Browse attorneys",
                page: "attorneys",
              },
              {
                icon: "📋",
                title: "Job board",
                desc: "Post and find full-time roles, hearing coverage, and outsource projects.",
                cta: "View listings",
                page: "jobs",
              },
              {
                icon: "🤝",
                title: "Attorney network",
                desc: "Attorney-to-attorney connections for coverage, co-counsel, and referrals.",
                cta: "Join network",
                page: "network",
              },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  background: WH,
                  border: "0.5px solid " + BO,
                  borderRadius: 14,
                  padding: "1.5rem",
                }}
              >
                <div style={{ fontSize: 32, marginBottom: "0.75rem" }}>
                  {f.icon}
                </div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 500,
                    marginBottom: "0.5rem",
                  }}
                >
                  {f.title}
                </div>
                <p
                  style={{
                    fontSize: 14,
                    color: MU,
                    lineHeight: 1.7,
                    marginBottom: "1.25rem",
                  }}
                >
                  {f.desc}
                </p>
                <button
                  onClick={() => setPage(f.page)}
                  style={{
                    background: G,
                    color: WH,
                    padding: "8px 18px",
                    borderRadius: 8,
                    fontSize: 13,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {f.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{ background: GD, padding: "4rem 1.5rem", textAlign: "center" }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 36,
              fontWeight: 800,
              color: WH,
              marginBottom: "1rem",
            }}
          >
            Ready to join ImmFlow?
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.65)",
              marginBottom: "2rem",
              lineHeight: 1.7,
            }}
          >
            Free to join. Post listings, find coverage, build your reputation.
          </p>
          <button
            onClick={() => setShowAuth(true)}
            style={{
              background: WH,
              color: GD,
              padding: "14px 32px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Create free attorney account →
          </button>
        </div>
      </section>
    </div>
  );
}

function AttorneysPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const filters = [
    "Removal defense",
    "Asylum",
    "Family petition",
    "H-1B",
    "DACA",
    "Naturalization",
    "Spanish",
    "Mandarin",
    "Hindi",
  ];
  const filtered = attorneys.filter(
    (a) =>
      (search === "" ||
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))) &&
      (selected.length === 0 || selected.some((s) => a.tags.includes(s)))
  );
  return (
    <div>
      <div
        style={{
          background: WH,
          borderBottom: "0.5px solid " + BO,
          padding: "2.5rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: G,
              marginBottom: "0.75rem",
            }}
          >
            Immigration attorneys
          </div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 36,
              fontWeight: 800,
              marginBottom: "1.25rem",
              color: TX,
            }}
          >
            Find your attorney
          </h1>
          <div
            style={{
              display: "flex",
              gap: 8,
              background: WH,
              border: "0.5px solid " + BM,
              borderRadius: 10,
              padding: "6px 6px 6px 16px",
              alignItems: "center",
              marginBottom: "1rem",
            }}
          >
            <span style={{ color: HI }}>🔍</span>
            <input
              style={{
                border: "none",
                background: "transparent",
                fontSize: 14,
                outline: "none",
                flex: 1,
                fontFamily: "inherit",
                color: TX,
              }}
              placeholder="Search by name, specialty, language…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              style={{
                background: G,
                color: WH,
                padding: "8px 18px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
              }}
            >
              Search
            </button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {filters.map((f) => (
              <button
                key={f}
                onClick={() =>
                  setSelected((s) =>
                    s.includes(f) ? s.filter((x) => x !== f) : [...s, f]
                  )
                }
                style={{
                  fontSize: 12,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "0.5px solid " + (selected.includes(f) ? G : BO),
                  background: selected.includes(f) ? G : "#f1efe8",
                  color: selected.includes(f) ? WH : MU,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 1.5rem" }}>
        <div style={{ fontSize: 13, color: MU, marginBottom: "1rem" }}>
          {filtered.length} attorneys found
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((a) => (
            <AttorneyCard key={a.id} a={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function JobsPage() {
  const [tab, setTab] = useState("all");
  const tabs = [
    ["all", "All listings"],
    ["job", "Jobs"],
    ["hearing", "Hearings"],
    ["outsource", "Outsource"],
    ["contract", "Contract"],
  ];
  const typeMap = {
    job: "Full-time",
    hearing: "One-time",
    outsource: "Project",
    contract: "Contract",
  };
  const filtered =
    tab === "all" ? jobs : jobs.filter((j) => j.type === typeMap[tab]);
  return (
    <div>
      <div
        style={{
          background: WH,
          borderBottom: "0.5px solid " + BO,
          padding: "2.5rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: G,
              marginBottom: "0.75rem",
            }}
          >
            Job board
          </div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 36,
              fontWeight: 800,
              marginBottom: "1.25rem",
              color: TX,
            }}
          >
            Immigration listings
          </h1>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {tabs.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "0.5px solid " + (tab === key ? G : BO),
                  background: tab === key ? G : "transparent",
                  color: tab === key ? WH : MU,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 1.5rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "1rem",
          }}
        >
          <span style={{ fontSize: 13, color: MU }}>
            {filtered.length} listings
          </span>
          <button
            style={{
              background: G,
              color: WH,
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 13,
            }}
          >
            + Post a listing
          </button>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 14,
          }}
        >
          {filtered.map((j) => (
            <JobCard key={j.id} j={j} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NetworkPage() {
  return (
    <div>
      <div
        style={{
          background: WH,
          borderBottom: "0.5px solid " + BO,
          padding: "2.5rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: G,
              marginBottom: "0.75rem",
            }}
          >
            Attorney network
          </div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 36,
              fontWeight: 800,
              marginBottom: ".75rem",
              color: TX,
            }}
          >
            Attorney-to-attorney
          </h1>
          <p
            style={{ fontSize: 16, color: MU, maxWidth: 560, lineHeight: 1.7 }}
          >
            Find fellow immigration attorneys for hearing coverage, outsourcing,
            co-counsel, and referrals.
          </p>
        </div>
      </div>
      <div style={{ maxWidth: 1100, margin: "2rem auto", padding: "0 1.5rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
            marginBottom: "2rem",
          }}
        >
          {[
            [
              "⚖️",
              "Hearing coverage",
              "Find attorneys for master calendar, merits, and bond hearings.",
            ],
            [
              "📁",
              "Case outsourcing",
              "Offload filings and full cases to vetted immigration attorneys.",
            ],
            [
              "🤝",
              "Co-counsel",
              "Find co-counsel for complex removal, asylum, or circuit court cases.",
            ],
            [
              "📄",
              "Of counsel",
              "Formalize referral relationships with immigration specialists.",
            ],
          ].map(([icon, title, desc]) => (
            <div
              key={title}
              style={{
                background: WH,
                border: "0.5px solid " + BO,
                borderRadius: 14,
                padding: "1.5rem",
              }}
            >
              <div style={{ fontSize: 28, marginBottom: ".75rem" }}>{icon}</div>
              <div
                style={{ fontSize: 16, fontWeight: 500, marginBottom: ".5rem" }}
              >
                {title}
              </div>
              <p style={{ fontSize: 13, color: MU, lineHeight: 1.7 }}>{desc}</p>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 14,
          }}
        >
          {attorneys.map((a) => (
            <AttorneyCard key={a.id} a={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MatcherPage() {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [checks, setChecks] = useState([false, false, false, false, false]);
  const [needType, setNeedType] = useState("Hearing coverage");
  const [caseType, setCaseType] = useState("Removal defense");
  const checkLabels = [
    "Filtering by jurisdiction & court",
    "Matching visa & case specialty",
    "Checking language requirements",
    "Verifying availability",
    "Scoring & ranking matches",
  ];
  const runMatch = () => {
    setStep(1);
    setProgress(0);
    setChecks([false, false, false, false, false]);
    let i = 0;
    const pcts = [20, 42, 60, 78, 95];
    const tick = () => {
      if (i >= 5) {
        setTimeout(() => setStep(2), 600);
        return;
      }
      setProgress(pcts[i]);
      setChecks((c) => c.map((v, idx) => (idx <= i ? true : v)));
      i++;
      setTimeout(tick, 700);
    };
    setTimeout(tick, 400);
  };
  const matches = [
    {
      initials: "DL",
      bg: "#E1F5EE",
      fg: "#085041",
      name: "Diana Lopez, Esq.",
      meta: "Houston, TX · 9 yrs · EOIR · Spanish (native)",
      score: 97,
      scoreColor: G,
      reason:
        "Native Spanish speaker with 9 years of EOIR removal defense in Houston. Available June 10.",
      tags: [
        "Removal defense",
        "Houston EOIR",
        "Spanish native",
        "Available now",
      ],
      avail: "Available now",
      rate: "$400 flat/hearing",
      reviews: "4.9 (40)",
      best: true,
    },
    {
      initials: "MR",
      bg: "#FAEEDA",
      fg: "#633806",
      name: "Miguel Reyes, Esq.",
      meta: "Houston, TX · 7 yrs · EOIR · Spanish (fluent)",
      score: 88,
      scoreColor: G,
      reason: "Fluent Spanish, strong EOIR removal record in Houston.",
      tags: ["Removal defense", "Houston EOIR", "Spanish fluent"],
      avail: "Available now",
      rate: "$350 flat/hearing",
      reviews: "4.7 (22)",
      best: false,
    },
    {
      initials: "TC",
      bg: "#EEEDFE",
      fg: "#3C3489",
      name: "Teresa Cruz, Esq.",
      meta: "San Antonio, TX · 12 yrs · EOIR, BIA",
      score: 74,
      scoreColor: AM,
      reason:
        "Highly experienced native Spanish speaker, but based in San Antonio — travel required.",
      tags: ["Removal defense", "Spanish native", "Travel required"],
      avail: "Available · travel req.",
      rate: "$500 flat + travel",
      reviews: "5.0 (61)",
      best: false,
    },
  ];
  return (
    <div>
      <div
        style={{
          background: WH,
          borderBottom: "0.5px solid " + BO,
          padding: "2rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {["Describe need", "AI matching", "Your matches"].map(
              (label, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: step > i ? G : step === i ? GL : "#f1efe8",
                      border: "1px solid " + (step >= i ? G : BO),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 500,
                      color: step > i ? WH : step === i ? G : MU,
                    }}
                  >
                    {step > i ? "✓" : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      color: step === i ? TX : MU,
                      fontWeight: step === i ? 500 : 400,
                    }}
                  >
                    {label}
                  </span>
                  {i < 2 && (
                    <span style={{ color: BO, margin: "0 4px" }}>—</span>
                  )}
                </div>
              )
            )}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: "2rem auto", padding: "0 1.5rem" }}>
        {step === 0 && (
          <div>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 26,
                fontWeight: 800,
                marginBottom: ".5rem",
                color: TX,
              }}
            >
              What do you need?
            </h2>
            <p style={{ fontSize: 14, color: MU, marginBottom: "1.5rem" }}>
              Describe it in plain language or use the options below.
            </p>
            <div
              style={{
                display: "flex",
                gap: 8,
                background: GL,
                border: "0.5px solid " + GM,
                borderRadius: 10,
                padding: "8px 8px 8px 14px",
                alignItems: "center",
                marginBottom: "1.25rem",
              }}
            >
              <span style={{ color: G }}>✦</span>
              <input
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: 14,
                  outline: "none",
                  flex: 1,
                  fontFamily: "inherit",
                  color: TX,
                }}
                placeholder='e.g. "Spanish removal attorney in Texas for June hearing"'
              />
            </div>
            {[
              [
                "Type of need",
                [
                  "Hearing coverage",
                  "Case outsourcing",
                  "Co-counsel",
                  "Full-time hire",
                  "Contract",
                ],
                needType,
                setNeedType,
              ],
              [
                "Case / visa type",
                [
                  "Removal defense",
                  "Asylum",
                  "H-1B",
                  "Family petition",
                  "DACA",
                  "Naturalization",
                  "BIA appeals",
                ],
                caseType,
                setCaseType,
              ],
            ].map(([label, options, val, setter]) => (
              <div key={label} style={{ marginBottom: "1.25rem" }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: MU,
                    marginBottom: "0.5rem",
                  }}
                >
                  {label}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {options.map((o) => (
                    <button
                      key={o}
                      onClick={() => setter(o)}
                      style={{
                        fontSize: 12,
                        padding: "6px 14px",
                        borderRadius: 20,
                        border: "0.5px solid " + (val === o ? G : BO),
                        background: val === o ? G : "transparent",
                        color: val === o ? WH : MU,
                        cursor: "pointer",
                        fontFamily: "inherit",
                      }}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={runMatch}
              style={{
                background: G,
                color: WH,
                padding: "12px 26px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              ✦ Find matches with AI
            </button>
          </div>
        )}
        {step === 1 && (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: GL,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 26,
                margin: "0 auto 1.25rem",
              }}
            >
              ✦
            </div>
            <h2
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 22,
                fontWeight: 800,
                marginBottom: ".5rem",
                color: TX,
              }}
            >
              AI is finding your matches
            </h2>
            <p style={{ fontSize: 14, color: MU, marginBottom: "1.5rem" }}>
              Scanning 1,800+ verified attorneys…
            </p>
            <div
              style={{
                background: "#f1efe8",
                borderRadius: 20,
                height: 6,
                overflow: "hidden",
                marginBottom: "1rem",
              }}
            >
              <div
                style={{
                  height: "100%",
                  background: G,
                  borderRadius: 20,
                  width: progress + "%",
                  transition: "width .4s ease",
                }}
              />
            </div>
            <div style={{ textAlign: "left" }}>
              {checkLabels.map((label, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                    borderBottom: "0.5px solid " + BO,
                    fontSize: 13,
                    color: checks[i] ? TX : MU,
                  }}
                >
                  <span style={{ color: checks[i] ? G : HI }}>
                    {checks[i] ? "✓" : "○"}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: "1.25rem",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: 22,
                  fontWeight: 800,
                  color: TX,
                }}
              >
                3 attorneys found
              </h2>
              <span style={{ fontSize: 12, color: MU }}>
                Ranked by fit score
              </span>
            </div>
            {matches.map((m, i) => (
              <div
                key={i}
                style={{
                  background: WH,
                  border:
                    (m.best ? "2px" : "0.5px") + " solid " + (m.best ? G : BO),
                  borderRadius: 14,
                  padding: "1.25rem",
                  marginBottom: 10,
                }}
              >
                {m.best && (
                  <span
                    style={{
                      fontSize: 11,
                      padding: "3px 9px",
                      borderRadius: 20,
                      background: GL,
                      color: GD,
                      fontWeight: 500,
                      display: "inline-block",
                      marginBottom: 8,
                    }}
                  >
                    ✦ Best match
                  </span>
                )}
                <div style={{ display: "flex", gap: 10, marginBottom: 8 }}>
                  <Avatar initials={m.initials} bg={m.bg} fg={m.fg} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>
                      {m.name}
                    </div>
                    <div style={{ fontSize: 11, color: MU }}>{m.meta}</div>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 22,
                        fontWeight: 800,
                        color: m.scoreColor,
                        lineHeight: 1,
                      }}
                    >
                      {m.score}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: HI,
                        textTransform: "uppercase",
                      }}
                    >
                      fit score
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    background: "#f1efe8",
                    borderRadius: 4,
                    height: 4,
                    marginBottom: 8,
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      background: m.scoreColor,
                      borderRadius: 4,
                      width: m.score + "%",
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: MU,
                    background: GL,
                    borderRadius: "0 6px 6px 6px",
                    borderLeft: "2px solid " + G,
                    padding: "8px 10px",
                    marginBottom: 8,
                    lineHeight: 1.6,
                  }}
                >
                  ✦ {m.reason}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 5,
                    marginBottom: 10,
                  }}
                >
                  {m.tags.map((t) => (
                    <Tag key={t} green>
                      {t}
                    </Tag>
                  ))}
                  <Tag>★ {m.reviews}</Tag>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: 12, color: MU }}>
                    {m.avail} · {m.rate}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      style={{
                        background: "transparent",
                        color: TX,
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "0.5px solid " + BM,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 12,
                      }}
                    >
                      View profile
                    </button>
                    <button
                      style={{
                        background: G,
                        color: WH,
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 12,
                      }}
                    >
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                setStep(0);
                setProgress(0);
                setChecks([false, false, false, false, false]);
              }}
              style={{
                background: "transparent",
                color: TX,
                padding: "10px 22px",
                borderRadius: 8,
                border: "0.5px solid " + BM,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                marginTop: "0.5rem",
              }}
            >
              ↺ New search
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PostPage({ user, setShowAuth }) {
  const [type, setType] = useState("Heari///////////////////////////////////////////////////ng coverage");
  const [title, setTitle] = useState("");
  const [org, setOrg] = useState("");
  const [location, setLocation] = useState("");
  const [pay, setPay] = useState("");
  const [desc, setDesc] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    setLoading(true);
    await api("/rest/v1/listings", "POST", {
      title,
      org,
      location,
      pay,
      description: desc,
      type,
      user_id: user.id,
    });
    setSuccess(true);
    setLoading(false);
  };

  if (success)
    return (
      <div
        style={{
          maxWidth: 680,
          margin: "4rem auto",
          padding: "0 1.5rem",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: "1rem" }}>🎉</div>
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 28,
            fontWeight: 800,
            marginBottom: "0.75rem",
            color: TX,
          }}
        >
          Listing posted!
        </h2>
        <p style={{ fontSize: 16, color: MU, marginBottom: "2rem" }}>
          Your listing is now live on ImmFlow.
        </p>
        <button
          onClick={() => setSuccess(false)}
          style={{
            background: G,
            color: WH,
            padding: "12px 26px",
            borderRadius: 8,
            border: "none",
            cursor: "pointer",
            fontFamily: "inherit",
            fontSize: 15,
          }}
        >
          Post another
        </button>
      </div>
    );

  return (
    <div>
      <div
        style={{
          background: WH,
          borderBottom: "0.5px solid " + BO,
          padding: "2.5rem 1.5rem",
        }}
      >
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 500,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: G,
              marginBottom: "0.75rem",
            }}
          >
            Post a listing
          </div>
          <h1
            style={{
              fontFamily: "'Syne', sans-serif",
              fontSize: 32,
              fontWeight: 800,
              marginBottom: ".75rem",
              color: TX,
            }}
          >
            What are you posting?
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              "Hearing coverage",
              "Case outsourcing",
              "Full-time job",
              "Contract / temp",
              "Of counsel",
            ].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                style={{
                  padding: "8px 18px",
                  borderRadius: 8,
                  border: "0.5px solid " + (type === t ? G : BO),
                  background: type === t ? G : "transparent",
                  color: type === t ? WH : MU,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 680, margin: "2rem auto", padding: "0 1.5rem" }}>
        {!user && (
          <div
            style={{
              background: AL,
              border: "0.5px solid " + AM,
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: "1.5rem",
              fontSize: 13,
              color: "#633806",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span>⚠️ You need an account to post a listing.</span>
            <button
              onClick={() => setShowAuth(true)}
              style={{
                background: AM,
                color: WH,
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: 12,
              }}
            >
              Sign up free
            </button>
          </div>
        )}
        <div
          style={{
            background: WH,
            border: "0.5px solid " + BO,
            borderRadius: 14,
            padding: "1.5rem",
          }}
        >
          {[
            [
              "Listing title",
              title,
              setTitle,
              "e.g. Hearing coverage — removal defense, June 10",
            ],
            ["Organization / firm", org, setOrg, "Your firm name"],
            ["Location", location, setLocation, "City, State"],
            ["Compensation", pay, setPay, "e.g. $500 flat, $175/hr"],
          ].map(([label, val, setter, ph]) => (
            <div key={label} style={{ marginBottom: "1.25rem" }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  marginBottom: 5,
                  color: TX,
                }}
              >
                {label}
              </div>
              <input
                value={val}
                onChange={(e) => setter(e.target.value)}
                placeholder={ph}
                style={{
                  width: "100%",
                  fontFamily: "inherit",
                  fontSize: 14,
                  padding: "8px 12px",
                  border: "0.5px solid " + BM,
                  borderRadius: 8,
                  color: TX,
                }}
              />
            </div>
          ))}
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                marginBottom: 5,
                color: TX,
              }}
            >
              Description
            </div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Describe the role, case, or hearing in detail…"
              style={{
                width: "100%",
                fontFamily: "inherit",
                fontSize: 13,
                padding: "10px 12px",
                border: "0.5px solid " + BM,
                borderRadius: 8,
                minHeight: 100,
                resize: "vertical",
                color: TX,
              }}
            />
          </div>
          <button
            onClick={submit}
            disabled={loading}
            style={{
              background: G,
              color: WH,
              width: "100%",
              padding: "12px",
              borderRadius: 8,
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              fontSize: 15,
              fontWeight: 500,
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Publishing…" : "Publish listing"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("home");
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState(null);
  const topRef = useRef(null);

  useEffect(() => {
    if (topRef.current) topRef.current.scrollIntoView({ behavior: "smooth" });
  }, [page]);

  const handleAuth = (u) => {
    setUser(u);
    setPage("dashboard");
  };
  const handleLogout = () => {
    setUser(null);
    setPage("home");
  };

  const pages = {
    home: HomePage,
    attorneys: AttorneysPage,
    jobs: JobsPage,
    network: NetworkPage,
    matcher: MatcherPage,
    post: PostPage,
    dashboard: Dashboard,
  };
  const Page = pages[page] || HomePage;

  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: BG,
        minHeight: "100vh",
        color: TX,
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      <div ref={topRef} />
      <Nav
        page={page}
        setPage={setPage}
        user={user}
        setShowAuth={setShowAuth}
      />
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onAuth={handleAuth} />
      )}
      <Page
        setPage={setPage}
        user={user}
        setShowAuth={setShowAuth}
        onLogout={handleLogout}
      />
      <Footer setPage={setPage} />
    </div>
  );
}
