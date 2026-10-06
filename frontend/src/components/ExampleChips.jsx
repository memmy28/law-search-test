import { Chip, Stack, Typography } from "@mui/material";

// Zwei Beispiele pro Testfall aus TESTFRAGEN.md.
const GROUPS = [
  {
    label: "1. Eindeutige Treffer",
    items: [
      { label: "Cookie-Einwilligung → TTDSG", query: "Muss unser Shop eine Cookie-Einwilligung einholen?" },
      {
        label: "Mitarbeiterüberwachung → BetrVG",
        query: "Darf der Betriebsrat mitbestimmen, wenn wir eine Software zur Mitarbeiterüberwachung einführen?",
      },
    ],
  },
  {
    label: "2. Mehrere Gesetze",
    items: [
      {
        label: "Art. 26 vs. Art. 28 (Reranker-Test)",
        query: "Was gilt, wenn zwei Unternehmen gemeinsam über Zwecke der Datenverarbeitung entscheiden?",
      },
      {
        label: "Datenschutzverletzung → DSGVO + BDSG",
        query: "Welche Pflichten haben wir, wenn personenbezogene Daten gestohlen oder verloren gehen?",
      },
    ],
  },
  {
    label: "3. Negativ-Kontrollen",
    items: [
      {
        label: "Mitarbeiterfoto → nur KUG/DSGVO/BDSG",
        query: "Dürfen wir Mitarbeiterfotos ohne Einwilligung auf der Firmenwebsite veröffentlichen?",
      },
      { label: "Zeiterfassung → nur BetrVG/BDSG", query: "Braucht unser Betriebsrat Zugriff auf die Zeiterfassungsdaten?" },
    ],
  },
  {
    label: "4. Zeitfilter",
    items: [
      { label: "§5 – Vergangenheit", query: "Was steht in § 5 Beispielgesetz?", asOf: "2018-06-01" },
      { label: "§5 – Zukunft", query: "Was steht in § 5 Beispielgesetz?", asOf: "2028-01-01" },
    ],
  },
  {
    label: "5. Definitionsfilter",
    items: [
      { label: "Auftragsverarbeiter (4 Normen)", query: "Was ist ein Auftragsverarbeiter?" },
      { label: "Einwilligung (11 Normen, 5 Gesetze)", query: "Was bedeutet Einwilligung?" },
    ],
  },
  {
    label: "6. Ambige Fälle",
    items: [
      { label: "Videoüberwachung im Lager", query: "Wir planen eine Videoüberwachung im Lager." },
      {
        label: "Werbeanruf bei Kunden",
        query: "Dürfen wir unsere Kunden anrufen, um ihnen ein neues Produkt vorzustellen?",
      },
    ],
  },
];

export default function ExampleChips({ onPick, disabled }) {
  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      <Typography variant="caption" color="text.secondary">
        Beispiele aus <Typography component="code" variant="caption" sx={{ bgcolor: "#eef0f4", px: 0.6, borderRadius: 0.5 }}>TESTFRAGEN.md</Typography>, zwei pro Testfall:
      </Typography>
      {GROUPS.map((group) => (
        <Stack key={group.label} direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 150 }}>
            {group.label}:
          </Typography>
          {group.items.map((item) => (
            <Chip
              key={item.label}
              label={item.label}
              size="small"
              clickable
              disabled={disabled}
              onClick={() => onPick(item.query, item.asOf)}
              sx={{ bgcolor: "#eef0f4" }}
            />
          ))}
        </Stack>
      ))}
    </Stack>
  );
}
