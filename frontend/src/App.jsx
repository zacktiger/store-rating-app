import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth.jsx";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ChangePassword from "./pages/ChangePassword.jsx";

// Where each role lands after logging in.
const HOME_BY_ROLE = {
  admin: "/admin",
  user: "/stores",
  owner: "/owner",
};

// Wraps a page so only the listed roles can open it. Anyone not logged in goes to
// the login page; a logged-in user with the wrong role goes to their own home.
function Protected({ roles, children }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;

  return <Layout>{children}</Layout>;
}

export default function App() {
  const { user, loading } = useAuth();

  // Wait for the saved token to be checked, otherwise a refresh briefly shows
  // the login page to someone who is already logged in.
  if (loading) return <p className="muted page">Loading...</p>;

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={HOME_BY_ROLE[user.role]} replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to={HOME_BY_ROLE[user.role]} replace /> : <Signup />}
      />

      <Route
        path="/change-password"
        element={
          <Protected roles={["admin", "user", "owner"]}>
            <ChangePassword />
          </Protected>
        }
      />

      {/* Anything else: send people to their own home page, or to login. */}
      <Route
        path="*"
        element={<Navigate to={user ? HOME_BY_ROLE[user.role] : "/login"} replace />}
      />
    </Routes>
  );
}
