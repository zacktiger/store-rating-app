// Every path below starts with a "/", so a trailing slash here would produce a
// double slash like /api//auth/login, which Express treats as a different route
// and answers with a 404. Easy to get wrong when pasting the URL into a hosting
// dashboard, so trim it rather than rely on it being typed correctly.
const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:4200/api").replace(
  /\/+$/,
  ""
);

const TOKEN_KEY = "storeRatingToken";

export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function readToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Every request goes through here so the token header and error handling live in
// one place. Throws an Error carrying the server's message and field name, which
// is what the forms show next to the offending input.
export async function request(path, options = {}) {
  const token = readToken();

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong.");
    error.field = data.field;
    error.status = response.status;
    throw error;
  }

  return data;
}

// Turns { name: "abc", role: "" } into "?name=abc", skipping empty values so the
// backend does not have to special-case them.
export function toQueryString(params) {
  const filled = Object.entries(params).filter(([, value]) => value !== "" && value != null);
  if (filled.length === 0) return "";
  return "?" + new URLSearchParams(filled).toString();
}
