import { useEffect, useState } from "react";

async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export function getJSON(url) {
  return fetch(url).then(parse);
}

export function postJSON(url, body) {
  return fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then(parse);
}

export function useApi(url) {
  const [result, setResult] = useState({ data: null, error: null, loading: true });

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
