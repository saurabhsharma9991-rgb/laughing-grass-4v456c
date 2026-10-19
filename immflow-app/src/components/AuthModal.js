import React, { useState, useEffect, useRef } from "react";
import { useI18n } from "@/components/I18nProvider";
import DynamicProfileFields from "@/components/DynamicProfileFields";
import { Icon } from "@/components/icons/Icon";
import VerificationUpload, {
  DOCUMENT_REQUIRED_SLUGS,
  VERIFICATION_HINT,
} from "@/components/VerificationUpload";

const SIGNUP_STEPS = ["Account", "Services", "Verification"];
const inputClass =
  "w-full text-sm py-2.5 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-white focus:outline-none focus:border-green";

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-xs font-medium text-muted mb-1">{label}</span>
      {children}
    </label>
  );
}

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
  const [accountType, setAccountType] = useState(
    initialAccountType === "seeker" ? "seeker" : "professional"
  );
  const [offerAttorney, setOfferAttorney] = useState(initialAccountType === "attorney");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [verificationFiles, setVerificationFiles] = useState({});
  const setVerificationFile = (key, file) =>
    setVerificationFiles((prev) => ({ ...prev, [key]: file }));

  useEffect(() => {
    setMode(initialMode);
    setAccountType(initialAccountType === "seeker" ? "seeker" : "professional");
    setOfferAttorney(initialAccountType === "attorney");
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

  const selectedCategories = categories.filter((c) =>
    selectedCategoryIds.includes(String(c.id))
  );
  const translationCategory = selectedCategories.find((c) => c.slug === "translation");
  const isTranslationSignup = Boolean(translationCategory);

  const [step, setStep] = useState(0);
  const bodyRef = useRef(null);
  const isWizard = mode === "signup" && accountType === "professional";
  const lastStep = SIGNUP_STEPS.length - 1;

  useEffect(() => {
    setStep(0);
  }, [mode, accountType]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [step, mode]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // The live-chat bubble sits above every z-index and would cover the footer buttons.
    window.Tawk_API?.hideWidget?.();
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.Tawk_API?.showWidget?.();
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  /** First problem on a wizard step, or "" when the step is complete. */
  const stepError = (index) => {
    if (index === 0) {
      if (!name.trim()) return "Full name is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return "Enter a valid email address.";
      if (password.length < 8) return "Password must be at least 8 characters.";
    }
    if (index === 1) {
      if (!offerAttorney && selectedCategoryIds.length === 0) return "Choose attorney, a service, or both.";
      if (offerAttorney && !barNumber.trim()) return "Bar number is required.";
      if (offerAttorney && !state.trim()) return "State bar is required.";
      if (isTranslationSignup && (!sourceLang || !targetLang)) {
        return "Add at least one language pair (source and target).";
      }
    }
    if (index === 2) {
      if (offerAttorney && !verificationFiles.attorney) {
        return "Upload a verification document for your attorney profile.";
      }
      const missing = selectedCategories.find(
        (c) => DOCUMENT_REQUIRED_SLUGS.has(c.slug) && !verificationFiles[c.id]
      );
      if (missing) return `Upload a verification document for ${missing.name}.`;
    }
    return "";
  };

  const goNext = () => {
    const problem = stepError(step);
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setStep((s) => Math.min(lastStep, s + 1));
  };

  const goBack = () => {
    setError("");
    setStep((s) => Math.max(0, s - 1));
  };

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
        if (accountType === "professional") {
          if (!offerAttorney && selectedCategoryIds.length === 0) {
            setError("Choose attorney, a service, or both.");
            setLoading(false);
            return;
          }
          if (offerAttorney) {
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
        if (accountType === "professional") {
          if (offerAttorney && !verificationFiles.attorney) {
            setError("Upload a verification document for your attorney profile.");
            setLoading(false);
            return;
          }
          const missing = selectedCategories.find(
            (c) => DOCUMENT_REQUIRED_SLUGS.has(c.slug) && !verificationFiles[c.id]
          );
          if (missing) {
            setError(`Upload a verification document for ${missing.name}.`);
            setLoading(false);
            return;
          }
        }
        if ((accountType === "provider" || accountType === "professional") && isTranslationSignup) {
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
            ...(accountType === "professional"
              ? {
                  attorney: offerAttorney
                    ? {
                        bar_number: barNumber,
                        bar_state: state,
                        verification_document: verificationFiles.attorney || undefined,
                      }
                    : undefined,
                  services: selectedCategories.map((category) => ({
                    category_id: category.id,
                    verification_document: verificationFiles[category.id] || undefined,
                    ...(category.slug === "translation"
                      ? {
                          translator_type: translatorType,
                          offers_certified: offersCertified,
                          turnaround_days: Number(turnaroundDays) || 3,
                          rush_available: true,
                          base_price_cents: Math.round((Number(basePrice) || 49) * 100),
                          rate: `$${Number(basePrice) || 49}`,
                          language_pairs: [{ source: sourceLang, target: targetLang }],
                          languages: [sourceLang, targetLang].filter(Boolean),
                          profile_data: dynamicProfileData,
                        }
                      : { profile_data: dynamicProfileData }),
                  })),
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
    if (isWizard) {
      if (step < lastStep) return goNext();
      const failing = SIGNUP_STEPS.findIndex((_, i) => stepError(i));
      if (failing !== -1) {
        setStep(failing);
        setError(stepError(failing));
        return;
      }
    }
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

  const emailField = (
    <Field label="Email" className="mb-4">
      <input
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        readOnly={mode === "verify" && Boolean(email)}
        className={inputClass}
      />
    </Field>
  );

  const passwordField = (
    <Field label={mode === "reset" ? "New password" : "Password"} className="mb-4">
      <input
        type="password"
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Min. 8 characters"
        className={inputClass}
      />
    </Field>
  );

  const accountStep = (
    <>
      <Field label={t("auth.signupAs", "Sign up as")} className="mb-4">
        <select
          value={accountType === "seeker" ? "seeker" : "professional"}
          onChange={(e) => {
            setAccountType(e.target.value);
            setError("");
          }}
          className={inputClass}
        >
          <option value="seeker">{t("auth.seeker", "Client / looking for services")}</option>
          <option value="professional">Attorney and / or service provider</option>
        </select>
      </Field>
      <Field label={t("auth.fullName", "Full name")} className="mb-4">
        <input
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          className={inputClass}
        />
      </Field>
      {emailField}
      {passwordField}
    </>
  );

  const offerOptions = [
    { key: "attorney", label: "Immigration attorney", checked: offerAttorney, toggle: setOfferAttorney },
    ...categories.map((c) => ({
      key: String(c.id),
      label: c.name,
      checked: selectedCategoryIds.includes(String(c.id)),
      toggle: (on) =>
        setSelectedCategoryIds((prev) =>
          on ? [...prev, String(c.id)] : prev.filter((item) => item !== String(c.id))
        ),
    })),
  ];

  const servicesStep = (
    <>
      <div className="text-xs font-medium text-muted mb-2">What will you offer? Choose any combination.</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
        {offerOptions.map((o) => (
          <label
            key={o.key}
            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
              o.checked
                ? "border-green bg-green-light/50 text-text"
                : "border-[rgba(0,0,0,0.12)] text-text hover:border-green/50"
            }`}
          >
            <input
              type="checkbox"
              checked={o.checked}
              onChange={(e) => {
                o.toggle(e.target.checked);
                setError("");
              }}
              className="accent-green"
            />
            {o.label}
          </label>
        ))}
      </div>
      <p className="text-[11px] text-muted leading-relaxed mb-4">
        Paid orders include ImmFlow commission. Pro is a separate subscription that lowers that rate.
      </p>

      {offerAttorney && (
        <section className="mb-4 border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
          <div className="text-xs font-semibold text-text mb-2">Attorney details</div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label={t("auth.barNumber", "Bar number")}>
              <input
                value={barNumber}
                onChange={(e) => setBarNumber(e.target.value)}
                placeholder="e.g. 123456"
                className={inputClass}
              />
            </Field>
            <Field label={t("auth.stateBar", "State bar")}>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. CA"
                className={inputClass}
              />
            </Field>
          </div>
        </section>
      )}

      {isTranslationSignup && (
        <section className="mb-4 space-y-3 border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
          <div className="text-xs font-semibold text-text">Translator details</div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Source language">
              <input
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                placeholder="e.g. Hindi"
                className={inputClass}
              />
            </Field>
            <Field label="Target language">
              <input
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                placeholder="e.g. English"
                className={inputClass}
              />
            </Field>
          </div>
          <details className="group">
            <summary className="text-xs font-medium text-green cursor-pointer list-none flex items-center justify-between">
              Pricing and type
              <span className="text-muted group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="mt-3 space-y-3">
              <Field label="Provider type">
                <select
                  value={translatorType}
                  onChange={(e) => setTranslatorType(e.target.value)}
                  className={inputClass}
                >
                  <option>Certified Translator</option>
                  <option>Professional Translator</option>
                  <option>Translation Agency</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Base price (USD)">
                  <input
                    type="number"
                    min="15"
                    inputMode="decimal"
                    value={basePrice}
                    onChange={(e) => setBasePrice(e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Turnaround (days)">
                  <input
                    type="number"
                    min="1"
                    inputMode="numeric"
                    value={turnaroundDays}
                    onChange={(e) => setTurnaroundDays(e.target.value)}
                    className={inputClass}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-xs text-text">
                <input
                  type="checkbox"
                  checked={offersCertified}
                  onChange={(e) => setOffersCertified(e.target.checked)}
                />
                I offer certified / attested translations
              </label>
            </div>
          </details>
        </section>
      )}

      {selectedCategories.some((category) => category.profileSchema) && (
        <details className="mb-2 border border-[rgba(0,0,0,0.08)] rounded-lg p-3">
          <summary className="text-xs font-medium text-green cursor-pointer list-none flex items-center justify-between">
            Extra profile details (optional)
            <span className="text-muted">▾</span>
          </summary>
          <p className="text-[11px] text-muted mt-2 mb-3">
            You can skip this and finish it later from your dashboard.
          </p>
          {selectedCategories
            .filter((category) => category.profileSchema)
            .map((category) => (
              <section key={category.id} className="mb-3 last:mb-0">
                <div className="text-xs font-semibold text-text mb-2">{category.name}</div>
                <DynamicProfileFields
                  schema={category.profileSchema}
                  values={dynamicProfileData}
                  onChange={setDynamicProfileData}
                  excludeKeys={
                    category.slug === "translation"
                      ? ["translatorType", "languagePairs", "turnaround", "rushAvailable"]
                      : []
                  }
                />
              </section>
            ))}
        </details>
      )}
    </>
  );

  const verificationStep = (
    <>
      <p className="text-xs text-muted leading-relaxed mb-3">
        Each profile is reviewed before it goes live. {VERIFICATION_HINT}
      </p>
      <div className="space-y-2">
        {offerAttorney && (
          <VerificationUpload
            label="Immigration attorney"
            required
            value={verificationFiles.attorney}
            onChange={(file) => setVerificationFile("attorney", file)}
            onError={setError}
          />
        )}
        {selectedCategories.map((category) => (
          <VerificationUpload
            key={category.id}
            label={category.name}
            required={DOCUMENT_REQUIRED_SLUGS.has(category.slug)}
            value={verificationFiles[category.id]}
            onChange={(file) => setVerificationFile(category.id, file)}
            onError={setError}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-high mt-3 leading-relaxed">
        Optional documents can also be added later from your dashboard.
      </p>
    </>
  );

  const submitLabel = loading
    ? "Please wait…"
    : mode === "signup"
    ? accountType === "seeker"
      ? "Create client account"
      : step < lastStep
      ? "Continue"
      : "Create account"
    : mode === "login"
    ? "Log in"
    : mode === "forgot"
    ? "Send reset link"
    : mode === "verify"
    ? "Resend verification email"
    : "Update password";

  return (
    <div
      className="fixed inset-0 z-[1000] overflow-hidden flex items-stretch sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        className={`bg-white shadow-xl flex flex-col overflow-hidden min-h-0 w-full max-h-dvh ${
          isWizard
            ? "h-dvh sm:h-[min(38rem,calc(100dvh-2rem))] sm:max-h-[calc(100dvh-2rem)] sm:rounded-2xl sm:w-[32rem]"
            : "mt-auto sm:mt-0 h-auto max-h-dvh rounded-t-2xl sm:rounded-2xl sm:w-[27.5rem]"
        }`}
      >
        <header className="shrink-0 px-5 sm:px-7 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-5 pb-3 border-b border-[rgba(0,0,0,0.06)]">
          <div className="flex justify-between items-center">
            <div className="font-syne text-xl font-extrabold text-text">
              Imm<span className="text-green">Flow</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 p-2 bg-transparent border-none cursor-pointer text-muted hover:text-text rounded-lg"
            >
              <Icon name="close" className="w-4 h-4" />
            </button>
          </div>

          {title && <h2 className="font-syne text-lg font-bold text-text mt-3">{title}</h2>}
          {intentLabel && (mode === "signup" || mode === "login") && (
            <p className="text-sm text-muted mt-2 leading-relaxed">{intentLabel}</p>
          )}

          {(mode === "signup" || mode === "login") && (
            <div className="flex gap-1.5 mt-4">
              {[
                ["signup", "Create account"],
                ["login", "Log in"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
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

          {isWizard && (
            <ol className="flex items-center gap-2 mt-4" aria-label="Signup progress">
              {SIGNUP_STEPS.map((label, i) => (
                <li key={label} className="flex-1 min-w-0">
                  <button
                    type="button"
                    disabled={i > step}
                    onClick={() => {
                      setError("");
                      setStep(i);
                    }}
                    className="w-full text-left bg-transparent border-none p-0 cursor-pointer disabled:cursor-default"
                    aria-current={i === step ? "step" : undefined}
                  >
                    <span
                      className={`block h-1 rounded-full transition-colors ${
                        i <= step ? "bg-green" : "bg-[rgba(0,0,0,0.08)]"
                      }`}
                    />
                    <span
                      className={`block text-[11px] mt-1.5 truncate ${
                        i === step ? "text-text font-semibold" : "text-muted"
                      }`}
                    >
                      {i + 1}. {label}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </header>

        <form
          className="flex-1 min-h-0 flex flex-col overflow-hidden"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          noValidate
        >
          <div
            className={
              isWizard
                ? "relative flex-1 min-h-0 overflow-hidden"
                : "relative min-h-0 overflow-hidden"
            }
          >
          <div
            ref={bodyRef}
            className={`overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] px-5 sm:px-7 py-4 ${
              isWizard ? "h-full" : "max-h-[min(60dvh,28rem)]"
            }`}
          >
            {mode === "signup" && (!isWizard || step === 0) && accountStep}
            {isWizard && step === 1 && servicesStep}
            {isWizard && step === 2 && verificationStep}

            {(mode === "login" || mode === "forgot" || mode === "verify") && emailField}

            {mode === "verify" && (
              <p className="text-xs text-muted-high mb-4 leading-relaxed">
                We sent a verification link to your inbox. Click the link to activate your account, then log in.
                Did not receive it? Resend below.
              </p>
            )}

            {(mode === "login" || mode === "reset") && passwordField}

            {mode === "reset" && (
              <>
                <Field label="Reset token" className="mb-4">
                  <input
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    placeholder="Paste token from your reset email"
                    className={inputClass}
                  />
                </Field>
                <Field label="Confirm password" className="mb-4">
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className={inputClass}
                  />
                </Field>
              </>
            )}

            {mode === "login" && (
              <button
                type="button"
                onClick={() => {
                  setMode("forgot");
                  setError("");
                  setSuccess("");
                }}
                className="w-full bg-transparent border-none text-xs text-green hover:underline cursor-pointer"
              >
                Forgot your password?
              </button>
            )}

            {(mode === "signup" || mode === "login") && (!isWizard || step === 0) && (
              <p className="text-xs text-muted-high text-center mt-2 leading-relaxed">
                {mode === "login"
                  ? "Clients, attorneys, providers, and administrators can log in here."
                  : accountType === "seeker"
                    ? "Client accounts are free. Verify your email to continue."
                    : "One account can include an attorney profile and any services you offer."}
              </p>
            )}
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent"
          />
          </div>

          <footer className="shrink-0 px-5 sm:px-7 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-5 border-t border-[rgba(0,0,0,0.06)] bg-white sm:rounded-b-2xl">
            {error && (
              <div role="alert" className="bg-red-light text-red py-2.5 px-3 rounded-lg text-[13px] mb-3">
                <span className="inline-flex items-start gap-2">
                  <Icon name="alert" className="w-4 h-4 shrink-0 mt-px" /> {error}
                </span>
              </div>
            )}
            {success && (
              <div className="bg-green-light text-green-dark py-2.5 px-3 rounded-lg text-[13px] mb-3 break-words">
                <span className="inline-flex items-start gap-2">
                  <Icon name="check" className="w-4 h-4 shrink-0 mt-px" /> {success}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              {isWizard && step > 0 && (
                <button
                  type="button"
                  onClick={goBack}
                  disabled={loading}
                  className="shrink-0 px-5 py-3 rounded-lg border border-[rgba(0,0,0,0.12)] bg-white text-sm font-medium text-text cursor-pointer hover:bg-bg disabled:opacity-60"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green text-white py-3 rounded-lg border-none text-[15px] font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 hover:bg-green-dark"
              >
                {submitLabel}
              </button>
            </div>

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
          </footer>
        </form>
      </div>
    </div>
  );
}
