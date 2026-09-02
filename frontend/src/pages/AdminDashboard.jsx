import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../api.js";

export default function AdminDashboard() {
  const [totals, setTotals] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    request("/admin/dashboard")
      .then(setTotals)
      .catch((error) => setMessage(error.message));
  }, []);

  if (message) return <p className="form-error page">{message}</p>;
  if (!totals) return <p className="muted page">Loading...</p>;

  return (
    <div className="page">
      <h1>Dashboard</h1>

      <div className="stat-row">
        <div className="stat card">
          <span className="stat-label">Total users</span>
          <span className="stat-value">{totals.totalUsers}</span>
        </div>
        <div className="stat card">
          <span className="stat-label">Total stores</span>
          <span className="stat-value">{totals.totalStores}</span>
        </div>
        <div className="stat card">
          <span className="stat-label">Total ratings</span>
          <span className="stat-value">{totals.totalRatings}</span>
        </div>
      </div>

      <div className="button-row">
        <Link className="button" to="/admin/users/new">
          Add a user
        </Link>
        <Link className="button secondary" to="/admin/stores/new">
          Add a store
        </Link>
      </div>
    </div>
  );
}
