import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import Field from "../components/Field.jsx";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function updateField(name, value) {
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setBusy(true);

    try {
      // The route guard in App.jsx sends the user to the right home page once
      // the role is known, so there is nothing to redirect to here.
      await login(form.email, form.password);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="centered-page">
      {/* noValidate turns off the browser's own popups so the messages come
          from our validation rules and every bad field is flagged at once. */}
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <h1>Log in</h1>
        <p className="subtitle">One login for admins, users and store owners.</p>

        {message ? <p className="form-error">{message}</p> : null}

        <Field
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={updateField}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          value={form.password}
          onChange={updateField}
        />

        <button type="submit" className="button" disabled={busy}>
          {busy ? "Logging in..." : "Log in"}
        </button>

        <p className="form-footer">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </form>
    </div>
  );
}
