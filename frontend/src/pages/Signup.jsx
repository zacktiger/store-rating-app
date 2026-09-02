import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import Field from "../components/Field.jsx";
import {
  checkAddress,
  checkEmail,
  checkName,
  checkPassword,
  collectErrors,
} from "../validation.js";

const EMPTY_FORM = { name: "", email: "", address: "", password: "" };

export default function Signup() {
  const { signup } = useAuth();
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
      await signup(form);
    } catch (error) {
      // The server tells us which field it disliked, e.g. a duplicate email.
      if (error.field) setErrors({ [error.field]: error.message });
      else setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="centered-page">
      {/* noValidate turns off the browser's own popups so the messages come
          from our validation rules and every bad field is flagged at once. */}
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <h1>Create an account</h1>
        <p className="subtitle">Sign up to rate the stores on the platform.</p>

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
          hint="Up to 400 characters."
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

        <button type="submit" className="button" disabled={busy}>
          {busy ? "Creating account..." : "Sign up"}
        </button>

        <p className="form-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}
