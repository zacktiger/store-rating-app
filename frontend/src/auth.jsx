import { createContext, useContext, useEffect, useState } from "react";
import { clearToken, readToken, request, saveToken } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // Starts true so we do not flash the login page while checking a saved token.
  const [loading, setLoading] = useState(true);

  // On a page refresh the token is still in localStorage but the user object is
  // gone, so ask the server who this token belongs to.
  useEffect(() => {
    if (!readToken()) {
      setLoading(false);
      return;
    }

    request("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await request("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    saveToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function signup(details) {
    const data = await request("/auth/register", { method: "POST", body: details });
    saveToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
