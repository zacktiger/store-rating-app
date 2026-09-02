import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request, toQueryString } from "../api.js";
import SortableTable from "../components/SortableTable.jsx";

const EMPTY_FILTERS = { name: "", email: "", address: "", role: "" };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState({ by: "name", dir: "asc" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const queryString = toQueryString({ ...filters, sortBy: sort.by, sortDir: sort.dir });

    request(`/admin/users${queryString}`)
      .then((data) => {
        if (!cancelled) setUsers(data.users);
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
  }, [filters.name, filters.email, filters.address, filters.role, sort.by, sort.dir]);

  function updateFilter(name, value) {
    setFilters((previous) => ({ ...previous, [name]: value }));
  }

  const columns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (user) => <Link to={`/admin/users/${user.id}`}>{user.name}</Link>,
    },
    { key: "email", label: "Email", sortable: true },
    { key: "address", label: "Address", sortable: true, wrap: true },
    { key: "role", label: "Role", sortable: true },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <h1>Users</h1>
        <Link className="button" to="/admin/users/new">
          Add a user
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
        <label>
          Role
          <select
            className="input"
            value={filters.role}
            onChange={(event) => updateFilter("role", event.target.value)}
          >
            <option value="">All roles</option>
            <option value="admin">Admin</option>
            <option value="user">Normal user</option>
            <option value="owner">Store owner</option>
          </select>
        </label>
      </div>

      {loading ? (
        <p className="muted">Loading users...</p>
      ) : (
        <SortableTable
          columns={columns}
          rows={users}
          sort={sort}
          onSortChange={setSort}
          emptyMessage="No users match those filters."
        />
      )}
    </div>
  );
}
