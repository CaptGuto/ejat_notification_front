import { useEffect, useMemo, useState } from "react";
import { api, toQuery } from "../api";
import { SmsLogTable } from "../components/SmsLogTable";
import { ErrorNotice, PageHeader, UsageCards } from "../components/ui";
import { formatYearMonth } from "../format";
import { useI18n } from "../i18n";

const LIMIT = 20;

export function ActivityPage({ search, navigate }) {
  const { t, language } = useI18n();
  const projectId = new URLSearchParams(search).get("projectId") ?? "";
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);
  const [seenProject, setSeenProject] = useState(projectId);

  if (seenProject !== projectId) {
    setSeenProject(projectId);
    setPage(1);
    setLoading(true);
  }

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
    const logsRequest = api(
      `/sms/logs${toQuery({ page, limit: LIMIT, projectId: projectId || undefined })}`,
    );
    const summaryRequest = projectId
      ? api(`/sms/summary${toQuery({ projectId })}`)
      : Promise.resolve(null);

    Promise.all([logsRequest, summaryRequest])
      .then(([logBody, summaryBody]) => {
        if (!active) return;
        setLogs(Array.isArray(logBody.data) ? logBody.data : []);
        setTotal(logBody.total ?? 0);
        setSummary(summaryBody);
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
  }, [projectId, page, tick]);

  const projectNames = useMemo(
    () => Object.fromEntries(projects.map((project) => [project.id, project.name])),
    [projects],
  );
  const options = useMemo(
    () => [...projects].sort((a, b) => a.name.localeCompare(b.name)),
    [projects],
  );
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const month = summary?.usage?.yearMonth
    ? formatYearMonth(summary.usage.yearMonth, language)
    : "";

  return (
    <>
      <PageHeader
        eyebrow="Send history"
        title="Project activity"
        subtitle={
          summary
            ? t("Leader, {name}", { name: summary.project.leaderName })
            : t("Usage and the send log.")
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
      </PageHeader>

      <label className="filter-field filter-field-page">
        <span>{t("Project")}</span>
        <select
          className="filter-select"
          value={projectId}
          onChange={(event) => {
            const next = event.target.value;
            navigate(next ? `/activity?projectId=${next}` : "/activity");
          }}
        >
          <option value="">{t("All projects")}</option>
          {options.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
              {project.isActive ? "" : ` (${t("Inactive")})`}
            </option>
          ))}
        </select>
      </label>

      <ErrorNotice error={error} />

      {summary ? (
        <section className="panel usage-panel">
          <header className="panel-header">
            <div>
              <h2>{summary.project.name}</h2>
              <p>
                {month} · {summary.project.isActive ? t("Active") : t("Inactive")}
              </p>
            </div>
          </header>
          <div className="panel-pad">
            <UsageCards usage={summary.usage} />
          </div>
        </section>
      ) : (
        <p className="page-note">
          {t("Usage is counted per project. Choose one project to see its allocation.")}
        </p>
      )}

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>{t("Send history")}</h2>
            <p>
              {projectId
                ? t("Messages sent for this project will appear here.")
                : t("All projects")}
            </p>
          </div>
        </header>
        <SmsLogTable
          logs={logs}
          loading={loading}
          emptyTitle="No messages yet"
          emptyDescription={
            projectId
              ? "Messages sent for this project will appear here."
              : "Choose a project to see this month's usage and send history."
          }
          showProject={!projectId}
          projectNames={projectNames}
          page={page}
          pages={pages}
          total={total}
          onPage={(next) => {
            setLoading(true);
            setPage(next);
          }}
        />
      </section>
    </>
  );
}
