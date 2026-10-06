# Testfragen & erwartete Antworten

Checkliste zum manuellen Testen der Suche (`/`), der Jev-Klassifikation (grüner Panel auf der
Suchseite bzw. Verlauf unter `/jev`) und der Definitionsbibliothek (`/definitionen`), basierend auf
den 100 Normen aus 7 Gesetzen in `data/seed_norms.json`.

**Alle Jev-Werte unten sind tatsächlich gegen die laufende App gemessen** (nicht geschätzt), Stand
dieses Datensatzes. Schwelle "relevant" = Wahrscheinlichkeit ≥ 50 %.

> **Auffälligkeit beim Testen:** BDSG wird von Jev bei fast jeder Datenschutzfrage als "relevant"
> eingestuft (meist 0.5–0.9), auch wenn die Frage eigentlich auf die DSGVO zielt — nachvollziehbar,
> da das BDSG die DSGVO in Deutschland generell ergänzt. Wenn du einen Test willst, bei dem BDSG klar
> *nicht* relevant sein soll, nimm eine Frage aus einem komplett anderen Rechtsgebiet (Abschnitt 3).

## 1. Eindeutige Treffer pro Gesetz

| # | Frage | Jev-Ergebnis (gemessen) | Ziel-Norm (Suche) |
|---|-------|---------------------------|---------------------|
| 1 | Was ist ein Auftragsverarbeiter? | ✅ DSGVO 0.97 · ✅ BDSG 0.69 · ❌ KUG 0.17 · ❌ TTDSG 0.16 · ❌ Beispielgesetz 0.05 · ❌ UWG 0.05 · ❌ BetrVG 0.03 | 🎯 DSGVO Art. 4 Nr. 8 |
| 2 | Dürfen wir die Daten unserer Beschäftigten für die Gehaltsabrechnung verarbeiten? | ✅ DSGVO 0.92 · ✅ BDSG 0.89 · ❌ KUG 0.24 · ❌ BetrVG 0.23 · ❌ TTDSG 0.07 | 🎯 BDSG § 26 Abs. 1 / DSGVO Art. 88 Abs. 1 |
| 3 | Muss unser Shop eine Cookie-Einwilligung einholen? | ✅ TTDSG 0.90 · ✅ DSGVO 0.73 · ❌ BDSG 0.39 · ❌ KUG 0.21 | 🎯 TTDSG § 25 Abs. 1 |
| 4 | Darf der Betriebsrat mitbestimmen, wenn wir eine Software zur Mitarbeiterüberwachung einführen? | ✅ BetrVG 0.95 · ✅ BDSG 0.64 · ❌ DSGVO 0.36 · ❌ KUG 0.32 · ❌ TTDSG 0.24 | 🎯 BetrVG § 87 Abs. 1 Nr. 6 |
| 5 | Dürfen wir Bestandskunden ohne erneute Einwilligung Werbe-E-Mails für ähnliche Produkte schicken? | ✅ DSGVO 0.85 · ✅ UWG 0.53 · ❌ BDSG 0.42 · ❌ KUG 0.39 · ❌ TTDSG 0.34 | 🎯 UWG § 7 Abs. 3 |
| 6 | Dürfen wir ein Mitarbeiterfoto ohne Zustimmung auf unserer Website veröffentlichen? | ✅ DSGVO 0.92 · ✅ KUG 0.85 · ✅ BDSG 0.82 · ❌ BetrVG 0.31 · ❌ TTDSG 0.21 · ❌ UWG 0.11 | 🎯 KUG § 22 Satz 1 |
| 7 | Was steht in § 5 Beispielgesetz? | ✅ Beispielgesetz (fiktiv), alle anderen niedrig | 🎯 Beispielgesetz § 5 (siehe Zeitfilter-Tests unten) |

## 2. Mehrere einschlägige Gesetze (Reranker- & Jev-Test)

| # | Frage | Jev-Ergebnis (gemessen) | Notiz |
|---|-------|---------------------------|-------|
| 8 | Was gilt, wenn zwei Unternehmen gemeinsam über Zwecke der Datenverarbeitung entscheiden? | ✅ DSGVO 0.96 · ✅ BDSG 0.59 · ❌ KUG 0.21 · ❌ TTDSG 0.13 | Art. 26 vs. Art. 28 DSGVO – klassischer Reranker-Test. Triggert **keinen** Begriffsfilter (s. Abschnitt 5, Zeile 21) |
| 9 | Welche Pflichten haben wir, wenn personenbezogene Daten gestohlen oder verloren gehen? | ✅ DSGVO 0.94 · ✅ BDSG 0.88 · ❌ TTDSG 0.27 · ❌ KUG 0.08 | → Art. 33 Abs. 1 DSGVO |
| 10 | Dürfen wir unsere Kunden anrufen, um ihnen ein neues Produkt vorzustellen? | ✅ UWG 0.84 · ✅ DSGVO 0.81 · ✅ KUG 0.65 · ✅ BDSG 0.57 · ✅ TTDSG 0.50 · ❌ BetrVG 0.05 | Fast alles außer BetrVG/Beispielgesetz schlägt an – gutes Beispiel für einen uneindeutigen Fall (s. Abschnitt 6) |
| 11 | Wir lassen unsere Lohnabrechnung von einem externen Dienstleister machen. Brauchen wir einen Vertrag? | ✅ DSGVO 0.83 · ✅ BDSG 0.78 · ❌ TTDSG 0.16 · ❌ BetrVG 0.14 · ❌ KUG 0.14 | Semantische Suche ohne Fachbegriff im Text → Art. 28 Abs. 3 DSGVO |
| 12 | Wie lange dürfen wir Bewerbungsunterlagen abgelehnter Kandidaten aufbewahren? | ✅ DSGVO 0.90 · ✅ BDSG 0.85 · ❌ TTDSG 0.27 · ❌ KUG 0.22 | Speicherbegrenzung (Art. 5 Abs. 1 lit. e) + Beschäftigtenbegriff (§ 26 Abs. 8 BDSG) |

## 3. Klare Negativ-Kontrollen (andere Rechtsgebiete sollten "nicht relevant" sein)

| # | Frage | Jev-Ergebnis (gemessen) |
|---|-------|---------------------------|
| 13 | Dürfen wir Mitarbeiterfotos ohne Einwilligung auf der Firmenwebsite veröffentlichen? | ✅ DSGVO 0.95 · ✅ KUG 0.87 · ✅ BDSG 0.86 · ❌ BetrVG 0.38 · ❌ TTDSG 0.23 · ❌ UWG 0.10 |
| 14 | Braucht unser Betriebsrat Zugriff auf die Zeiterfassungsdaten? | ✅ BetrVG 0.84 · ✅ BDSG 0.50 · ❌ DSGVO 0.46 · ❌ KUG 0.24 · ❌ TTDSG 0.14 · ❌ UWG 0.04 |

## 4. Zeitfilter-Tests (Stichtag ändert die Antwort, nicht die Jev-Einschätzung)

Alle drei nutzen dieselbe Frage mit unterschiedlichem Stichtag — gut geeignet, um zu zeigen, dass
**Jev dieselbe Klassifikation liefert** (Jev bekommt nie das Datum, nur den Fragetext), während sich
die **Such-Treffer** je Stichtag unterscheiden.

| # | Frage | Stichtag | Erwartete Fassung | Status-Badge |
|---|-------|----------|--------------------|----------------|
| 15 | Was steht in § 5 Beispielgesetz? | 2018-06-01 | Fassung 1 (30-Tage-Meldepflicht) | vergangen |
| 16 | Was steht in § 5 Beispielgesetz? | heute | Fassung 2 (14-Tage-Meldepflicht) | aktuell |
| 17 | Was steht in § 5 Beispielgesetz? | 2028-01-01 | Fassung 3 (72-Stunden-Meldepflicht) | künftig |

## 5. Definitionsfilter-Tests (`/definitionen`)

Bei erkanntem Begriff schränkt die Suche die Kandidaten hart auf die verknüpften Normen ein
(`find_matching_definitions` in `search.py`). Der Abgleich ist ein einfacher case-insensitiver
**Teilstring**-Match auf den exakten Begriff — die Frage muss den Begriff wörtlich enthalten, sonst
greift nur die normale Suche (siehe Zeile 21).

| # | Frage | Erkannter Begriff? | `allowed_norm_count` (gemessen) |
|---|-------|----------------------|-----------------------------------|
| 18 | Was ist ein Auftragsverarbeiter? | ja: "Auftragsverarbeiter" | 4 |
| 19 | Was bedeutet Einwilligung? | ja: "Einwilligung" | 11 (1 Definitionsnorm + 10 verknüpfte Normen über 5 Gesetze) |
| 20 | Was ist eine Verletzung des Schutzes personenbezogener Daten? | ja: "Verletzung des Schutzes personenbezogener Daten" | 2 |
| 21 | Wer gilt als gemeinsam Verantwortliche nach der DSGVO? | ja: "gemeinsam Verantwortliche" | 1 |
| 22 | Was gilt, wenn zwei Unternehmen gemeinsam über Zwecke der Datenverarbeitung entscheiden? | **nein** – Begriff kommt nicht als zusammenhängender Teilstring vor | `None` (keine Einschränkung, reiner Reranker-Test, s. Zeile 8) |

## 6. Ambige Fälle (Jev liegt bewusst nicht bei 0 oder 1)

| # | Frage | Jev-Ergebnis (gemessen) |
|---|-------|---------------------------|
| 23 | Wir wollen ein Belohnungsprogramm einführen, bei dem Kunden per E-Mail informiert werden. | DSGVO 0.89 · BDSG 0.75 · UWG 0.67 · TTDSG 0.66 (alle ✅) · KUG 0.34 · BetrVG 0.05 |
| 24 | Wir planen eine Videoüberwachung im Lager. | DSGVO 0.80 · BDSG 0.76 · BetrVG 0.68 (alle ✅) · KUG 0.43 · TTDSG 0.24 · UWG 0.08 |
| 25 | Ein Kunde möchte wissen, welche Daten wir über ihn gespeichert haben. | DSGVO 0.96 · BDSG 0.81 (✅) · TTDSG 0.28 · KUG 0.15 · BetrVG 0.04 |

---

**Hinweis:** Die Jev-Werte wurden einmalig gegen die laufende App gemessen (Modell `jev-latest`) und
sind **keine deterministische Garantie** — bei erneutem Aufruf können sich die Wahrscheinlichkeiten
leicht verschieben, besonders in Abschnitt 6. Bei den klaren Fällen in Abschnitt 1–3 sollte die
Einschätzung aber stabil in die hier gezeigte Richtung ausfallen. Jeder Lauf wird zusätzlich unter
`/jev` protokolliert, falls du Abweichungen über Zeit beobachten willst.
