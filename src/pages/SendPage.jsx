import { useEffect, useMemo, useState } from "react";
import { ApiError, api, toQuery } from "../api";
import { SmsLogTable } from "../components/SmsLogTable";
import {
  ErrorNotice,
  PageHeader,
  SuccessNotice,
  UsageCards,
  WarningNotice,
} from "../components/ui";
import { formatNumber, formatYearMonth } from "../format";
import { useAuth } from "../auth";
import { useI18n } from "../i18n";
import {
  APPROVAL_THRESHOLD,
  MESSAGE_MAX,
  PHONE_MAX,
  analyzePhones,
  messageLength,
  phoneMatchesInvalid,
  splitPhones,
} from "../phones";

const LOG_LIMIT = 8;

export function SendPage({ navigate }) {
  const { user, usage, setUsage } = useAuth();
  const { t, language } = useI18n();
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logTotal, setLogTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [phonesText, setPhonesText] = useState("");
  const [serverInvalid, setServerInvalid] = useState([]);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);
  const [tick, setTick] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [contactQuery, setContactQuery] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      api("/sms/summary"),
      api(`/sms/logs${toQuery({ page: 1, limit: LOG_LIMIT })}`),
    ])
      .then(([summaryBody, logBody]) => {
        if (!active) return;
        setSummary(summaryBody);
        setUsage(summaryBody.usage);
        setLogs(Array.isArray(logBody.data) ? logBody.data : []);
        setLogTotal(logBody.total ?? 0);
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
  }, [tick, setUsage]);

  useEffect(() => {
    let active = true;
    api("/contacts")
      .then((body) => {
        if (active) setContacts(Array.isArray(body) ? body : []);
      })
      .catch(() => {
        if (active) setContacts([]);
      });
    return () => {
      active = false;
    };
  }, [tick]);

  const analysis = useMemo(() => analyzePhones(phonesText), [phonesText]);
  const visibleContacts = useMemo(() => {
    const needle = contactQuery.trim().toLowerCase();
    if (!needle) return contacts;
    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(needle) || contact.phone.includes(needle),
    );
  }, [contactQuery, contacts]);
  const length = messageLength(message);
  const currentUsage = summary?.usage ?? usage;
  const project = summary?.project ?? user.project;
  const inactive = project ? project.isActive === false : false;
  const needsApproval = analysis.phones.length > APPROVAL_THRESHOLD;
  const overQuota = Boolean(
    currentUsage && analysis.phones.length > currentUsage.remaining,
  );
  const hasInvalid = analysis.items.some((item) => phoneMatchesInvalid(item, serverInvalid));
  const canSend =
    !sending &&
    !inactive &&
    !loading &&
    length > 0 &&
    length <= MESSAGE_MAX &&
    analysis.phones.length > 0 &&
    analysis.phones.length <= PHONE_MAX &&
    !hasInvalid &&
    !overQuota &&
    (currentUsage?.remaining ?? 0) > 0;

  const quotaError =
    error instanceof ApiError && error.status === 409 && error.body?.requested != null
      ? error
      : null;
  const otherError = quotaError ? null : error;

  function editMessage(value) {
    setMessage(value);
    setResult(null);
  }

  function editPhones(value) {
    setPhonesText(value);
    setServerInvalid([]);
    setResult(null);
  }

  function addContact(contact) {
    if (analysis.phones.includes(contact.phone)) return;
    setPhonesText((current) => {
      const trimmed = current.trim();
      if (!trimmed) return `${contact.phone},`;
      const separator = /,\s*$/.test(trimmed) ? " " : ", ";
      return `${trimmed}${separator}${contact.phone},`;
    });
    setServerInvalid([]);
    setResult(null);
  }

  function removeContact(contact) {
    const remaining = analysis.items
      .filter((item) => item.normalized !== contact.phone)
      .map((item) => item.original);
    if (remaining.length === 0) {
      setPhonesText("");
    } else if (phonesText.includes(",")) {
      const trailingComma = /,\s*$/.test(phonesText.trim());
      setPhonesText(`${remaining.join(", ")}${trailingComma ? "," : ""}`);
    } else {
      setPhonesText(remaining.join("\n"));
    }
    setServerInvalid([]);
    setResult(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setResult(null);
    setError(null);
    const phones = splitPhones(phonesText);
    if (messageLength(message) === 0 || messageLength(message) > MESSAGE_MAX) return;
    if (phones.length === 0 || analysis.phones.length > PHONE_MAX) return;
    if (analysis.items.some((item) => item.invalid)) {
      setServerInvalid(analysis.items.filter((item) => item.invalid).map((item) => item.original));
      return;
    }

    setSending(true);
    try {
      const body = await api("/sms/send", {
        method: "POST",
        body: JSON.stringify({ message: message.trim(), phones }),
      });
      setResult(body);
      setUsage(body.usage);
      setSummary((current) => (current ? { ...current, usage: body.usage } : current));
      if (body.failures?.length) {
        setPhonesText(body.failures.map((failure) => failure.phone).join("\n"));
      } else {
        setMessage("");
        setPhonesText("");
      }
      setTick((value) => value + 1);
    } catch (requestError) {
      setError(requestError);
      if (requestError instanceof ApiError && Array.isArray(requestError.body?.invalidPhones)) {
        setServerInvalid(requestError.body.invalidPhones);
      }
      if (requestError instanceof ApiError && requestError.status === 503) {
        setTick((value) => value + 1);
      }
      setSending(false);
    } finally {
      setSending(false);
    }
  }

  const month = currentUsage?.yearMonth
    ? formatYearMonth(currentUsage.yearMonth, language)
    : "";

  return (
    <>
      <PageHeader
        eyebrow="Send SMS"
        title={project?.name ?? "Send"}
        translateTitle={!project?.name}
        subtitle={
          summary?.project?.leaderName
            ? `${t("Leader, {name}", { name: summary.project.leaderName })}${month ? ` · ${month}` : ""}`
            : t("Write one message, then add one number or a list.")
        }
      />

      {inactive ? (
        <WarningNotice title="This project is deactivated and cannot send SMS.">
          <p>{t("You can still read usage and history.")}</p>
        </WarningNotice>
      ) : null}

      {currentUsage?.remaining === 0 && !inactive ? (
        <WarningNotice title="No SMS remaining this month.">
          <p>{t("Sending stays closed until next month.")}</p>
        </WarningNotice>
      ) : null}

      {currentUsage ? <UsageCards usage={currentUsage} /> : null}

      <div className="send-layout">
      <section className="panel contact-picker">
        <header className="panel-header">
          <div>
            <h2>{t("Contacts")}</h2>
            <p>{t("Click + to add a number, or − to remove it.")}</p>
          </div>
          <button
            className="button button-secondary button-compact"
            type="button"
            onClick={() => navigate("/contacts")}
          >
            {t("Manage contacts")}
          </button>
        </header>
        <div className="panel-pad contact-picker-body">
          {contacts.length === 0 ? (
            <p className="field-help">{t("No saved contacts yet.")}</p>
          ) : (
            <>
              <input
                value={contactQuery}
                onChange={(event) => setContactQuery(event.target.value)}
                placeholder={t("Search by name or phone")}
                aria-label={t("Search contacts")}
              />
              <ul className="contact-picker-list">
                {visibleContacts.map((contact) => {
                  const alreadyAdded = analysis.phones.includes(contact.phone);
                  return (
                    <li key={contact.id}>
                      <span>
                        <strong>{contact.name}</strong>
                        <small>{contact.phone}</small>
                      </span>
                      <button
                        className={`icon-button${alreadyAdded ? " icon-button-remove" : ""}`}
                        type="button"
                        aria-label={
                          alreadyAdded
                            ? t("Remove {name}", { name: contact.name })
                            : t("Add {name}", { name: contact.name })
                        }
                        onClick={() => (alreadyAdded ? removeContact(contact) : addContact(contact))}
                      >
                        {alreadyAdded ? "−" : "+"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>{t("Send message")}</h2>
            <p>{t("Write one message, then add one number or a list.")}</p>
          </div>
        </header>
        <form className="panel-pad form-stack" onSubmit={handleSubmit}>
          <ErrorNotice error={otherError} />
          {quotaError ? (
            <div className="notice notice-error" role="alert">
              <strong>{t("Monthly SMS allocation exceeded")}</strong>
              <p>
                {t(
                  "{remaining} SMS remaining. You asked to send {requested}. Shorten the list and try again. Nothing was sent.",
                  {
                    remaining: formatNumber(quotaError.body.remaining, language),
                    requested: formatNumber(quotaError.body.requested, language),
                  },
                )}
              </p>
            </div>
          ) : null}

          {result?.pendingApproval ? (
            <WarningNotice>
              <strong>
                {t("{count} numbers are waiting for a super admin.", {
                  count: formatNumber(result.phones?.length ?? analysis.phones.length, language),
                })}
              </strong>
              <p>{t("Nothing was queued yet.")}</p>
            </WarningNotice>
          ) : null}

          {result && !result.pendingApproval ? (
            <SuccessNotice>
              <strong>
                {t("{queued} numbers were queued.", {
                  queued: formatNumber(result.queued, language),
                })}
              </strong>
              {result.duplicatesRemoved > 0 ? (
                <p>
                  {t("{count} duplicate numbers were removed.", {
                    count: formatNumber(result.duplicatesRemoved, language),
                  })}
                </p>
              ) : null}
            </SuccessNotice>
          ) : null}

          {result?.failures?.length ? (
            <WarningNotice>
              <strong>
                {t("{count} numbers could not be queued.", {
                  count: formatNumber(result.failures.length, language),
                })}
              </strong>
              <ul className="failure-list">
                {result.failures.map((failure) => (
                  <li key={`${failure.phone}-${failure.error}`}>
                    <strong>{failure.phone}</strong>
                    <span>{failure.error}</span>
                  </li>
                ))}
              </ul>
              <button
                className="button button-secondary button-compact"
                type="button"
                onClick={() => {
                  setPhonesText(result.failures.map((failure) => failure.phone).join("\n"));
                  setResult(null);
                }}
              >
                {t("Retry failed numbers")}
              </button>
            </WarningNotice>
          ) : null}

          <label className="field">
            <span className="label-row">
              <span>{t("Message")}</span>
              <small className={length > MESSAGE_MAX ? "count-over" : ""}>
                {formatNumber(length, language)} / {formatNumber(MESSAGE_MAX, language)}
              </small>
            </span>
            <textarea
              value={message}
              onChange={(event) => editMessage(event.target.value)}
              rows={5}
              required
              placeholder={t("Message")}
            />
            <small className="field-help">
              {t("Unicode is allowed, including Amharic. 335 characters at most.")}
            </small>
          </label>

          <label className="field">
            <span className="label-row">
              <span>{t("Phone numbers")}</span>
              <small>
                {t("{count} numbers ready.", {
                  count: formatNumber(analysis.phones.length, language),
                })}
              </small>
            </span>
            <textarea
              value={phonesText}
              onChange={(event) => editPhones(event.target.value)}
              rows={6}
              spellCheck={false}
              autoCorrect="off"
              placeholder={"251911223344\n0911223344"}
              required
            />
            <small className="field-help">
              {t(
                "Separate numbers with commas or new lines. 0911223344, 911223344, and +251911223344 are the same kind of number.",
              )}
            </small>
          </label>

          {analysis.items.length > 0 ? (
            <ul className="phone-list">
              {analysis.items.map((item, index) => {
                const invalid = phoneMatchesInvalid(item, serverInvalid);
                const tone = invalid ? "invalid" : item.duplicate ? "duplicate" : "valid";
                return (
                  <li className={`phone-chip phone-chip-${tone}`} key={`${item.original}-${index}`}>
                    <span>{item.normalized ?? item.original}</span>
                    {invalid ? <small>{t("Invalid")}</small> : null}
                    {!invalid && item.duplicate ? <small>{t("Duplicate")}</small> : null}
                  </li>
                );
              })}
            </ul>
          ) : null}

          {hasInvalid ? (
            <div className="notice notice-error" role="alert">
              <strong>{t("One or more phone numbers are invalid")}</strong>
              <p>{t("Correct the highlighted numbers before sending.")}</p>
            </div>
          ) : null}

          {overQuota ? (
            <div className="notice notice-error" role="alert">
              <strong>{t("Monthly SMS allocation exceeded")}</strong>
              <p>
                {t(
                  "{count} numbers do not fit. {remaining} SMS remaining this month. Shorten the list. Nothing will be sent until they fit.",
                  {
                    count: formatNumber(analysis.phones.length, language),
                    remaining: formatNumber(currentUsage.remaining, language),
                  },
                )}
              </p>
            </div>
          ) : null}

          {analysis.duplicatesRemoved > 0 && !hasInvalid ? (
            <p className="field-help">
              {t("{count} duplicate numbers will be sent once.", {
                count: formatNumber(analysis.duplicatesRemoved, language),
              })}
            </p>
          ) : null}

          {needsApproval && !overQuota && !hasInvalid ? (
            <WarningNotice title="More than 100 numbers need a super admin before anything is queued." />
          ) : null}

          <div className="form-actions">
            <button className="button button-primary" type="submit" disabled={!canSend}>
              {sending
                ? t("Sending...")
                : needsApproval
                  ? t("Request approval")
                  : t("Send message")}
            </button>
          </div>
        </form>
      </section>
      </div>

      <section className="panel">
        <header className="panel-header">
          <div>
            <h2>{t("Recent messages")}</h2>
            <p>{t("The latest messages for your project.")}</p>
          </div>
          <button
            className="button button-secondary button-compact"
            type="button"
            onClick={() => navigate("/history")}
          >
            {t("View history")}
          </button>
        </header>
        <SmsLogTable
          logs={logs}
          loading={loading}
          emptyTitle="No messages yet"
          emptyDescription="Messages you send will appear here."
        />
        {logTotal > logs.length ? (
          <div className="pager">
            <span />
            <button
              className="button button-secondary button-compact"
              type="button"
              onClick={() => navigate("/history")}
            >
              {t("View history")}
            </button>
          </div>
        ) : null}
      </section>
    </>
  );
}
