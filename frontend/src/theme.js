import { createTheme } from "@mui/material/styles";

// Status-Farben für Gültigkeit (Badges + Zeitstrahl-Balken), identisch zur
// bisherigen Oberfläche, damit Balken und Badges dieselbe Bedeutung tragen.
// Record<string, ...>, weil sie an mehreren Stellen mit einem nicht-literalen
// `status: string` (aus der API) indiziert werden.
/** @type {Record<string, {bar: string, bg: string, text: string}>} */
export const STATUS_COLORS = {
  vergangen: { bar: "#9ca3af", bg: "#f3f4f6", text: "#6b7280" },
  aktuell: { bar: "#16a34a", bg: "#dcfce7", text: "#15803d" },
  zukuenftig: { bar: "#2563eb", bg: "#dbeafe", text: "#1d4ed8" },
};

/** @type {Record<string, string>} */
export const STATUS_LABEL_SHORT = {
  vergangen: "vergangen",
  aktuell: "aktuell",
  zukuenftig: "künftig",
};

/** @type {Record<string, string>} */
export const STATUS_LABEL_LONG = {
  vergangen: "vergangen",
  aktuell: "aktuell gültig",
  zukuenftig: "tritt erst künftig in Kraft",
};

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2454ff" },
    background: { default: "#f5f6f8", paper: "#ffffff" },
    text: { primary: "#1a1d23", secondary: "#6b7280" },
    divider: "#e2e4e9",
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    h5: { fontWeight: 700, fontSize: 22 },
    h6: { fontWeight: 700, fontSize: 17 },
    subtitle1: { fontWeight: 700 },
  },
  components: {
    MuiCard: { defaultProps: { variant: "outlined" } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { textTransform: "none", fontWeight: 600 } },
    },
    MuiToggleButton: { styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiTableCell: { styleOverrides: { head: { color: "#6b7280", fontWeight: 600 } } },
  },
});

export default theme;
