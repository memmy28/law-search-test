import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { getJSON, postJSON } from "../api";

// Die drei Entwicklungsstände (plain -> definition -> classification) werden
// serverseitig per Cookie gehalten; der Client spiegelt sie nur, damit Navigation
// und /api/search konsistent denselben Stand sehen.
/** @type {Record<string, string>} */
export const STATE_LABELS = {
  plain: "Plain",
  definition: "+ Definitionen",
  classification: "+ Jev",
};

/** @type {Record<string, string>} */
export const STATE_DESCRIPTIONS = {
  plain: "Nur hybride Suche, ohne Definitionsbibliothek und ohne Jev",
  definition: "+ Definitionsbibliothek (Begriffsfilter)",
  classification: "+ Jev-Klassifikation pro Gesetz und Norm",
};

/**
 * @typedef {Object} StateApiResponse
 * @property {string} state
 * @property {string[]} states
 * @property {string} diagram_version
 */

/** @type {StateApiResponse} */
const FALLBACK = {
  state: "classification",
  states: Object.keys(STATE_LABELS),
  diagram_version: "3",
};

/**
 * @typedef {Object} AppStateValue
 * @property {boolean} ready
 * @property {string|null} state
 * @property {string[]} states
 * @property {string} diagramVersion
 * @property {boolean} hasDefinitions
 * @property {boolean} hasClassification
 * @property {(state: string) => Promise<void>} setState
 */

const AppStateContext = createContext(/** @type {AppStateValue|null} */ (null));

/** @param {{children: import("react").ReactNode}} props */
export function AppStateProvider({ children }) {
  const [info, setInfo] = useState(/** @type {StateApiResponse|null} */ (null));

  useEffect(() => {
    getJSON("/api/state")
      .then(setInfo)
      .catch(() => setInfo(FALLBACK));
  }, []);

  const setState = useCallback(
    /** @param {string} state */
    async (state) => {
      const next = await postJSON("/api/state", { state });
      setInfo(next);
    },
    [],
  );

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

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (value === null) {
    throw new Error(
      "useAppState() muss innerhalb von <AppStateProvider> aufgerufen werden.",
    );
  }
  return value;
}
