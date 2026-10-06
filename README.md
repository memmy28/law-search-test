# Prototyp: zeitversionierte Rechts-Wissensdatenbank

Kleiner Machbarkeitstest für vier Kernideen:

1. Speichereinheit = einzelne Norm-Fassung mit Gültigkeitszeitraum (`daterange`), DB erzwingt per
   `EXCLUDE`-Constraint, dass sich zwei Fassungen derselben Norm nicht überlappen.
2. Hybride Suche: Volltext (Postgres `tsvector`, deutscher Analyzer) + Vektorsuche (pgvector),
   kombiniert per Reciprocal Rank Fusion, danach Reranking mit einem Cross-Encoder.
3. Stichtag-Filterung: die Suche liefert nur an einem gegebenen Datum gültige Fassungen.
4. Definitionsbibliothek: Rechtsbegriffe verknüpfen die sie definierende Norm mit den Normen, die
   sie verwenden. Erkennt die Suche einen solchen Begriff in der Anfrage, schränkt sie die
   Kandidaten hart auf die verknüpften Normen ein, statt nur per Reranking herunterzustufen.

**Hinweis zu den Daten:** `data/seed_norms.json` enthält 100 Normen aus 7 Gesetzen (DSGVO, BDSG,
TTDSG, BetrVG, UWG, KUG und das fiktive "Beispielgesetz"), um Suche, Reranking und die
Jev-Klassifikation an einem größeren, thematisch breiteren Datensatz zu testen. Die Texte sind aus
dem Gedächtnis rekonstruiert/paraphrasiert und nur für diesen Test gedacht — vor echtem Einsatz
gegen die Primärquelle (EUR-Lex, gesetze-im-internet.de) prüfen. Das "Beispielgesetz (fiktiv)" mit
drei Fassungen von § 5 ist komplett erfunden und dient nur dazu, die Zeitraum-Logik zu testen.

## Setup

```bash
docker compose up -d              # startet Postgres 16 + pgvector, legt Schema an
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python ingest.py                  # embeddet und lädt die 10 Beispiel-Normen (lädt ~500MB Modell beim ersten Mal)
```

## Web-Frontend (React + MUI)

Das Frontend ist eine React-Single-Page-App (Vite, ausschließlich MUI-Material-Komponenten) in
`frontend/`. Flask (`app.py`) ist ein reines JSON-Backend und liefert zusätzlich den gebauten
Frontend-Stand aus `frontend/dist` aus.

```bash
# einmalig
cd frontend && npm install && cd ..

# Variante A - Produktivbetrieb: Frontend bauen, Flask liefert alles auf einem Port aus
cd frontend && npm run build && cd ..
python app.py                    # http://127.0.0.1:5050

# Variante B - Entwicklung mit Hot Reload: Flask + Vite parallel
python app.py                    # Terminal 1, API auf :5050
cd frontend && npm run dev       # Terminal 2, UI auf http://127.0.0.1:5173 (proxyt /api -> :5050)
```

Nach Änderungen an `app.py` muss Flask neu gestartet werden (kein Auto-Reload); Änderungen im
Frontend greifen in Variante B sofort, in Variante A nach erneutem `npm run build`.

Oben rechts in der Navigation lässt sich der **Entwicklungsstand** umschalten (Cookie `app_state`):
*Plain* (nur hybride Suche) → *+ Definitionen* (Begriffsfilter) → *+ Jev* (Klassifikation). Der Stand
steuert, welche Navigationspunkte sichtbar sind, wie `/api/search` arbeitet und welche
Diagrammversion die Architektur-Seite zeigt.

Seiten:
- **Suche** (`/`) – Frage + Stichtag, Beispiel-Chips (zwei pro Testfall aus `TESTFRAGEN.md`),
  Pipeline-Zeile, Jev-Panel (Gesetze + einzelne Normen), Ergebnis-Karten, Jev-Laufzeit/Kosten-Karte
  und der Zeitstrahl aller Normen.
- **Datenbank** (`/datenbank`) – alle Normen gruppiert nach Gesetz, mit Gültigkeitszeitraum und Status.
- **Definitionen** (`/definitionen`, ab Stand *+ Definitionen*) – Begriffe der Definitionsbibliothek
  mit definierender Norm und verwendenden Normen.
- **Architektur** (`/architektur`) – die Such-Pipeline als PlantUML-Diagramm passend zum Stand.
  Quelle ist `diagrams/search-pipeline[-2|-3].puml`; `/api/diagram.svg` rendert live über den
  lokalen PlantUML-Docker-Container (gecacht anhand der Datei-Änderungszeit). Docker muss laufen.
- **Jev-Klassifikation** (`/jev`, nur Stand *+ Jev*) – Verlauf aller Klassifikationen inkl.
  aufklappbarer Normebene.
- **Norm-Detail** (`/norm/<id>`) – Volltext, alle Fassungen, Verweise auf Definitionen.

JSON-API: `GET/POST /api/state`, `GET /api/search`, `GET /api/norms`, `GET /api/norms/<id>`,
`GET /api/definitions`, `GET /api/jev/runs`, `GET /api/diagram.svg?v=1|2|3`.

## Suche testen (CLI)

```bash
# Semantische Suche ohne Fachbegriffe im Text -> findet trotzdem Art. 28 Abs. 3
python search.py "Wir lassen unsere Lohnabrechnung von einem externen Dienstleister machen. Brauchen wir einen Vertrag?"

# Reranker unterscheidet ähnliche, aber unterschiedliche Normen (Art. 26 vs. Art. 28)
python search.py "Was gilt, wenn zwei Unternehmen gemeinsam über Zwecke der Datenverarbeitung entscheiden?"

# Volltextsuche liefert hier tatsächlich Treffer (Fachbegriffe/Normverweis stehen wörtlich im Text)
python search.py "Sicherheit der Verarbeitung"
python search.py "Art. 28 Abs. 3 DSGVO"

# Stichtag-Filterung: dieselbe Frage, drei verschiedene Antworten je nach Datum
python search.py "Was steht in § 5 Beispielgesetz?" --as-of 2018-06-01   # -> Fassung 1 (Vergangenheit)
python search.py "Was steht in § 5 Beispielgesetz?" --as-of 2026-09-29  # -> Fassung 2 (aktuell)
python search.py "Was steht in § 5 Beispielgesetz?" --as-of 2028-01-01  # -> Fassung 3 (Zukunft)

# Begriffsfilter: "Auftragsverarbeiter" ist in der Definitionsbibliothek hinterlegt -> Kandidaten
# werden hart auf die 4 verknüpften Normen eingeschränkt, Art. 26 (der "false friend") fällt komplett weg
python search.py "Auftragsverarbeiter Vertrag"
```

## Was validiert wurde

- pgvector + Postgres-Volltextsuche + RRF + Cross-Encoder-Reranking lassen sich mit überschaubarem
  Aufwand lokal zusammenstecken (keine externen API-Keys nötig).
- Der Reranker sortiert einen semantisch nahen, aber juristisch falschen Treffer (Art. 26 statt Art. 28)
  zuverlässig nach hinten.
- `daterange` + `EXCLUDE USING gist` funktioniert wie geplant: überlappende Fassungen werden von der DB
  abgelehnt, Stichtag-Filterung liefert exakt die zu diesem Zeitpunkt gültige Fassung.
- Die Volltextsuche lief anfangs bei fast jeder Anfrage leer — Ursache war, dass `norm_ref`
  (z. B. "Art. 28 Abs. 3") gar nicht im `tsvector` enthalten war, sondern nur `heading_context` und
  `body`. Nach Aufnahme von `law_short`/`norm_ref` in den generierten `search_vector` (siehe
  `schema.sql`) finden sowohl reine Fachbegriffe ("Sicherheit der Verarbeitung") als auch exakte
  Normverweise ("Art. 28 Abs. 3 DSGVO") zuverlässig Treffer.
- Der Begriffsfilter über die Definitionsbibliothek (`definitions`/`definition_links`) löst das
  Art.-26-vs.-Art.-28-Problem robuster als der Reranker allein: statt den falschen Treffer nur
  herunterzustufen, verschwindet er komplett aus der Kandidatenmenge, sobald ein bekannter Begriff
  erkannt wird.

## Offene Fragen für die nächste Ausbaustufe

- Normverweise werden jetzt zwar volltextlich gefunden, aber `plainto_tsquery` verknüpft alle Wörter
  per UND — eine natürlichsprachliche Frage mit vielen Wörtern liefert daher trotzdem oft 0 Volltext-
  Treffer. Für echte Robustheit bräuchte es weiterhin eine separate Regex-Erkennung von Normverweisen
  plus ggf. `websearch_to_tsquery` oder OR-Verknüpfung einzelner Begriffe.
- Kein echter Import-Pipeline-Test gegen EUR-Lex/CELLAR oder rechtsinformationen.bund.de.
- Embedding-/Reranker-Modellwahl wurde nicht gegen ein Evaluationsset (Recall@10) verglichen.
- Graph-Schicht für Normverweise ("verweist auf", "setzt um", "ändert") ist weiterhin nicht enthalten
  — nur die Definitionsbibliothek als erste, engere Form einer Normen-Verknüpfung.
- Der Begriffsabgleich in `find_matching_definitions()` ist ein simpler case-insensitiver
  Teilstring-Match, keine echte linguistische Analyse (z. B. keine Erkennung von Synonymen oder
  Ambiguitäten wie einem Begriff mit zwei unterschiedlichen Definitionen in verschiedenen Gesetzen).
