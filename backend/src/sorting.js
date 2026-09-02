// Column names cannot be passed as SQL parameters, so anything that ends up in an
// ORDER BY has to be checked against a list we control. `allowedColumns` maps the
// name the client sends to the actual SQL expression to sort by.
export function buildOrderBy(allowedColumns, requestedColumn, requestedDirection) {
  const columnNames = Object.keys(allowedColumns);
  const column = columnNames.includes(requestedColumn)
    ? requestedColumn
    : columnNames[0];
  const direction = requestedDirection === "desc" ? "DESC" : "ASC";

  return `ORDER BY ${allowedColumns[column]} ${direction}`;
}
