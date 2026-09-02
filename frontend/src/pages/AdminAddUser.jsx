import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { request } from "../api.js";
import Field from "../components/Field.jsx";
import {
  checkAddress,
  checkEmail,
  checkName,
  checkPassword,
  collectErrors,
} from "../validation.js";

const EMPTY_FORM = { name: "", email: "", address: "", password: "", role: "user" };

// Admins create accounts of any role here, including other admins and store owners.
export default function AdminAddUser() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
      password: checkPassword(form.password),
    });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await request("/admin/users", { method: "POST", body: form });
      navigate("/admin/users");
    } catch (error) {
      if (error.field) setErrors({ [error.field]: error.message });
      else setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Add a user</h1>

      {/* noValidate turns off the browser's own popups so the messages come
          from our validation rules and every bad field is flagged at once. */}
      <form className="card form" onSubmit={handleSubmit} noValidate>
        {message ? <p className="form-error">{message}</p> : null}

        <Field
          label="Name"
          name="name"
          value={form.name}
          onChange={updateField}
          error={errors.name}
          hint="Between 20 and 60 characters."
        />
        <Field
          label="Email"
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
        <Field
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={updateField}
          error={errors.password}
          hint="8 to 16 characters, with one uppercase letter and one special character."
        />

        <div className="field">
          <label htmlFor="role">Role</label>
          <select
            id="role"
            className="input"
            value={form.role}
            onChange={(event) => updateField("role", event.target.value)}
          >
            <option value="user">Normal user</option>
            <option value="owner">Store owner</option>
            <option value="admin">Administrator</option>
          </select>
        </div>

        <div className="button-row">
          <button type="submit" className="button" disabled={busy}>
            {busy ? "Saving..." : "Create user"}
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => navigate("/admin/users")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
