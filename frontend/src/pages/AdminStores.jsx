import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request, toQueryString } from "../api.js";
import SortableTable from "../components/SortableTable.jsx";

const EMPTY_FILTERS = { name: "", email: "", address: "" };

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState({ by: "name", dir: "asc" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const queryString = toQueryString({ ...filters, sortBy: sort.by, sortDir: sort.dir });

    request(`/admin/stores${queryString}`)
      .then((data) => {
        if (!cancelled) setStores(data.stores);
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
  }, [filters.name, filters.email, filters.address, sort.by, sort.dir]);

  function updateFilter(name, value) {
    setFilters((previous) => ({ ...previous, [name]: value }));
  }

  const columns = [
    { key: "name", label: "Name", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "address", label: "Address", sortable: true, wrap: true },
    {
      key: "rating",
      label: "Rating",
      sortable: true,
      render: (store) =>
        store.rating == null ? (
          <span className="muted">Not rated yet</span>
        ) : (
          <span>
            {store.rating} <span className="muted">({store.ratingCount})</span>
          </span>
        ),
    },
    {
      key: "ownerName",
      label: "Owner",
      render: (store) =>
        store.ownerName || <span className="muted">No owner set</span>,
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Stores</h1>
        <Link className="button" to="/admin/stores/new">
          Add a store
        </Link>
      </div>

      {message ? <p className="form-error">{message}</p> : null}

      <div className="filters card">
        <label>
          Name
          <input
            className="input"
            value={filters.name}
            onChange={(event) => updateFilter("name", event.target.value)}
          />
        </label>
        <label>
          Email
          <input
            className="input"
            value={filters.email}
            onChange={(event) => updateFilter("email", event.target.value)}
          />
        </label>
        <label>
          Address
          <input
            className="input"
            value={filters.address}
            onChange={(event) => updateFilter("address", event.target.value)}
          />
        </label>
      </div>

      {loading ? (
        <p className="muted">Loading stores...</p>
      ) : (
        <SortableTable
          columns={columns}
          rows={stores}
          sort={sort}
          onSortChange={setSort}
          emptyMessage="No stores match those filters."
        />
      )}
    </div>
  );
}
