import { useEffect, useState } from "react";
import { request, toQueryString } from "../api.js";
import RatingPicker from "../components/RatingPicker.jsx";
import SortableTable from "../components/SortableTable.jsx";

export default function Stores() {
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState({ name: "", address: "" });
  const [sort, setSort] = useState({ by: "name", dir: "asc" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Refetch whenever the search boxes or the sort change. The server does the
  // filtering and ordering so it covers every store, not just the loaded rows.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const queryString = toQueryString({
      name: search.name,
      address: search.address,
      sortBy: sort.by,
      sortDir: sort.dir,
    });

    request(`/stores${queryString}`)
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
  }, [search.name, search.address, sort.by, sort.dir]);

  async function submitRating(storeId, score) {
    setMessage("");
    try {
      await request(`/stores/${storeId}/rating`, { method: "PUT", body: { score } });

      // Refetch so the overall average reflects the rating we just sent.
      const queryString = toQueryString({
        name: search.name,
        address: search.address,
        sortBy: sort.by,
        sortDir: sort.dir,
      });
      const data = await request(`/stores${queryString}`);
      setStores(data.stores);
      setMessage("Your rating was saved.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  const columns = [
    { key: "name", label: "Store", sortable: true },
    { key: "address", label: "Address", sortable: true, wrap: true },
    {
      key: "overallRating",
      label: "Overall rating",
      sortable: true,
      render: (store) =>
        store.overallRating == null ? (
          <span className="muted">Not rated yet</span>
        ) : (
          <span>
            {store.overallRating} <span className="muted">({store.ratingCount})</span>
          </span>
        ),
    },
    {
      key: "myRating",
      label: "Your rating",
      sortable: true,
      render: (store) =>
        store.myRating == null ? (
          <span className="muted">Not rated</span>
        ) : (
          <strong>{store.myRating}</strong>
        ),
    },
    {
      key: "action",
      label: "Rate this store",
      render: (store) => (
        <RatingPicker
          value={store.myRating}
          onPick={(score) => submitRating(store.id, score)}
        />
      ),
    },
  ];

  return (
    <div className="page">
      <h1>Stores</h1>
      <p className="subtitle">
        Click a star to rate a store. Clicking again changes the rating you already gave.
      </p>

      {message ? <p className="form-note">{message}</p> : null}

      <div className="filters card">
        <label>
          Search by name
          <input
            className="input"
            value={search.name}
            onChange={(event) =>
              setSearch((previous) => ({ ...previous, name: event.target.value }))
            }
            placeholder="e.g. Grocery"
          />
        </label>
        <label>
          Search by address
          <input
            className="input"
            value={search.address}
            onChange={(event) =>
              setSearch((previous) => ({ ...previous, address: event.target.value }))
            }
            placeholder="e.g. Pune"
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
          emptyMessage="No stores match that search."
        />
      )}
    </div>
  );
}
