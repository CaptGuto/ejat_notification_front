import { useEffect, useMemo, useState } from "react";
import { api, toQuery } from "../api";
import {
  ConfirmDialog,
  Drawer,
  EmptyState,
  ErrorNotice,
  LoadingBlock,
  PageHeader,
  PasswordField,
  StatusBadge,
  SuccessNotice,
} from "../components/ui";
import { fullName, initials, passwordTooLong, roleLabel } from "../format";
import { useI18n } from "../i18n";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  projectId: "",
};

export function UsersPage() {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState("");
  const [tick, setTick] = useState(0);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    let active = true;
    api("/projects")
      .then((body) => {
        if (active) setProjects(Array.isArray(body) ? body : []);
      })
      .catch(() => {
        if (active) setProjects([]);
      });
    return () => {
      active = false;
    };
  }, [tick]);

  useEffect(() => {
    let active = true;
    api(`/users${toQuery({ projectId })}`)
      .then((body) => {
        if (!active) return;
        setUsers(Array.isArray(body) ? body : []);
        setError(null);
      })
      .catch((requestError) => {
        if (!active || requestError?.name === "AbortError") return;
        setError(requestError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [projectId, tick]);

  const projectOptions = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name)),
    [projects],
  );

  async function changeStatus() {
    if (!confirm) return;
    const next = !confirm.user.isActive;
    try {
      const updated = await api(`/users/${confirm.user.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: next }),
      });
      setUsers((current) => current.map((user) => (user.id === updated.id ? updated : user)));
      setBanner("User updated.");
      setConfirm(null);
    } catch (requestError) {
      setConfirm((current) => (current ? { ...current, error: requestError, busy: false } : current));
    }
  }

  const emptyTitle = projectId ? "No users in this project yet." : "No users yet";

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Users"
        subtitle={t("Create accounts for one project each.")}
      >
        <button
          className="button button-secondary"
          type="button"
          onClick={() => {
            setLoading(true);
            setTick((value) => value + 1);
          }}
        >
          {t("Refresh")}
        </button>
        <button
          className="button button-primary"
          type="button"
          onClick={() => {
            setBanner("");
            setDrawer({ mode: "create" });
          }}
        >
          {t("Create user")}
        </button>
      </PageHeader>

      {banner ? <SuccessNotice title={banner} /> : null}
      <ErrorNotice error={error} />

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>{t("Users")}</h2>
            <p>{t("Filter by project")}</p>
          </div>
          <label className="filter-field">
            <span>{t("Project")}</span>
            <select
              className="filter-select"
              value={projectId}
              onChange={(event) => {
                setLoading(true);
                setProjectId(event.target.value);
              }}
            >
              <option value="">{t("All projects")}</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                  {project.isActive ? "" : ` (${t("Inactive")})`}
                </option>
              ))}
            </select>
          </label>
        </header>

        {loading && users.length === 0 ? (
          <LoadingBlock label="Loading users" />
        ) : users.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            description="Create a project user and assign them to one project."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("Name")}</th>
                  <th>{t("Email")}</th>
                  <th>{t("Project")}</th>
                  <th>{t("Status")}</th>
                  <th className="table-action-wide">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="person-cell">
                        <span className="avatar" aria-hidden="true">
                          {initials(user)}
                        </span>
                        <span>
                          <strong>{fullName(user)}</strong>
                          <small>{t(roleLabel(user.role))}</small>
                        </span>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.project?.name ?? t("No project")}</td>
                    <td>
                      <StatusBadge active={user.isActive} />
                    </td>
                    <td className="table-action-wide">
                      <div className="table-actions">
                        <button
                          className="button button-secondary button-compact"
                          type="button"
                          onClick={() => setDrawer({ mode: "edit", user })}
                        >
                          {t("Edit")}
                        </button>
                        <button
                          className="button button-secondary button-compact"
                          type="button"
                          onClick={() => setDrawer({ mode: "password", user })}
                        >
                          {t("Set password")}
                        </button>
                        <button
                          className={`button button-compact ${user.isActive ? "button-danger-secondary" : "button-secondary"}`}
                          type="button"
                          onClick={() => setConfirm({ user, busy: false, error: null })}
                        >
                          {user.isActive ? t("Deactivate") : t("Activate")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {drawer ? (
        <UserDrawer
          key={`${drawer.mode}-${drawer.user?.id ?? "new"}`}
          mode={drawer.mode}
          user={drawer.user ?? null}
          projects={projectOptions}
          onClose={() => setDrawer(null)}
          onSaved={(saved, created) => {
            setUsers((current) => {
              const sameFilter = !projectId || saved.projectId === projectId;
              if (created) return sameFilter ? [saved, ...current] : current;
              if (!sameFilter) return current.filter((item) => item.id !== saved.id);
              return current.map((item) => (item.id === saved.id ? saved : item));
            });
            setBanner(
              created ? "User created." : drawer.mode === "password" ? "Password updated." : "User updated.",
            );
            setDrawer(null);
          }}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title={confirm.user.isActive ? "Deactivate user" : "Activate user"}
          description={t(
            confirm.user.isActive
              ? "Deactivate {name}? They will be signed out and cannot log in until you activate the account."
              : "Activate {name}? They will be able to sign in again.",
            { name: fullName(confirm.user) },
          )}
          confirmLabel={confirm.user.isActive ? "Deactivate" : "Activate"}
          busyLabel={confirm.user.isActive ? "Deactivating..." : "Activating..."}
          tone={confirm.user.isActive ? "danger" : "primary"}
          busy={confirm.busy}
          error={confirm.error}
          onCancel={() => {
            if (!confirm.busy) setConfirm(null);
          }}
          onConfirm={() => {
            setConfirm((current) => (current ? { ...current, busy: true, error: null } : current));
            void changeStatus();
          }}
        />
      ) : null}
    </>
  );
}

function UserDrawer({ mode, user, projects, onClose, onSaved }) {
  const { t } = useI18n();
  const [form, setForm] = useState(() =>
    user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: "",
          projectId: user.projectId ?? "",
        }
      : emptyForm,
  );
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    const password = form.password;
    if (passwordTooLong(password)) {
      setFormError("Password must be 72 characters or fewer.");
      return;
    }

    if (mode === "password") {
      if (!password) {
        setFormError("Password is required.");
        return;
      }
      setFormError("");
      setSaving(true);
      try {
        const saved = await api(`/users/${user.id}`, {
          method: "PATCH",
          body: JSON.stringify({ password }),
        });
        onSaved(saved, false);
      } catch (requestError) {
        setError(requestError);
        setSaving(false);
      }
      return;
    }

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();
    if (!firstName) {
      setFormError("First name is required.");
      return;
    }
    if (!lastName) {
      setFormError("Last name is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    if (!form.projectId) {
      setFormError("Choose a project.");
      return;
    }
    if (mode === "create" && !password) {
      setFormError("Password is required.");
      return;
    }
    setFormError("");

    const creating = mode === "create";
    let body;
    if (creating) {
      body = { firstName, lastName, email, password, projectId: form.projectId };
    } else {
      body = {};
      if (firstName !== user.firstName) body.firstName = firstName;
      if (lastName !== user.lastName) body.lastName = lastName;
      if (email !== user.email) body.email = email;
      if (form.projectId !== user.projectId) body.projectId = form.projectId;
      if (password) body.password = password;
      if (Object.keys(body).length === 0) {
        setFormError("Change a field before saving.");
        return;
      }
    }

    setSaving(true);
    try {
      const saved = await api(creating ? "/users" : `/users/${user.id}`, {
        method: creating ? "POST" : "PATCH",
        body: JSON.stringify(body),
      });
      onSaved(saved, creating);
    } catch (requestError) {
      setError(requestError);
      setSaving(false);
    }
  }

  const title = mode === "password" ? "Set a new password" : mode === "edit" ? "Edit user" : "Create user";

  return (
    <Drawer title={title} subtitle={user ? fullName(user) : t("Project user")} onClose={onClose}>
      <form className="form-stack" onSubmit={handleSubmit}>
        <ErrorNotice error={error} />
        {formError ? (
          <div className="notice notice-error" role="alert">
            <strong>{t(formError)}</strong>
          </div>
        ) : null}

        {mode === "password" ? (
          <PasswordField
            label="New password"
            value={form.password}
            onChange={(value) => update("password", value)}
            autoComplete="new-password"
            required
            help="72 characters at most."
          />
        ) : (
          <div className="form-grid">
            <label className="field">
              <span>{t("First name")}</span>
              <input
                value={form.firstName}
                onChange={(event) => update("firstName", event.target.value)}
                autoComplete="given-name"
                required
                autoFocus
              />
            </label>
            <label className="field">
              <span>{t("Last name")}</span>
              <input
                value={form.lastName}
                onChange={(event) => update("lastName", event.target.value)}
                autoComplete="family-name"
                required
              />
            </label>
            <label className="field field-span">
              <span>{t("Email")}</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                required
              />
            </label>
            <label className="field field-span">
              <span>{t("Project")}</span>
              <select
                value={form.projectId}
                onChange={(event) => update("projectId", event.target.value)}
                required
              >
                <option value="">{t("Choose project")}</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                    {project.isActive ? "" : ` (${t("Inactive")})`}
                  </option>
                ))}
              </select>
            </label>
            <div className="field-span">
              <PasswordField
                label={mode === "create" ? "Password" : "New password"}
                value={form.password}
                onChange={(value) => update("password", value)}
                autoComplete="new-password"
                required={mode === "create"}
                help={
                  mode === "create"
                    ? "Share this password with the user. 72 characters at most."
                    : "Leave blank to keep the current password."
                }
              />
            </div>
          </div>
        )}

        <div className="form-actions">
          <button className="button button-secondary" type="button" onClick={onClose} disabled={saving}>
            {t("Cancel")}
          </button>
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving
              ? t("Saving...")
              : mode === "password"
                ? t("Set password")
                : t("Save changes")}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
