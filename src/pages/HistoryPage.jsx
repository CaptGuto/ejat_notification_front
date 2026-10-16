import { useEffect, useState } from "react";
import { api, toQuery } from "../api";
import { SmsLogTable } from "../components/SmsLogTable";
import { PageHeader } from "../components/ui";
import { ErrorNotice } from "../components/ui";
import { useI18n } from "../i18n";

const LIMIT = 20;

export function HistoryPage() {
  const { t } = useI18n();
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    api(`/sms/logs${toQuery({ page, limit: LIMIT })}`)
      .then((body) => {
        if (!active) return;
        setLogs(Array.isArray(body.data) ? body.data : []);
        setTotal(body.total ?? 0);
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
  }, [page, tick]);

  const pages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <>
      <PageHeader
        eyebrow="Send history"
        title="History"
        subtitle={t("Every message recorded for your project.")}
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
      <ErrorNotice error={error} />
      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>{t("Send history")}</h2>
            <p>{t("Messages you send will appear here.")}</p>
          </div>
        </header>
        <SmsLogTable
          logs={logs}
          loading={loading}
          emptyTitle="No messages yet"
          emptyDescription="Messages you send will appear here."
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
