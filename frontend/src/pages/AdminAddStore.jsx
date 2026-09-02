import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../api.js";
import Field from "../components/Field.jsx";
import { checkAddress, checkEmail, checkName, collectErrors } from "../validation.js";

const EMPTY_FORM = { name: "", email: "", address: "", ownerId: "" };

export default function AdminAddStore() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [owners, setOwners] = useState([]);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // The owner dropdown lists existing store owner accounts.
  useEffect(() => {
    request("/admin/owners")
      .then((data) => setOwners(data.owners))
      .catch((error) => setMessage(error.message));
  }, []);

  function updateField(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
    setErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const found = collectErrors({
      name: checkName(form.name),
      email: checkEmail(form.email),
      address: checkAddress(form.address),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await request("/admin/stores", { method: "POST", body: form });
      navigate("/admin/stores");
    } catch (error) {
      if (error.field) setErrors({ [error.field]: error.message });
      else setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Add a store</h1>

      {/* noValidate turns off the browser's own popups so the messages come
          from our validation rules and every bad field is flagged at once. */}
      <form className="card form" onSubmit={handleSubmit} noValidate>
        {message ? <p className="form-error">{message}</p> : null}

        <Field
          label="Store name"
          name="name"
          value={form.name}
          onChange={updateField}
          error={errors.name}
          hint="Between 20 and 60 characters."
        />
        <Field
          label="Store email"
          name="email"
          type="email"
          value={form.email}
          onChange={updateField}
          error={errors.email}
        />
        <Field
          label="Address"
          name="address"
          value={form.address}
          onChange={updateField}
          error={errors.address}
          multiline
        />

        <div className="field">
          <label htmlFor="ownerId">Owner</label>
          <select
            id="ownerId"
            className={errors.ownerId ? "input input-error" : "input"}
            value={form.ownerId}
            onChange={(event) => updateField("ownerId", event.target.value)}
          >
            <option value="">No owner yet</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name} ({owner.email})
              </option>
            ))}
          </select>
          {errors.ownerId ? (
            <p className="field-error">{errors.ownerId}</p>
          ) : (
            <p className="field-hint">
              Only store owner accounts appear here. Create one first if the list is empty.
            </p>
          )}
        </div>

        <div className="button-row">
          <button type="submit" className="button" disabled={busy}>
            {busy ? "Saving..." : "Create store"}
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => navigate("/admin/stores")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
