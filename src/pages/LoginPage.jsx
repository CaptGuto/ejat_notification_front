import { useState } from "react";
import { LanguageSwitch, ErrorNotice, PasswordField, Spinner } from "../components/ui";
import { useAuth } from "../auth";
import { useI18n } from "../i18n";

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (requestError) {
      setError(requestError);
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-language-control">
        <LanguageSwitch />
      </div>
      <section className="login-brand-panel">
        <div className="brand brand-on-dark">
          <span className="brand-mark" aria-hidden="true">
            E
          </span>
          <span>
            <strong>EJAT</strong>
            <small>{t("Notifications")}</small>
          </span>
        </div>
        <div className="login-brand-content">
          <div className="login-brand-copy">
            <p className="eyebrow">{t("SMS workspace")}</p>
            <h1>{t("Send each project's messages inside its monthly allocation.")}</h1>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-heading">
            <p className="eyebrow">{t("Welcome back")}</p>
            <h2>{t("Sign in to notifications")}</h2>
            <p>{t("Use the account issued to you.")}</p>
          </div>

          <ErrorNotice error={error} />

          <label className="field">
            <span>{t("Email address")}</span>
            <input
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="name@ejat.local"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoFocus
            />
          </label>

          <PasswordField
            label="Password"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />

          <button className="button button-primary button-full" type="submit" disabled={submitting}>
            {submitting ? <Spinner light /> : null}
            {submitting ? t("Signing in...") : t("Sign in")}
          </button>
        </form>
      </section>
    </main>
  );
}
