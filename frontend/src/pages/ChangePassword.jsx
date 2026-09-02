import { useState } from "react";
import { request } from "../api.js";
import Field from "../components/Field.jsx";
import { checkPassword, collectErrors } from "../validation.js";

// Available to all three roles from the top bar.
export default function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
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

    const found = collectErrors({ newPassword: checkPassword(form.newPassword) });
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      await request("/auth/password", { method: "PUT", body: form });
      setForm({ currentPassword: "", newPassword: "" });
      setMessage("Password updated.");
    } catch (error) {
      if (error.field) setErrors({ [error.field]: error.message });
      else setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page narrow">
      <h1>Change password</h1>

      {/* noValidate turns off the browser's own popups so the messages come
          from our validation rules and every bad field is flagged at once. */}
      <form className="card form" onSubmit={handleSubmit} noValidate>
        {message ? <p className="form-note">{message}</p> : null}

        <Field
          label="Current password"
          name="currentPassword"
          type="password"
          value={form.currentPassword}
          onChange={updateField}
          error={errors.currentPassword}
        />
        <Field
          label="New password"
          name="newPassword"
          type="password"
          value={form.newPassword}
          onChange={updateField}
          error={errors.newPassword}
          hint="8 to 16 characters, with one uppercase letter and one special character."
        />

        <button type="submit" className="button" disabled={busy}>
          {busy ? "Saving..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
