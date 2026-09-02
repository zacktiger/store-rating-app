// A table whose headers can be clicked to sort. The parent owns the sort state and
// refetches from the server, so sorting works across the whole list and not just
// the rows currently on screen.
//
// `columns` looks like:
//   [{ key: "name", label: "Name", sortable: true, render: (row) => ... }]
export default function SortableTable({ columns, rows, sort, onSortChange, emptyMessage }) {
  function handleHeaderClick(column) {
    if (!column.sortable) return;

    // Clicking the column you are already sorting by flips the direction.
    const nextDirection =
      sort.by === column.key && sort.dir === "asc" ? "desc" : "asc";
    onSortChange({ by: column.key, dir: nextDirection });
  }

  function sortArrow(column) {
    if (!column.sortable) return null;
    if (sort.by !== column.key) return <span className="sort-arrow muted">↕</span>;
    return <span className="sort-arrow">{sort.dir === "asc" ? "↑" : "↓"}</span>;
  }

  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                onClick={() => handleHeaderClick(column)}
                className={column.sortable ? "sortable" : undefined}
              >
                {column.label}
                {sortArrow(column)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="empty-row">
                {emptyMessage || "Nothing to show."}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr key={row.id ?? index}>
                {columns.map((column) => (
                  <td key={column.key} className={column.wrap ? "address-cell" : undefined}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
