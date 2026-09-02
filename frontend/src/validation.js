// Same rules as backend/src/validation.js. They live in both places on purpose:
// here so the user sees the problem before submitting, there because the server
// is the one that actually decides.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function checkName(value) {
  const name = (value || "").trim();
  if (name.length < 20) return "Name must be at least 20 characters.";
  if (name.length > 60) return "Name must be at most 60 characters.";
  return null;
}

export function checkEmail(value) {
  if (!EMAIL_PATTERN.test((value || "").trim())) return "Enter a valid email address.";
  return null;
}

export function checkAddress(value) {
  const address = (value || "").trim();
  if (address.length === 0) return "Address is required.";
  if (address.length > 400) return "Address must be at most 400 characters.";
  return null;
}

export function checkPassword(value) {
  const password = value || "";
  if (password.length < 8 || password.length > 16) {
    return "Password must be 8 to 16 characters.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must include at least one special character.";
  }
  return null;
}

// Returns an object of { fieldName: message } for the fields that failed.
export function collectErrors(checks) {
  const errors = {};
  for (const [field, message] of Object.entries(checks)) {
    if (message) errors[field] = message;
  }
  return errors;
}
