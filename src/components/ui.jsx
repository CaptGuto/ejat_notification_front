import { useEffect, useId, useState } from "react";
import { errorDetails } from "../api";
import { useI18n } from "../i18n";

export function Spinner({ light = false }) {
  return <span className={`spinner${light ? " spinner-light" : ""}`} aria-hidden="true" />;
}

export function LanguageSwitch() {
  const { language, setLanguage, t } = useI18n();
  return (
    <div className="language-switch" role="group" aria-label={t("Language")}>
      <button
        type="button"
        className={language === "en" ? "active" : ""}
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
      <button
        type="button"
        className={language === "am" ? "active" : ""}
        aria-pressed={language === "am"}
        onClick={() => setLanguage("am")}
      >
        አማ
      </button>
    </div>
  );
}

export function ErrorNotice({ error }) {
  const { t } = useI18n();
  if (!error) return null;
  const details = errorDetails(error);
  return (
    <div className="notice notice-error" role="alert">
      <strong>{t("Unable to complete the request")}</strong>
      <ul>
        {details.map((message) => (
          <li key={message}>{t(message)}</li>
        ))}
      </ul>
    </div>
  );
}

export function SuccessNotice({ title, children }) {
  const { t } = useI18n();
  if (!title && !children) return null;
  return (
    <div className="notice notice-success" role="status">
      {title ? <strong>{t(title)}</strong> : null}
      {children}
    </div>
  );
}

export function WarningNotice({ title, children }) {
  const { t } = useI18n();
  return (
    <div className="notice notice-warning" role="status">
      {title ? <strong>{t(title)}</strong> : null}
      {children}
    </div>
  );
}

export function EmptyState({ title, description }) {
  const { t } = useI18n();
  return (
    <div className="empty-state">
      <span className="empty-symbol" aria-hidden="true">
        +
      </span>
      <strong>{t(title)}</strong>
      <p>{t(description)}</p>
    </div>
  );
}

export function LoadingBlock({ label }) {
  const { t } = useI18n();
  return (
    <div className="loading-block" role="status">
      <Spinner />
      <span>{t(label)}</span>
    </div>
  );
}

export function RoleBadge({ role }) {
  const { t } = useI18n();
  const label = role === "SUPER_ADMIN" ? "Super admin" : "Project user";
  const tone = role === "SUPER_ADMIN" ? "badge-super-admin" : "badge-project-user";
  return <span className={`badge ${tone}`}>{t(label)}</span>;
}

export function StatusBadge({ active }) {
  const { t } = useI18n();
  return (
    <span className={`badge ${active ? "badge-active" : "badge-inactive"}`}>
      <span className="status-dot" aria-hidden="true" />
      {active ? t("Active") : t("Inactive")}
    </span>
  );
}

export function QueueBadge({ status }) {
  const { t } = useI18n();
  const failed = status === "FAILED";
  return (
    <span className={`badge ${failed ? "badge-failed" : "badge-queued"}`}>
      <span className="status-dot" aria-hidden="true" />
      {failed ? t("Failed") : t("Queued")}
    </span>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
  required = false,
  help,
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  return (
    <label className="field">
      <span>{t(label)}</span>
      <div className="input-with-action">
        <input
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder ? t(placeholder) : undefined}
          value={value}
          maxLength={72}
          required={required}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="input-action"
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? t("Hide") : t("Show")}
        </button>
      </div>
      {help ? <small className="field-help">{t(help)}</small> : null}
    </label>
  );
}

export function Drawer({ title, subtitle, onClose, children }) {
  const { t } = useI18n();
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="drawer-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="drawer-header">
          <div>
            <p className="eyebrow">{t("EJAT notifications")}</p>
            <h2 id={titleId}>{t(title)}</h2>
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label={t("Close")}>
            ×
          </button>
        </header>
        <div className="drawer-body">{children}</div>
      </section>
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  busyLabel,
  tone = "danger",
  busy,
  error,
  onCancel,
  onConfirm,
}) {
  const { t } = useI18n();
  const titleId = useId();

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape" && !busy) {
        event.stopImmediatePropagation();
        onCancel();
      }
    }
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [busy, onCancel]);

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel();
      }}
    >
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="confirm-icon" aria-hidden="true">
          !
        </div>
        <div>
          <h2 id={titleId}>{t(title)}</h2>
          <p>{description}</p>
        </div>
        <ErrorNotice error={error} />
        <div className="form-actions">
          <button className="button button-secondary" type="button" onClick={onCancel} disabled={busy}>
            {t("Cancel")}
          </button>
          <button
            className={`button ${tone === "danger" ? "button-danger" : "button-primary"}`}
            type="button"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? <Spinner light={tone !== "primary"} /> : null}
            {busy ? t(busyLabel) : t(confirmLabel)}
          </button>
        </div>
      </section>
    </div>
  );
}

export function Pager({ page, pages, total, onPage }) {
  const { t, language } = useI18n();
  if (total === 0) return null;
  return (
    <div className="pager">
      <button
        className="button button-secondary button-compact"
        type="button"
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
      >
        {t("Previous")}
      </button>
      <span>{t("Page {page} of {pages}", { page: formatPage(page, language), pages: formatPage(pages, language) })}</span>
      <button
        className="button button-secondary button-compact"
        type="button"
        onClick={() => onPage(page + 1)}
        disabled={page >= pages}
      >
        {t("Next")}
      </button>
    </div>
  );
}

function formatPage(value, language) {
  return new Intl.NumberFormat(language === "am" ? "am-ET" : "en").format(value);
}

export function PageHeader({ eyebrow, title, subtitle, children, translateTitle = true }) {
  const { t } = useI18n();
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <p className="eyebrow">{t(eyebrow)}</p> : null}
        <h1>{translateTitle ? t(title) : title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {children ? <div className="header-actions">{children}</div> : null}
    </header>
  );
}

export function UsageCards({ usage }) {
  const { t, language } = useI18n();
  const allocated = usage?.allocated ?? 0;
  const used = usage?.used ?? 0;
  const remaining = usage?.remaining ?? 0;
  const ratio = allocated === 0 ? (used > 0 ? 1 : 0) : Math.min(used / allocated, 1);
  const cards = [
    ["Allocated", allocated],
    ["Used", used],
    ["Remaining", remaining],
  ];

  return (
    <section className="usage-block" aria-label={t("This month")}>
      <div className="stats-grid stats-grid-3">
        {cards.map(([label, value]) => (
          <article className="stat-card" key={label}>
            <span className={`stat-icon ${label === "Remaining" ? "stat-icon-gold" : "stat-icon-charcoal"}`}>
              {label.slice(0, 1)}
            </span>
            <div>
              <p>{t(label)}</p>
              <strong>{new Intl.NumberFormat(language === "am" ? "am-ET" : "en").format(value)}</strong>
            </div>
          </article>
        ))}
      </div>
      <div
        className="meter"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={allocated}
        aria-valuenow={Math.min(used, allocated)}
        aria-label={t("Used this month")}
      >
        <span style={{ width: `${ratio * 100}%` }} />
      </div>
    </section>
  );
}
