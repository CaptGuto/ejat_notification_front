import { useEffect, useMemo, useState } from "react";
import { api, toQuery } from "../api";
import { useAuth } from "../auth";
import {
  ConfirmDialog,
  Drawer,
  EmptyState,
  ErrorNotice,
  LoadingBlock,
  PageHeader,
  SuccessNotice,
} from "../components/ui";
import { useI18n } from "../i18n";
import { normalizeEthiopianPhone } from "../phones";

export function ContactsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const isAdmin = user.role === "SUPER_ADMIN";
  const [contacts, setContacts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectId, setProjectId] = useState(isAdmin ? "" : user.projectId ?? "");
  const [query, setQuery] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState("");
  const [tick, setTick] = useState(0);
  const [drawer, setDrawer] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    const id = window.setTimeout(() => setQ(query.trim()), 250);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!isAdmin) return undefined;
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
  }, [isAdmin, tick]);

  useEffect(() => {
    let active = true;
    api(`/contacts${toQuery({ projectId: isAdmin ? projectId : undefined, q })}`)
      .then((body) => {
        if (!active) return;
        setContacts(Array.isArray(body) ? body : []);
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
  }, [isAdmin, projectId, q, tick]);

  const projectOptions = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name)),
    [projects],
  );

  async function removeContact() {
    if (!confirm) return;
    try {
      await api(`/contacts/${confirm.contact.id}`, { method: "DELETE" });
      setContacts((current) => current.filter((item) => item.id !== confirm.contact.id));
      setBanner("Contact deleted.");
      setConfirm(null);
    } catch (requestError) {
      setConfirm((current) => (current ? { ...current, error: requestError, busy: false } : current));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Contacts"
        subtitle={
          isAdmin
            ? t("Every project's contacts. Choose a project to narrow the list.")
            : t("Other projects cannot see these contacts.")
        }
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
          {t("Create contact")}
        </button>
      </PageHeader>

      {banner ? <SuccessNotice title={banner} /> : null}
      <ErrorNotice error={error} />

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>{t("Contacts")}</h2>
            <p>{t("Save people this project texts often, then pick them when sending.")}</p>
          </div>
          <div className="contact-filters">
            {isAdmin ? (
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
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="filter-field">
              <span>{t("Search contacts")}</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("Search by name or phone")}
              />
            </label>
          </div>
        </header>

        {loading && contacts.length === 0 ? (
          <LoadingBlock label="Loading contacts" />
        ) : contacts.length === 0 ? (
          <EmptyState
            title="No contacts yet"
            description="Save the people your project texts often."
          />
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{t("Name")}</th>
                  <th>{t("Phone")}</th>
                  {isAdmin ? <th>{t("Project")}</th> : null}
                  <th className="table-action-wide">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>
                      <strong>{contact.name}</strong>
                    </td>
                    <td>{contact.phone}</td>
                    {isAdmin ? <td>{contact.project?.name ?? t("No project")}</td> : null}
                    <td className="table-action-wide">
                      <div className="table-actions">
                        <button
                          className="button button-secondary button-compact"
                          type="button"
                          onClick={() => setDrawer({ mode: "edit", contact })}
                        >
                          {t("Edit")}
                        </button>
                        <button
                          className="button button-danger-secondary button-compact"
                          type="button"
                          onClick={() => setConfirm({ contact, busy: false, error: null })}
                        >
                          {t("Delete")}
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
        <ContactDrawer
          key={`${drawer.mode}-${drawer.contact?.id ?? "new"}`}
          mode={drawer.mode}
          contact={drawer.contact ?? null}
          isAdmin={isAdmin}
          projects={projectOptions}
          defaultProjectId={projectId || user.projectId || ""}
          onClose={() => setDrawer(null)}
          onSaved={(saved, created) => {
            setContacts((current) => {
              const sameProject = !isAdmin || !projectId || saved.projectId === projectId;
              const sameQuery =
                !q ||
                saved.name.toLowerCase().includes(q.toLowerCase()) ||
                saved.phone.includes(q);
              const visible = sameProject && sameQuery;
              if (created) return visible ? [saved, ...current] : current;
              if (!visible) return current.filter((item) => item.id !== saved.id);
              return current.map((item) => (item.id === saved.id ? saved : item));
            });
            setBanner(created ? "Contact created." : "Contact updated.");
            setDrawer(null);
          }}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title="Delete contact"
          description={t("Delete {name}? This only removes them from the contact list.", {
            name: confirm.contact.name,
          })}
          confirmLabel="Delete"
          busyLabel="Deleting..."
          tone="danger"
          busy={confirm.busy}
          error={confirm.error}
          onCancel={() => {
            if (!confirm.busy) setConfirm(null);
          }}
          onConfirm={() => {
            setConfirm((current) => (current ? { ...current, busy: true, error: null } : current));
            void removeContact();
          }}
        />
      ) : null}
    </>
  );
}

function ContactDrawer({
  mode,
  contact,
  isAdmin,
  projects,
  defaultProjectId,
  onClose,
  onSaved,
}) {
  const { t } = useI18n();
  const [name, setName] = useState(contact?.name ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [projectId, setProjectId] = useState(contact?.projectId ?? defaultProjectId);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedName) {
      setFormError("Name is required.");
      return;
    }
    if (!trimmedPhone) {
      setFormError("Phone number is required.");
      return;
    }
    if (!normalizeEthiopianPhone(trimmedPhone)) {
      setFormError("Enter a valid Ethiopian mobile number.");
      return;
    }
    if (isAdmin && !projectId) {
      setFormError("Choose a project.");
      return;
    }
    setFormError("");
    setError(null);

    const creating = mode === "create";
    let body;
    if (creating) {
      body = { name: trimmedName, phone: trimmedPhone };
      if (isAdmin) body.projectId = projectId;
    } else {
      body = {};
      if (trimmedName !== contact.name) body.name = trimmedName;
      if (trimmedPhone !== contact.phone) body.phone = trimmedPhone;
      if (isAdmin && projectId !== contact.projectId) body.projectId = projectId;
      if (Object.keys(body).length === 0) {
        setFormError("Change a field before saving.");
        return;
      }
    }

    setSaving(true);
    try {
      const saved = await api(creating ? "/contacts" : `/contacts/${contact.id}`, {
        method: creating ? "POST" : "PATCH",
        body: JSON.stringify(body),
      });
      onSaved(saved, creating);
    } catch (requestError) {
      setError(requestError);
      setSaving(false);
    }
  }

  return (
    <Drawer
      title={mode === "edit" ? "Edit contact" : "Create contact"}
      subtitle={contact?.name ?? t("Saved for one project")}
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <ErrorNotice error={error} />
        {formError ? (
          <div className="notice notice-error" role="alert">
            <strong>{t(formError)}</strong>
          </div>
        ) : null}
        <label className="field">
          <span>{t("Name")}</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required autoFocus />
        </label>
        <label className="field">
          <span>{t("Phone number")}</span>
          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            inputMode="tel"
            autoComplete="tel"
            placeholder="0911223344"
            required
          />
          <small className="field-help">
            {t("Use 0911223344, 911223344, or +251911223344.")}
          </small>
        </label>
        {isAdmin ? (
          <label className="field">
            <span>{t("Project")}</span>
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)} required>
              <option value="">{t("Choose project")}</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <div className="form-actions">
          <button className="button button-secondary" type="button" onClick={onClose} disabled={saving}>
            {t("Cancel")}
          </button>
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? t("Saving...") : t(mode === "create" ? "Create contact" : "Save changes")}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
