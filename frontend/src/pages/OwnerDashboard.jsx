import { useEffect, useState } from "react";
import { request, toQueryString } from "../api.js";
import SortableTable from "../components/SortableTable.jsx";

export default function OwnerDashboard() {
  const [store, setStore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [sort, setSort] = useState({ by: "name", dir: "asc" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const queryString = toQueryString({ sortBy: sort.by, sortDir: sort.dir });

    request(`/owner/dashboard${queryString}`)
      .then((data) => {
        if (cancelled) return;
        setStore(data.store);
        setRatings(data.ratings);
      })
      .catch((error) => {
        if (!cancelled) setMessage(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [sort.by, sort.dir]);

  const columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "score", label: "Rating", sortable: true },
    {
      key: "ratedAt",
      label: "Last updated",
      sortable: true,
      render: (row) => new Date(row.ratedAt).toLocaleDateString(),
    },
  ];

  if (loading) return <p className="muted page">Loading your dashboard...</p>;
  if (message) return <p className="form-error page">{message}</p>;

  // An owner account can exist before an admin attaches a store to it.
  if (!store) {
    return (
      <div className="page">
        <h1>My store</h1>
        <p className="muted">
          No store is linked to your account yet. An administrator needs to add one.
        </p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>{store.name}</h1>
      <p className="subtitle">{store.address}</p>

      <div className="stat-row">
        <div className="stat card">
          <span className="stat-label">Average rating</span>
          <span className="stat-value">
            {store.averageRating == null ? "-" : store.averageRating}
          </span>
        </div>
        <div className="stat card">
          <span className="stat-label">Ratings received</span>
          <span className="stat-value">{store.ratingCount}</span>
        </div>
      </div>

      <h2>Who rated your store</h2>
      <SortableTable
        columns={columns}
        rows={ratings}
        sort={sort}
        onSortChange={setSort}
        emptyMessage="Nobody has rated your store yet."
      />
    </div>
  );
}
