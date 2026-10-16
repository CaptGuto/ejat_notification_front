import { useI18n } from "../i18n";
import { formatDateTime, fullName, initials } from "../format";
import { EmptyState, LoadingBlock, Pager, QueueBadge } from "./ui";

export function SmsLogTable({
  logs,
  loading,
  emptyTitle,
  emptyDescription,
  showProject = false,
  projectNames = {},
  page,
  pages,
  total,
  onPage,
}) {
  const { t, language } = useI18n();

  if (loading && logs.length === 0) {
    return <LoadingBlock label="Loading messages" />;
  }

  if (!loading && logs.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>{t("Time")}</th>
              {showProject ? <th>{t("Project")}</th> : null}
              <th>{t("Sender")}</th>
              <th>{t("Phone")}</th>
              <th>{t("Message")}</th>
              <th>{t("Status")}</th>
              <th>{t("Error")}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="nowrap">{formatDateTime(log.createdAt, language)}</td>
                {showProject ? (
                  <td>{projectNames[log.projectId] ?? t("Project")}</td>
                ) : null}
                <td>
                  {log.sender ? (
                    <div className="person-cell">
                      <span className="avatar" aria-hidden="true">
                        {initials(log.sender)}
                      </span>
                      <span>
                        <strong>{fullName(log.sender)}</strong>
                        <small>{log.sender.email}</small>
                      </span>
                    </div>
                  ) : (
                    <span className="muted">{t("Unknown sender")}</span>
                  )}
                </td>
                <td className="nowrap">{log.phone}</td>
                <td>
                  <span className="message-cell" title={log.message}>
                    {log.message}
                  </span>
                </td>
                <td>
                  <QueueBadge status={log.status} />
                </td>
                <td>
                  <span className="error-cell">{log.error || "—"}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {onPage ? <Pager page={page} pages={pages} total={total} onPage={onPage} /> : null}
    </>
  );
}
