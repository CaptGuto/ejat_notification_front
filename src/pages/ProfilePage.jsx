import { useState } from "react";
import { api } from "../api";
import { ErrorNotice, PageHeader, PasswordField, RoleBadge, SuccessNotice } from "../components/ui";
import { useAuth } from "../auth";
import { formatDateTime, fullName, initials, passwordTooLong, roleLabel } from "../format";
import { useI18n } from "../i18n";

export function ProfilePage() {
  const { user, setUser } = useAuth();
  const { t, language } = useI18n();
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const nextFirst = firstName.trim();
    const nextLast = lastName.trim();
    if (!nextFirst) {
      setFormError("First name is required.");
      return;
    }
    if (!nextLast) {
      setFormError("Last name is required.");
      return;
    }
    if (newPassword || confirmPassword || currentPassword) {
      if (!newPassword) {
        setFormError("Password is required.");
        return;
      }
      if (passwordTooLong(newPassword)) {
        setFormError("Password must be 72 characters or fewer.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setFormError("The passwords do not match.");
        return;
      }
      if (!currentPassword) {
        setFormError("Enter the current password to set a new one.");
        return;
      }
    }

    const body = {};
    if (nextFirst !== user.firstName) body.firstName = nextFirst;
    if (nextLast !== user.lastName) body.lastName = nextLast;
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }
    if (Object.keys(body).length === 0) {
      setFormError("Change a field before saving.");
      return;
    }
    setFormError("");
    setSaving(true);
    try {
      const updated = await api("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setUser(updated);
      setFirstName(updated.firstName);
      setLastName(updated.lastName);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader eyebrow="Account" title="Profile" subtitle={t("Update your name and password.")} />
      <div className="profile-layout">
        <section className="panel">
          <header className="panel-header">
            <div>
              <h2>{t("Account details")}</h2>
              <p>{t("Signed-in account")}</p>
            </div>
          </header>
          <div className="identity-card">
            <span className="avatar avatar-inverse" aria-hidden="true">
              {initials(user)}
            </span>
            <div>
              <p className="identity-name">{fullName(user)}</p>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <dl className="fact-list">
            <div>
              <dt>{t("Email")}</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>{t("Role")}</dt>
              <dd>{t(roleLabel(user.role))}</dd>
            </div>
            <div>
              <dt>{t("Project")}</dt>
              <dd>{user.project?.name ?? t("No project")}</dd>
            </div>
            <div>
              <dt>{t("Member since")}</dt>
              <dd>{formatDateTime(user.createdAt, language)}</dd>
            </div>
          </dl>
        </section>

        <section className="panel">
          <header className="panel-header">
            <div>
              <h2>{t("Save changes")}</h2>
              <p>{t("72 characters at most.")}</p>
            </div>
          </header>
          <form className="panel-pad form-stack" onSubmit={handleSubmit}>
            {saved ? <SuccessNotice title="Profile saved." /> : null}
            <ErrorNotice error={error} />
            {formError ? (
              <div className="notice notice-error" role="alert">
                <strong>{t(formError)}</strong>
              </div>
            ) : null}
            <div className="form-grid">
              <label className="field">
                <span>{t("First name")}</span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete="given-name"
                  required
                />
              </label>
              <label className="field">
                <span>{t("Last name")}</span>
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  autoComplete="family-name"
                  required
                />
              </label>
            </div>
            <PasswordField
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              help="Enter the current password to set a new one."
            />
            <PasswordField
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              help="72 characters at most."
            />
            <PasswordField
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />
            <div className="form-actions">
              <button className="button button-primary" type="submit" disabled={saving}>
                {saving ? t("Saving...") : t("Save changes")}
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
