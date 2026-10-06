import { Chip, Stack, Typography } from "@mui/material";

/** @typedef {{label: string, target?: string, query: string, asOf?: string}} ExampleItem */

// Zwei Beispiele pro Testfall aus TESTFRAGEN.md.
/** @type {{label: string, items: ExampleItem[]}[]} */
const GROUPS = [
  {
    label: "1. Eindeutige Treffer",
    items: [
      {
        label: "Auftragsverarbeiter",
        target: "DSGVO Art. 4 Nr. 8",
        query: "Was ist ein Auftragsverarbeiter?",
      },
      {
        label: "Daten Gehaltsabrechnung",
        target: "BDSG § 26 Abs. 1",
        query:
          "Dürfen wir die Daten unserer Beschäftigten für die Gehaltsabrechnung verarbeiten?",
      },
      {
        label: "Werbe-Mails",
        target: "UWG § 7 Abs. 3",
        query:
          "Dürfen wir Bestandskunden ohne erneute Einwilligung Werbe-E-Mails für ähnliche Produkte schicken?",
      },
      {
        label: "Mitarbeiterfoto",
        target: "KUG § 22 Satz 1",
        query:
          "Dürfen wir ein Mitarbeiterfoto ohne Zustimmung auf unserer Website veröffentlichen?",
      },
      {
        label: "Beispielgesetz",
        target: "Beispielgesetz § 5",
        query: "Was steht in § 5 Beispielgesetz?",
      },
      {
        label: "Cookie-Einwilligung",
        target: "TTDSG § 25 Abs. 1",
        query: "Muss unser Shop eine Cookie-Einwilligung einholen?",
      },
      {
        label: "Mitarbeiterüberwachung",
        target: "BetrVG § 87 Abs. 1 Nr. 6",
        query:
          "Darf der Betriebsrat mitbestimmen, wenn wir eine Software zur Mitarbeiterüberwachung einführen?",
      },
    ],
  },
  {
    label: "2. Mehrere Gesetze",
    items: [
      {
        label: "Datenschutzverletzung",
        target: "DSGVO § 33 Abs. 1",
        query:
          "Welche Pflichten haben wir, wenn personenbezogene Daten gestohlen oder verloren gehen?",
      },
      {
        label: "Datenschutz (mehrere Unternehmen)",
        target: "DSGVO § 26 / DSGVO § 28",
        query:
          "Was gilt, wenn zwei Unternehmen gemeinsam über Zwecke der Datenverarbeitung entscheiden?",
      },
      {
        label: "Kunden anrufen",
        target: "Uneindeutig",
        query:
          "Dürfen wir unsere Kunden anrufen, um ihnen ein neues Produkt vorzustellen?",
      },
      {
        label: "Externe Lohnabrechnung",
        target: "DSGVO § 28 Abs. 3",
        query:
          "Wir lassen unsere Lohnabrechnung von einem externen Dienstleister machen. Brauchen wir einen Vertrag?",
      },
      {
        label: "Datenspeicherung",
        target: "DSGVO § 5 Abs. 1 lit. e",
        query:
          "Wie lange dürfen wir Bewerbungsunterlagen abgelehnter Kandidaten aufbewahren?",
      },
    ],
  },
  {
    label: "3. Negativ-Kontrollen",
    items: [
      {
        label: "Mitarbeiterfoto",
        target: "nur KUG/DSGVO/BDSG",
        query:
          "Dürfen wir Mitarbeiterfotos ohne Einwilligung auf der Firmenwebsite veröffentlichen?",
      },
      {
        label: "Zeiterfassung",
        target: "nur BetrVG/BDSG",
        query: "Braucht unser Betriebsrat Zugriff auf die Zeiterfassungsdaten?",
      },
    ],
  },
  {
    label: "4. Zeitfilter",
    items: [
      {
        label: "Vergangenheit",
        target: "§ 5 Beispielgesetz",
        query: "Was steht in § 5 Beispielgesetz?",
        asOf: "2018-06-01",
      },
      {
        label: "Zukunft",
        target: "§ 5 Beispielgesetz",
        query: "Was steht in § 5 Beispielgesetz?",
        asOf: "2028-01-01",
      },
    ],
  },
  {
    label: "5. Definitionsfilter",
    items: [
      {
        label: "Auftragsverarbeiter",
        target: "4 Normen",
        query: "Was ist ein Auftragsverarbeiter?",
      },
      {
        label: "Einwilligung",
        target: "11 Normen, 5 Gesetze",
        query: "Was bedeutet Einwilligung?",
      },
      {
        label: "Verletzung des Schutzes personenbezogener Daten",
        target: "2 Normen",
        query: "Was ist eine Verletzung des Schutzes personenbezogener Daten?",
      },
      {
        label: " Gemeinsame Verantwortliche",
        target: "1 Norm",
        query: "Wer gilt als gemeinsam Verantwortliche nach der DSGVO?",
      },
      {
        label: "Datenschutz (mehrere Unternehmen)",
        target: "Keine Definition erkannt",
        query:
          "Was gilt, wenn zwei Unternehmen gemeinsam über Zwecke der Datenverarbeitung entscheiden?",
      },
    ],
  },
  {
    label: "6. Ambige Fälle",
    items: [
      {
        label: "Videoüberwachung im Lager",
        target: "Uneindeutig",
        query: "Wir planen eine Videoüberwachung im Lager.",
      },
      {
        label: "Werbeanruf bei Kunden",
        target: "Uneindeutig",
        query:
          "Dürfen wir unsere Kunden anrufen, um ihnen ein neues Produkt vorzustellen?",
      },
      {
        label: "Belohnungsprogramm",
        target: "Uneindeutig",
        query:
          " Wir wollen ein Belohnungsprogramm einführen, bei dem Kunden per E-Mail informiert werden.",
      },
    ],
  },
];

/**
 * @param {Object} props
 * @param {(query: string, asOf?: string) => void} props.onPick
 * @param {boolean} [props.disabled]
 */
export default function ExampleChips({ onPick, disabled }) {
  return (
    <Stack spacing={1} sx={{ mt: 2 }}>
      {GROUPS.map((group) => (
        <Stack key={group.label} spacing={0.5}>
          <Typography variant="caption" color="text.secondary">
            {group.label}:
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {group.items.map((item) => (
              <Chip
                key={item.label}
                size="small"
                clickable
                disabled={disabled}
                onClick={() => onPick(item.query, item.asOf)}
                label={
                  item.target ? (
                    <Stack alignItems="center" sx={{ py: 0.5 }}>
                      <Typography
                        component="span"
                        sx={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}
                      >
                        {item.label}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: 10.5,
                          color: "text.secondary",
                          lineHeight: 1.3,
                        }}
                      >
                        {item.target}
                      </Typography>
                    </Stack>
                  ) : (
                    item.label
                  )
                }
                sx={{
                  bgcolor: "#eef0f4",
                  height: item.target ? "auto" : undefined,
                  "& .MuiChip-label": { whiteSpace: "normal" },
                }}
              />
            ))}
          </Stack>
        </Stack>
      ))}
    </Stack>
  );
}
