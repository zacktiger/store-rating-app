import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { request } from "../api.js";

const ROLE_LABELS = {
  admin: "Administrator",
  user: "Normal user",
  owner: "Store owner",
};

export default function AdminUserDetail() {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    request(`/admin/users/${userId}`)
      .then((data) => setUser(data.user))
      .catch((error) => setMessage(error.message));
  }, [userId]);

  if (message) return <p className="form-error page">{message}</p>;
  if (!user) return <p className="muted page">Loading...</p>;

  return (
    <div className="page narrow">
      <Link to="/admin/users" className="back-link">
        &larr; Back to users
      </Link>

      <h1>{user.name}</h1>

      <div className="card detail-list">
        <div>
          <span className="detail-label">Email</span>
          <span>{user.email}</span>
        </div>
        <div>
          <span className="detail-label">Address</span>
          <span>{user.address}</span>
        </div>
        <div>
          <span className="detail-label">Role</span>
          <span>{ROLE_LABELS[user.role]}</span>
        </div>

        {/* The brief asks for the rating to be shown when the user is a store owner. */}
        {user.role === "owner" ? (
          <>
            <div>
              <span className="detail-label">Store</span>
              <span>{user.storeName || <span className="muted">No store linked</span>}</span>
            </div>
            <div>
              <span className="detail-label">Store rating</span>
              <span>
                {user.storeRating == null ? (
                  <span className="muted">Not rated yet</span>
                ) : (
                  user.storeRating
                )}
              </span>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
