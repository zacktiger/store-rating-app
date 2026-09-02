// One labelled input with its error message underneath. Used by every form so
// they all look and behave the same.
export default function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  error,
  hint,
  multiline = false,
}) {
  const inputProps = {
    id: name,
    name,
    value,
    onChange: (event) => onChange(name, event.target.value),
    className: error ? "input input-error" : "input",
  };

  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      {multiline ? (
        <textarea rows={3} {...inputProps} />
      ) : (
        <input type={type} {...inputProps} />
      )}
      {error ? (
        <p className="field-error">{error}</p>
      ) : hint ? (
        <p className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}
