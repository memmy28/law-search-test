import { useEffect, useState } from "react";

/** @param {Response} res */
async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

/** @param {string} url */
export function getJSON(url) {
  return fetch(url).then(parse);
}

/**
 * @param {string} url
 * @param {unknown} body
 */
export function postJSON(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(parse);
}

/**
 * Lädt JSON von `url` und lädt neu, wenn sich `url` ändert. `data` ist bewusst
 * `any` typisiert - der Hook wird gegen viele verschieden geformte Endpunkte
 * verwendet, Callers greifen auf die ihnen bekannten Felder zu.
 * @param {string} url
 * @returns {{data: any, error: Error|null, loading: boolean}}
 */
export function useApi(url) {
  const [result, setResult] = useState({
    data: /** @type {any} */ (null),
    error: /** @type {Error|null} */ (null),
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setResult({ data: null, error: null, loading: true });
    getJSON(url)
      .then((data) => !cancelled && setResult({ data, error: null, loading: false }))
      .catch((error) => !cancelled && setResult({ data: null, error, loading: false }));
    return () => {
      cancelled = true;
    };
  }, [url]);

  return result;
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
