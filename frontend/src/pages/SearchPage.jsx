import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { getJSON, todayISO, useApi } from "../api";
import { useAppState } from "../state/AppStateContext";
import { STATUS_COLORS, STATUS_LABEL_LONG } from "../theme";
import PageHeader from "../components/PageHeader";
import ExampleChips from "../components/ExampleChips";
import JevPanel from "../components/JevPanel";
import JevCostCard from "../components/JevCostCard";
import ResultCard from "../components/ResultCard";
import NormTimeline from "../components/NormTimeline";
import Loading from "../components/Loading";

function pipelineSummary(data) {
  let text =
    `Stichtag ${data.as_of} · ${data.vector_candidates} Kandidaten (Vektor) / ` +
    `${data.text_candidates} (Volltext) → ${data.fused_candidates} nach RRF-Fusion → ` +
    `${data.results.length} nach Reranking`;
  if (data.matched_definitions?.length) {
    const terms = data.matched_definitions.map((d) => d.term).join(", ");
    text = `Begriff erkannt: "${terms}" → Suche auf ${data.allowed_norm_count} verknüpfte Norm(en) eingeschränkt · ${text}`;
  }
  return text;
}

export default function SearchPage() {
  const { hasClassification } = useAppState();
  const [query, setQuery] = useState("");
  const [asOf, setAsOf] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const norms = useApi("/api/norms");

  async function runSearch(q = query, date = asOf) {
    const trimmed = q.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const params = new URLSearchParams({ query: trimmed, as_of: date });
      setData(await getJSON(`/api/search?${params}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function pickExample(exampleQuery, exampleAsOf) {
    const date = exampleAsOf || todayISO();
    setQuery(exampleQuery);
    setAsOf(date);
    runSearch(exampleQuery, date);
  }

  const showJev = hasClassification && data && (data.law_classification || data.jev_error);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        title="Rechts-Wissensdatenbank"
        tag="Prototyp"
        subtitle="Hybride Suche (Volltext + Vektor + Reranking) über zeitlich versionierte Normen"
      />

      <Stack spacing={2}>
        <Card>
          <CardContent>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                runSearch();
              }}
            >
              <Stack spacing={2}>
                <TextField
                  label="Fall / Frage"
                  multiline
                  minRows={2}
                  fullWidth
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="z.B. Wir lassen unsere Lohnabrechnung von einem externen Dienstleister machen. Brauchen wir einen Vertrag?"
                />
                <Stack direction="row" spacing={2} alignItems="flex-end">
                  <TextField
                    label="Stichtag"
                    type="date"
                    value={asOf}
                    onChange={(e) => setAsOf(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <Button type="submit" variant="contained" disabled={loading || !query.trim()}>
                    Suchen
                  </Button>
                </Stack>
              </Stack>
            </Box>
            <ExampleChips onPick={pickExample} disabled={loading} />
          </CardContent>
        </Card>

        {loading && <Loading />}
        {error && <Alert severity="error">{error}</Alert>}

        {data && (
          <>
            <Alert severity="info" icon={false} variant="outlined">
              {pipelineSummary(data)}
            </Alert>

            {showJev && (
              <JevPanel
                laws={data.law_classification ?? []}
                error={data.jev_error}
                norms={data.norm_classification}
                normError={data.norm_jev_error}
              />
            )}

            {data.results.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
                Keine an diesem Stichtag gültigen Treffer.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {data.results.map((r, i) => (
                  <ResultCard key={r.id} rank={i + 1} result={r} />
                ))}
              </Stack>
            )}

            {hasClassification && data.jev_duration_ms != null && (
              <JevCostCard
                durationMs={data.jev_duration_ms}
                questionCount={data.jev_question_count}
                estimatedCostUsd={data.jev_estimated_cost_usd}
                costPerQuestionUsd={data.jev_cost_per_question_usd}
              />
            )}
          </>
        )}

        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6">Zeitliche Übersicht aller Normen</Typography>
            <Typography variant="body2" color="text.secondary">
              Jede Zeile ist eine Norm, jeder Balken eine Fassung. Die gestrichelte Linie markiert heute.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1.5 }} flexWrap="wrap" useFlexGap>
              {Object.entries(STATUS_LABEL_LONG).map(([status, label]) => (
                <Stack key={status} direction="row" spacing={0.75} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: 0.5, bgcolor: STATUS_COLORS[status].bar }} />
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            {norms.loading && <Loading />}
            {norms.error && <Alert severity="error">Zeitstrahl konnte nicht geladen werden.</Alert>}
            {norms.data && <NormTimeline norms={norms.data.norms} today={norms.data.today} />}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
