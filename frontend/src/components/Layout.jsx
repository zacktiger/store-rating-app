import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";

// The links each role sees in the top bar.
const LINKS_BY_ROLE = {
  admin: [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/stores", label: "Stores" },
  ],
  user: [{ to: "/stores", label: "Stores" }],
  owner: [{ to: "/owner", label: "My store" }],
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const links = LINKS_BY_ROLE[user.role] || [];

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">
          Store Ratings
        </Link>

        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
            >
              {link.label}
            </NavLink>
          ))}
          <NavLink
            to="/change-password"
            className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
          >
            Change password
          </NavLink>
        </nav>

        <div className="topbar-right">
          <span className="who">
            {user.name} <span className="role-tag">{user.role}</span>
          </span>
          <button type="button" className="button secondary" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>

      <main className="content">{children}</main>
    </div>
  );
}
