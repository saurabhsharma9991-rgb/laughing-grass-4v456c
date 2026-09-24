import React, { useState, useEffect } from "react";
import { useI18n } from "@/components/I18nProvider";
import DynamicProfileFields from "@/components/DynamicProfileFields";

export default function AuthModal({
  onClose,
  onAuth,
  initialMode = "signup",
  resetToken: resetTokenProp = "",
  initialError = "",
  initialAccountType = "seeker",
  intentLabel = "",
}) {
  const { t, locale } = useI18n();
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState(resetTokenProp);
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState(initialAccountType);
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setMode(initialMode);
    setAccountType(initialAccountType);
    if (resetTokenProp) setResetToken(resetTokenProp);
    if (initialError) setError(initialError);
  }, [initialMode, initialAccountType, resetTokenProp, initialError]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data.filter((c) => c.slug !== "attorney"));
        }
      })
      .catch(() => {});
  }, []);

  const [barNumber, setBarNumber] = useState("");
  const [state, setState] = useState("");
  const [translatorType, setTranslatorType] = useState("Professional Translator");
  const [sourceLang, setSourceLang] = useState("");
  const [targetLang, setTargetLang] = useState("English");
  const [offersCertified, setOffersCertified] = useState(true);
  const [turnaroundDays, setTurnaroundDays] = useState("3");
  const [basePrice, setBasePrice] = useState("49");
  const [dynamicProfileData, setDynamicProfileData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedCategory = categories.find((c) => String(c.id) === String(categoryId));
  const isTranslationSignup =
    accountType === "provider" && selectedCategory?.slug === "translation";

  const handleSignupLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Full name is required.");
          setLoading(false);
          return;
        }
        if (accountType === "attorney") {
          if (!barNumber.trim()) {
            setError("Bar number is required.");
            setLoading(false);
            return;
          }
          if (!state.trim()) {
            setError("State bar is required.");
            setLoading(false);
            return;
          }
        }
        if (accountType === "provider" && !categoryId) {
          setError("Please select a service category.");
          setLoading(false);
          return;
        }
        if (accountType === "provider") {
          const missingField = selectedCategory?.profileSchema?.fields?.find((field) => {
            if (!field.required) return false;
            const value = dynamicProfileData[field.key];
            return (
              value === undefined ||
              value === null ||
              value === "" ||
              (Array.isArray(value) && value.length === 0)
            );
          });
          if (missingField) {
            setError(`${missingField.label || missingField.key} is required.`);
            setLoading(false);
            return;
          }
        }
        if (isTranslationSignup) {
          if (!sourceLang || !targetLang) {
            setError("Add at least one language pair (source and target).");
            setLoading(false);
            return;
          }
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          setLoading(false);
          return;
        }

        const payload = {
          email,
          password,
          accountType,
          data: {
            full_name: name,
            locale,
            ...(accountType === "attorney"
              ? { bar_number: barNumber, bar_state: state }
              : {}),
            ...(accountType === "provider"
              ? {
                  category_id: Number(categoryId),
                  ...(isTranslationSignup
                    ? {
                        translator_type: translatorType,
                        offers_certified: offersCertified,
                        turnaround_days: Number(turnaroundDays) || 3,
                        rush_available: true,
                        base_price_cents: Math.round((Number(basePrice) || 49) * 100),
                        rate: `$${Number(basePrice) || 49}`,
                        language_pairs: [
                          { source: sourceLang, target: targetLang },
                        ],
                        languages: [sourceLang, targetLang].filter(Boolean),
                        profile_data: dynamicProfileData,
                      }
                    : { profile_data: dynamicProfileData }),
                }
              : {}),
          },
        };

        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify(payload),
        });
        const res = await response.json();

        if (res.error) {
          setError(res.error.message);
        } else if (res.requiresVerification) {
          setSuccess(res.message || "Check your email to verify your account before logging in.");
          setMode("verify");
        } else if (res.user) {
          onAuth(res.user);
          onClose();
        } else {
          setSuccess(res.message || "Account created successfully.");
        }
      } else {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ email, password }),
        });
        const res = await response.json();

        if (res.error) {
          if (res.error.code === "EMAIL_NOT_VERIFIED") {
            setMode("verify");
          }
          setError(res.error.message);
        } else if (res.user) {
          onAuth(res.user);
          onClose();
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const res = await response.json();

      if (res.error) {
        setError(res.error.message);
      } else {
        setSuccess(res.message);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: resetToken, password }),
      });
      const res = await response.json();

      if (res.error) {
        setError(res.error.message);
      } else {
        setSuccess(res.message);
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const res = await response.json();

      if (res.error) {
        setError(res.error.message);
      } else {
        setSuccess(res.message);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === "forgot") return handleForgotPassword();
    if (mode === "reset") return handleResetPassword();
    if (mode === "verify") return handleResendVerification();
    return handleSignupLogin();
  };

  const title =
    mode === "forgot"
      ? "Reset your password"
      : mode === "reset"
      ? "Choose a new password"
      : mode === "verify"
      ? "Verify your email"
      : null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[1000] flex items-center justify-center backdrop-blur-xs">
      <div className="bg-white rounded-lg p-8 w-[420px] max-w-[90vw] shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <div className="font-syne text-xl font-extrabold text-text">
            Imm<span className="text-green">Flow</span>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border-none cursor-pointer text-xl text-muted hover:text-text"
          >
            ✕
          </button>
        </div>

        {title && (
          <h2 className="font-syne text-lg font-bold text-text mb-4">{title}</h2>
        )}
        {intentLabel && (mode === "signup" || mode === "login") && (
          <p className="text-sm text-muted mb-4 leading-relaxed">{intentLabel}</p>
        )}

        {(mode === "signup" || mode === "login") && (
          <div className="flex gap-1.5 mb-6">
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
                className={`flex-1 py-2 px-3 rounded-lg border text-xs cursor-pointer font-medium transition-all duration-200 ${
                  mode === key
                    ? "border-green bg-green text-white"
                    : "border-[rgba(0,0,0,0.09)] bg-transparent text-muted hover:text-text"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {mode === "signup" && (
          <>
            <div className="mb-4">
              <div className="text-xs font-medium text-muted mb-1">{t("auth.signupAs", "Sign up as")}</div>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value)}
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-white text-text focus:outline-none focus:border-green"
              >
                <option value="seeker">{t("auth.seeker", "Client / looking for services")}</option>
                <option value="attorney">{t("auth.attorney", "Immigration attorney")}</option>
                <option value="provider">{t("auth.provider", "Service provider")}</option>
              </select>
            </div>
            <div className="mb-4">
              <div className="text-xs font-medium text-muted mb-1">{t("auth.fullName", "Full name")}</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
              />
            </div>
            {accountType === "attorney" && (
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                <div>
                  <div className="text-xs font-medium text-muted mb-1">{t("auth.barNumber", "Bar number")}</div>
                  <input
                    value={barNumber}
                    onChange={(e) => setBarNumber(e.target.value)}
                    placeholder="e.g. 123456"
                    className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
                  />
                </div>
                <div>
                  <div className="text-xs font-medium text-muted mb-1">{t("auth.stateBar", "State bar")}</div>
                  <input
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. CA"
                    className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
                  />
                </div>
              </div>
            )}
            {accountType === "provider" && (
              <div className="mb-4">
                <div className="text-xs font-medium text-muted mb-1">{t("auth.selectCategory", "Service category")}</div>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-white text-text focus:outline-none focus:border-green"
                >
                  <option value="">Select…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {isTranslationSignup && (
              <div className="mb-4 space-y-3 border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
                <div className="text-xs font-semibold text-text">Translator details</div>
                <div>
                  <div className="text-xs font-medium text-muted mb-1">Provider type</div>
                  <select
                    value={translatorType}
                    onChange={(e) => setTranslatorType(e.target.value)}
                    className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg bg-white"
                  >
                    <option>Certified Translator</option>
                    <option>Professional Translator</option>
                    <option>Translation Agency</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs font-medium text-muted mb-1">Source language</div>
                    <input
                      value={sourceLang}
                      onChange={(e) => setSourceLang(e.target.value)}
                      placeholder="e.g. Hindi"
                      className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted mb-1">Target language</div>
                    <input
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value)}
                      placeholder="e.g. English"
                      className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs font-medium text-muted mb-1">Base price (USD)</div>
                    <input
                      type="number"
                      min="15"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted mb-1">Turnaround (days)</div>
                    <input
                      type="number"
                      min="1"
                      value={turnaroundDays}
                      onChange={(e) => setTurnaroundDays(e.target.value)}
                      className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-text">
                  <input
                    type="checkbox"
                    checked={offersCertified}
                    onChange={(e) => setOffersCertified(e.target.checked)}
                  />
                  I offer certified / attested translations
                </label>
                <p className="text-[10px] text-muted leading-relaxed">
                  Do not claim blanket “USCIS certified” status. Verification is granted by ImmFlow admins after review.
                </p>
              </div>
            )}
            {accountType === "provider" && selectedCategory?.profileSchema && (
              <div className="mb-4 border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
                <div className="text-xs font-semibold text-text mb-3">
                  {selectedCategory.name} profile
                </div>
                <DynamicProfileFields
                  schema={selectedCategory.profileSchema}
                  values={dynamicProfileData}
                  onChange={setDynamicProfileData}
                  excludeKeys={
                    isTranslationSignup
                      ? [
                          "translatorType",
                          "languagePairs",
                          "turnaround",
                          "rushAvailable",
                        ]
                      : []
                  }
                />
              </div>
            )}
          </>
        )}

        {(mode === "signup" || mode === "login" || mode === "forgot" || mode === "verify") && (
          <div className="mb-4">
            <div className="text-xs font-medium text-muted mb-1">Email</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              readOnly={mode === "verify" && Boolean(email)}
              className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
            />
          </div>
        )}

        {mode === "verify" && (
          <p className="text-xs text-muted-high mb-4 leading-relaxed">
            We sent a verification link to your inbox. Click the link to activate your account, then log in.
            Did not receive it? Resend below.
          </p>
        )}

        {(mode === "signup" || mode === "login" || mode === "reset") && (
          <div className="mb-5">
            <div className="text-xs font-medium text-muted mb-1">
              {mode === "reset" ? "New password" : "Password"}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
            />
          </div>
        )}

        {mode === "reset" && (
          <>
            <div className="mb-4">
              <div className="text-xs font-medium text-muted mb-1">Reset token</div>
              <input
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste token from your reset email"
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
              />
            </div>
            <div className="mb-5">
              <div className="text-xs font-medium text-muted mb-1">Confirm password</div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
              />
            </div>
          </>
        )}

        {error && (
          <div className="bg-red-light text-red py-2.5 px-3 rounded-lg text-[13px] mb-4">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="bg-green-light text-green-dark py-2.5 px-3 rounded-lg text-[13px] mb-4 break-words">
            ✓ {success}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-green text-white w-full py-3 rounded-lg border-none text-[15px] font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 hover:bg-green-dark"
        >
          {loading
            ? "Please wait…"
            : mode === "signup"
            ? accountType === "seeker"
              ? "Create client account"
              : accountType === "provider"
                ? "Create provider account"
                : "Create attorney account"
            : mode === "login"
            ? "Log in"
            : mode === "forgot"
            ? "Send reset link"
            : mode === "verify"
            ? "Resend verification email"
            : "Update password"}
        </button>

        {mode === "login" && (
          <button
            type="button"
            onClick={() => {
              setMode("forgot");
              setError("");
              setSuccess("");
            }}
            className="w-full mt-3 bg-transparent border-none text-xs text-green hover:underline cursor-pointer"
          >
            Forgot your password?
          </button>
        )}

        {(mode === "forgot" || mode === "reset" || mode === "verify") && (
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setSuccess("");
            }}
            className="w-full mt-3 bg-transparent border-none text-xs text-muted hover:text-text cursor-pointer"
          >
            ← Back to log in
          </button>
        )}

        {(mode === "signup" || mode === "login") && (
          <p className="text-xs text-muted-high text-center mt-4 leading-relaxed">
            {mode === "login"
              ? "Clients, attorneys, providers, and administrators can log in here."
              : accountType === "attorney"
                ? "Attorney accounts require bar verification before access."
                : accountType === "provider"
                  ? "Provider accounts require credential approval before access."
                  : "Client accounts are free. Verify your email to continue."}
          </p>
        )}
      </div>
    </div>
  );
}
