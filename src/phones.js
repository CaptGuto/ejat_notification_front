const LOCAL_MOBILE = /^9\d{8}$/;

export const MESSAGE_MAX = 335;
export const PHONE_MAX = 500;

export function messageLength(value) {
  return [...String(value).trim()].length;
}

/** Same rules as the API: 2519XXXXXXXX, 09XXXXXXXX, or 9XXXXXXXX. */
export function normalizeEthiopianPhone(input) {
  const digits = String(input).replace(/\D/g, "");
  let local = null;

  if (
    digits.length === 12 &&
    digits.startsWith("251") &&
    LOCAL_MOBILE.test(digits.slice(3))
  ) {
    local = digits.slice(3);
  } else if (
    digits.length === 10 &&
    digits.startsWith("0") &&
    LOCAL_MOBILE.test(digits.slice(1))
  ) {
    local = digits.slice(1);
  } else if (digits.length === 9 && LOCAL_MOBILE.test(digits)) {
    local = digits;
  }

  return local ? `251${local}` : null;
}

export function splitPhones(text) {
  return String(text)
    .split(/[\n,]+/)
    .map((part) => part.replace(/\r/g, "").trim())
    .filter(Boolean);
}

export function analyzePhones(text) {
  const raw = splitPhones(text);
  const seen = new Set();
  let duplicatesRemoved = 0;
  const items = raw.map((original) => {
    const normalized = normalizeEthiopianPhone(original);
    let duplicate = false;
    if (normalized) {
      if (seen.has(normalized)) {
        duplicate = true;
        duplicatesRemoved += 1;
      } else {
        seen.add(normalized);
      }
    }
    return { original, normalized, duplicate, invalid: normalized == null };
  });

  return { items, phones: [...seen], duplicatesRemoved };
}

export function phoneMatchesInvalid(item, invalidPhones) {
  if (item.invalid) return true;
  return invalidPhones.some((raw) => {
    if (raw === item.original) return true;
    const normalized = normalizeEthiopianPhone(raw);
    return Boolean(normalized && item.normalized && normalized === item.normalized);
  });
}
