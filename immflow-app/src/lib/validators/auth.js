const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email) {
  if (!email || typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return "A valid email address is required.";
  }
  return null;
}

export function validatePassword(password, { minLength = 8 } = {}) {
  if (!password || typeof password !== "string") {
    return "Password is required.";
  }
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters.`;
  }
  return null;
}

/**
 * accountType: seeker | attorney | provider
 * For provider: data.category_id required
 * For attorney: bar_number + bar_state required
 */
export function validateSignupBody(body) {
  const errors = {};
  const emailErr = validateEmail(body?.email);
  if (emailErr) errors.email = emailErr;
  const passErr = validatePassword(body?.password);
  if (passErr) errors.password = passErr;

  const accountType = body?.accountType || body?.data?.account_type || "attorney";
  const fullName = body?.data?.full_name?.trim();
  if (!fullName) errors.full_name = "Full name is required.";

  if (accountType === "attorney") {
    const barNumber = body?.data?.bar_number?.trim();
    const barState = body?.data?.bar_state?.trim();
    if (!barNumber) errors.bar_number = "Bar number is required.";
    if (!barState) errors.bar_state = "State bar is required.";
  }

  if (accountType === "provider") {
    if (!body?.data?.category_id && !body?.data?.category_slug) {
      errors.category = "Please select a service category.";
    }
  }

  if (!["seeker", "attorney", "provider"].includes(accountType)) {
    errors.accountType = "Invalid account type.";
  }

  if (Object.keys(errors).length) {
    return { valid: false, errors };
  }
  return { valid: true, data: { ...body, accountType } };
}
