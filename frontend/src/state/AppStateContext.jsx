import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getJSON, postJSON } from "../api";

// Die drei Entwicklungsstände (plain -> definition -> classification) werden
// serverseitig per Cookie gehalten; der Client spiegelt sie nur, damit Navigation
// und /api/search konsistent denselben Stand sehen.
export const STATE_LABELS = {
  plain: "Plain",
  definition: "+ Definitionen",
  classification: "+ Jev",
};

export const STATE_DESCRIPTIONS = {
  plain: "Nur hybride Suche, ohne Definitionsbibliothek und ohne Jev",
  definition: "+ Definitionsbibliothek (Begriffsfilter)",
  classification: "+ Jev-Klassifikation pro Gesetz und Norm",
};

const FALLBACK = { state: "classification", states: Object.keys(STATE_LABELS), diagram_version: "3" };

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    getJSON("/api/state")
      .then(setInfo)
      .catch(() => setInfo(FALLBACK));
  }, []);

  const setState = useCallback(async (state) => {
    const next = await postJSON("/api/state", { state });
    setInfo(next);
  }, []);

  const state = info?.state ?? null;
  const value = {
    ready: info !== null,
    state,
    states: info?.states ?? FALLBACK.states,
    diagramVersion: info?.diagram_version ?? FALLBACK.diagram_version,
    hasDefinitions: state === "definition" || state === "classification",
    hasClassification: state === "classification",
    setState,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  return useContext(AppStateContext);
}
