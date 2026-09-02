// The rules below come straight from the challenge brief. The frontend checks the
// same things so users get instant feedback, but the server is the one that decides.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPECIAL_CHARACTER_PATTERN = /[^A-Za-z0-9]/;

export function checkName(value) {
  const name = (value || "").trim();
  if (name.length < 20) return "Name must be at least 20 characters.";
  if (name.length > 60) return "Name must be at most 60 characters.";
  return null;
}

export function checkEmail(value) {
  const email = (value || "").trim();
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  if (email.length > 255) return "Email must be at most 255 characters.";
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
  if (!SPECIAL_CHARACTER_PATTERN.test(password)) {
    return "Password must include at least one special character.";
  }
  return null;
}

export function checkRating(value) {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return "Rating must be a whole number from 1 to 5.";
  }
  return null;
}

export function checkRole(value) {
  if (!["admin", "user", "owner"].includes(value)) {
    return "Role must be admin, user or owner.";
  }
  return null;
}

// Runs a set of checks and returns the first problem it finds, or null if the
// input is fine. `checks` looks like { name: checkName(body.name), ... }.
export function firstError(checks) {
  for (const [field, message] of Object.entries(checks)) {
    if (message) return { field, message };
  }
  return null;
}
