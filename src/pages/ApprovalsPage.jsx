import { useEffect, useState } from "react";
import { api } from "../api";
import {
  ConfirmDialog,
  EmptyState,
  ErrorNotice,
  LoadingBlock,
  PageHeader,
  SuccessNotice,
} from "../components/ui";
import { formatDateTime, formatNumber, fullName } from "../format";
import { useI18n } from "../i18n";

export function ApprovalsPage() {
  const { t, language } = useI18n();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [banner, setBanner] = useState("");
  const [tick, setTick] = useState(0);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    let active = true;
    api("/sms/approvals")
      .then((body) => {
        if (!active) return;
        setRows(Array.isArray(body) ? body : []);
        setError(null);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tick]);

  async function review() {
    if (!confirm) return;
    setConfirm({ ...confirm, busy: true, error: null });
    try {
      const body = await api(`/sms/approvals/${confirm.row.id}/${confirm.action}`, {
        method: "POST",
      });
      setBanner(
        confirm.action === "approve"
          ? t("Batch approved. {queued} numbers were queued.", {
              queued: formatNumber(body.queued ?? confirm.row.phoneCount, language),
            })
          : t("Batch rejected. The allocation was released."),
      );
      setConfirm(null);
      setLoading(true);
      setTick((value) => value + 1);
    } catch (requestError) {
      setConfirm((current) =>
        current ? { ...current, busy: false, error: requestError } : current,
      );
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Approvals"
        title="Waiting for approval"
        subtitle={t(
          "A send of more than 100 numbers stays here until you approve or reject it.",
        )}
      />

      {banner ? (
        <SuccessNotice>
          <strong>{banner}</strong>
        </SuccessNotice>
      ) : null}
      <ErrorNotice error={error} />

      <section className="panel">
        {loading ? <LoadingBlock /> : null}
        {!loading && rows.length === 0 ? (
          <EmptyState
            title="No batches are waiting for approval."
            description="Project users can send 100 numbers or fewer without this step."
          />
        ) : null}
        {!loading && rows.length > 0 ? (
          <div className="table-scroll">
            <table className="table-projects">
              <thead>
                <tr>
                  <th>{t("Time")}</th>
                  <th>{t("Project")}</th>
                  <th>{t("Sender")}</th>
                  <th>{t("Numbers")}</th>
                  <th>{t("Message")}</th>
                  <th className="table-action-wide">{t("Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDateTime(row.createdAt, language)}</td>
                    <td>{row.projectName ?? t("Project")}</td>
                    <td>{row.requester ? fullName(row.requester) : t("Sender")}</td>
                    <td>{formatNumber(row.phoneCount, language)}</td>
                    <td>
                      <span className="message-cell" title={row.message}>
                        {row.message}
                      </span>
                    </td>
                    <td className="table-action-wide">
                      <div className="table-actions">
                        <button
                          className="button button-primary button-compact"
                          type="button"
                          onClick={() =>
                            setConfirm({ row, action: "approve", busy: false, error: null })
                          }
                        >
                          {t("Approve")}
                        </button>
                        <button
                          className="button button-secondary button-compact"
                          type="button"
                          onClick={() =>
                            setConfirm({ row, action: "reject", busy: false, error: null })
                          }
                        >
                          {t("Reject")}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {confirm ? (
        <ConfirmDialog
          title={confirm.action === "approve" ? "Approve batch" : "Reject batch"}
          description={t(
            confirm.action === "approve"
              ? "Approve {count} numbers for {project}? They will be queued after you confirm."
              : "Reject {count} numbers for {project}? Nothing will be sent, and the reserved allocation is released.",
            {
              count: formatNumber(confirm.row.phoneCount, language),
              project: confirm.row.projectName ?? t("Project"),
            },
          )}
          confirmLabel={confirm.action === "approve" ? "Approve" : "Reject"}
          busyLabel={confirm.action === "approve" ? "Approving..." : "Rejecting..."}
          tone={confirm.action === "approve" ? "primary" : "danger"}
          busy={confirm.busy}
          error={confirm.error}
          onCancel={() => setConfirm(null)}
          onConfirm={() => void review()}
        />
      ) : null}
    </>
  );
}
