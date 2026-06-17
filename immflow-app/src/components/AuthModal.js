import React, { useState, useEffect } from "react";

export default function AuthModal({ onClose, onAuth, initialMode = "signup", resetToken: resetTokenProp = "" }) {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken] = useState(resetTokenProp);
  const [name, setName] = useState("");

  useEffect(() => {
    setMode(initialMode);
    if (resetTokenProp) setResetToken(resetTokenProp);
  }, [initialMode, resetTokenProp]);
  const [barNumber, setBarNumber] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSignupLogin = async () => {
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!name.trim()) {
          setError("Full name is required.");
          return;
        }
        if (!barNumber.trim()) {
          setError("Bar number is required.");
          return;
        }
        if (!state.trim()) {
          setError("State bar is required.");
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          return;
        }

        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            data: { full_name: name, bar_number: barNumber, bar_state: state },
          }),
        });
        const res = await response.json();

        if (res.error) {
          setError(res.error.message);
        } else if (res.access_token) {
          onAuth(res.user, res.access_token);
          onClose();
        } else {
          setSuccess(res.message || "Account created successfully.");
        }
      } else {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const res = await response.json();

        if (res.error) {
          setError(res.error.message);
        } else {
          onAuth(res.user, res.access_token);
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

  const handleSubmit = () => {
    if (mode === "forgot") return handleForgotPassword();
    if (mode === "reset") return handleResetPassword();
    return handleSignupLogin();
  };

  const title =
    mode === "forgot"
      ? "Reset your password"
      : mode === "reset"
      ? "Choose a new password"
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
              <div className="text-xs font-medium text-muted mb-1">Full name</div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith, Esq."
                className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              <div>
                <div className="text-xs font-medium text-muted mb-1">Bar number</div>
                <input
                  value={barNumber}
                  onChange={(e) => setBarNumber(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
                />
              </div>
              <div>
                <div className="text-xs font-medium text-muted mb-1">State bar</div>
                <input
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="e.g. CA"
                  className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
                />
              </div>
            </div>
          </>
        )}

        {(mode === "signup" || mode === "login" || mode === "forgot") && (
          <div className="mb-4">
            <div className="text-xs font-medium text-muted mb-1">Email</div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@lawfirm.com"
              className="w-full text-sm py-2 px-3 border border-[rgba(0,0,0,0.15)] rounded-lg text-text bg-transparent focus:outline-none focus:border-green"
            />
          </div>
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
            ? "Create attorney account"
            : mode === "login"
            ? "Log in"
            : mode === "forgot"
            ? "Send reset link"
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

        {(mode === "forgot" || mode === "reset") && (
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
            Immigration attorneys only. Bar number required for verification.
          </p>
        )}
      </div>
    </div>
  );
}
