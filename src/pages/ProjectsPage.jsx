import { useEffect, useState } from "react";
import { api } from "../api";
import {
  ConfirmDialog,
  Drawer,
  EmptyState,
  ErrorNotice,
  LoadingBlock,
  PageHeader,
  StatusBadge,
  SuccessNotice,
} from "../components/ui";
import { formatNumber } from "../format";
import { useI18n } from "../i18n";

const emptyForm = {
  name: "",
  leaderName: "",
  monthlySmsAllocation: "",
  isActive: true,
};

export function ProjectsPage({ navigate }) {
  const { t, language } = useI18n();
  const [projects, setProjects] = useState([]);
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
        if (!active) return;
        setProjects(Array.isArray(body) ? body : []);
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
  }, [tick]);

  const activeCount = projects.filter((project) => project.isActive).length;
  const userCount = projects.reduce((sum, project) => sum + (project.userCount ?? 0), 0);
  const used = projects.reduce((sum, project) => sum + (project.usage?.used ?? 0), 0);

  async function changeStatus() {
    if (!confirm) return;
    const next = !confirm.project.isActive;
    try {
      const updated = await api(`/projects/${confirm.project.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: next }),
      });
      setProjects((current) =>
        current.map((project) => (project.id === updated.id ? updated : project)),
      );
      setBanner(next ? "Project updated." : "Project updated.");
      setConfirm(null);
    } catch (requestError) {
      setConfirm((current) => (current ? { ...current, error: requestError, busy: false } : current));
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Super admin"
        title="Projects"
        subtitle={t("Set the leader, the monthly allocation, and whether the project may send.")}
      >
        <button className="button button-secondary" type="button" onClick={() => setTick((value) => value + 1)}>
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
          {t("Create project")}
        </button>
      </PageHeader>

      <div className="stats-grid stats-grid-4">
        <Stat label={t("Projects")} value={formatNumber(projects.length, language)} mark="P" />
        <Stat label={t("Active projects")} value={formatNumber(activeCount, language)} mark="A" />
        <Stat label={t("Assigned users")} value={formatNumber(userCount, language)} mark="U" />
        <Stat label={t("SMS used this month")} value={formatNumber(used, language)} mark="S" gold />
      </div>

      {banner ? <SuccessNotice title={banner} /> : null}
      <ErrorNotice error={error} />

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>{t("Project directory")}</h2>
            <p>{t("Projects")}</p>
          </div>
        </header>
        {loading && projects.length === 0 ? (
          <LoadingBlock label="Loading projects" />
        ) : projects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create a project, set the leader, and give it a monthly SMS allocation."
          />
        ) : (
          <div className="table-scroll">
            <table className="table-projects">
              <thead>
                <tr>
                  <th>{t("Name")}</th>
                  <th>{t("Leader")}</th>
                  <th>{t("Status")}</th>
                  <th>{t("Allocation")}</th>
                  <th>{t("Used this month")}</th>
                  <th>{t("Remaining")}</th>
                  <th>{t("Users")}</th>
                  <th className="table-action-wide">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td>
                      <strong>{project.name}</strong>
                    </td>
                    <td>{project.leaderName}</td>
                    <td>
                      <StatusBadge active={project.isActive} />
                    </td>
                    <td>{formatNumber(project.monthlySmsAllocation, language)}</td>
                    <td>{formatNumber(project.usage?.used ?? 0, language)}</td>
                    <td>{formatNumber(project.usage?.remaining ?? 0, language)}</td>
                    <td>{formatNumber(project.userCount ?? 0, language)}</td>
                    <td className="table-action-wide">
                      <div className="table-actions">
                        <button
                          className="button button-secondary button-compact"
                          type="button"
                          onClick={() => setDrawer({ mode: "edit", project })}
                        >
                          {t("Edit")}
                        </button>
                        <button
                          className="button button-secondary button-compact"
                          type="button"
                          onClick={() => navigate(`/activity?projectId=${project.id}`)}
                        >
                          {t("Activity")}
                        </button>
                        <button
                          className={`button button-compact ${project.isActive ? "button-danger-secondary" : "button-secondary"}`}
                          type="button"
                          onClick={() => setConfirm({ project, busy: false, error: null })}
                        >
                          {project.isActive ? t("Deactivate") : t("Activate")}
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
        <ProjectDrawer
          key={drawer.project?.id ?? "create"}
          project={drawer.project ?? null}
          onClose={() => setDrawer(null)}
          onSaved={(saved, created) => {
            setProjects((current) => {
              if (created) return [saved, ...current];
              return current.map((project) => (project.id === saved.id ? saved : project));
            });
            setBanner(created ? "Project created." : "Project updated.");
            setDrawer(null);
          }}
        />
      ) : null}

      {confirm ? (
        <ConfirmDialog
          title={confirm.project.isActive ? "Deactivate project" : "Activate project"}
          description={t(
            confirm.project.isActive
              ? "Deactivate {name}? Users can still sign in and read history, but they cannot send SMS."
              : "Activate {name}? Users will be able to send SMS again.",
            { name: confirm.project.name },
          )}
          confirmLabel={confirm.project.isActive ? "Deactivate" : "Activate"}
          busyLabel={confirm.project.isActive ? "Deactivating..." : "Activating..."}
          tone={confirm.project.isActive ? "danger" : "primary"}
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

function Stat({ label, value, mark, gold = false }) {
  return (
    <article className="stat-card">
      <span className={`stat-icon ${gold ? "stat-icon-gold" : "stat-icon-charcoal"}`} aria-hidden="true">
        {mark}
      </span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function ProjectDrawer({ project, onClose, onSaved }) {
  const { t } = useI18n();
  const [form, setForm] = useState(() =>
    project
      ? {
          name: project.name,
          leaderName: project.leaderName,
          monthlySmsAllocation: String(project.monthlySmsAllocation),
          isActive: project.isActive,
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
    const name = form.name.trim();
    const leaderName = form.leaderName.trim();
    const allocationText = form.monthlySmsAllocation.trim();

    if (!name) {
      setFormError("Name is required.");
      return;
    }
    if (name.length > 120 || leaderName.length > 120) {
      setFormError("Use at most 120 characters.");
      return;
    }
    if (!leaderName) {
      setFormError("Leader name is required.");
      return;
    }
    if (!/^\d+$/.test(allocationText) || Number(allocationText) > 10000000) {
      setFormError("Enter a whole number from 0 to 10,000,000.");
      return;
    }
    const monthlySmsAllocation = Number(allocationText);
    setFormError("");

    const creating = !project;
    let body;
    if (creating) {
      body = { name, leaderName, monthlySmsAllocation, isActive: form.isActive };
    } else {
      body = {};
      if (name !== project.name) body.name = name;
      if (leaderName !== project.leaderName) body.leaderName = leaderName;
      if (monthlySmsAllocation !== project.monthlySmsAllocation) {
        body.monthlySmsAllocation = monthlySmsAllocation;
      }
      if (form.isActive !== project.isActive) body.isActive = form.isActive;
      if (Object.keys(body).length === 0) {
        setFormError("Change a field before saving.");
        return;
      }
    }

    setSaving(true);
    try {
      const saved = await api(creating ? "/projects" : `/projects/${project.id}`, {
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
      title={project ? "Edit project" : "Create project"}
      subtitle={project ? project.name : t("Project directory")}
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
          <input
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            maxLength={120}
            required
            autoFocus
          />
        </label>
        <label className="field">
          <span>{t("Leader name")}</span>
          <input
            value={form.leaderName}
            onChange={(event) => update("leaderName", event.target.value)}
            maxLength={120}
            required
          />
        </label>
        <label className="field">
          <span>{t("Monthly SMS allocation")}</span>
          <input
            inputMode="numeric"
            value={form.monthlySmsAllocation}
            onChange={(event) => update("monthlySmsAllocation", event.target.value)}
            required
          />
          <small className="field-help">
            {t(
              "Integer from 0 to 10,000,000. Lowering the allocation does not erase messages already counted.",
            )}
          </small>
        </label>
        <label className="check-row">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => update("isActive", event.target.checked)}
          />
          <span>{t("Project may send SMS")}</span>
        </label>
        <div className="form-actions">
          <button className="button button-secondary" type="button" onClick={onClose} disabled={saving}>
            {t("Cancel")}
          </button>
          <button className="button button-primary" type="submit" disabled={saving}>
            {saving ? t("Saving...") : t("Save changes")}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
