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

export function validateSignupBody(body) {
  const errors = {};
  const emailErr = validateEmail(body?.email);
  if (emailErr) errors.email = emailErr;
  const passErr = validatePassword(body?.password);
  if (passErr) errors.password = passErr;

  const barNumber = body?.data?.bar_number?.trim();
  const barState = body?.data?.bar_state?.trim();
  if (!barNumber) errors.bar_number = "Bar number is required.";
  if (!barState) errors.bar_state = "State bar is required.";

  if (Object.keys(errors).length) {
    return { valid: false, errors };
  }
  return { valid: true, data: body };
}
