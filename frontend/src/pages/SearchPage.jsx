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

import { getJSON, todayISO } from "../api";
import { useAppState } from "../state/AppStateContext";
import PageHeader from "../components/PageHeader";
import ExampleChips from "../components/ExampleChips";
import JevPanel from "../components/JevPanel";
import JevCostCard from "../components/JevCostCard";
import ResultCard from "../components/ResultCard";
import Loading from "../components/Loading";

/** @param {any} data */
function pipelineSummary(data) {
  let text =
    `Stichtag ${data.as_of} · ${data.vector_candidates} Kandidaten (Vektor) / ` +
    `${data.text_candidates} (Volltext) → ${data.fused_candidates} nach RRF-Fusion → ` +
    `${data.results.length} nach Reranking`;
  if (data.matched_definitions?.length) {
    const terms = data.matched_definitions.map((/** @type {any} */ d) => d.term).join(", ");
    text = `Begriff erkannt: "${terms}" → Suche auf ${data.allowed_norm_count} verknüpfte Norm(en) eingeschränkt · ${text}`;
  }
  return text;
}

export default function SearchPage() {
  const { hasClassification } = useAppState();
  const [query, setQuery] = useState("");
  const [asOf, setAsOf] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(/** @type {any} */ (null));
  const [error, setError] = useState(/** @type {string|null} */ (null));

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
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  /**
   * @param {string} exampleQuery
   * @param {string} [exampleAsOf]
   */
  function pickExample(exampleQuery, exampleAsOf) {
    const date = exampleAsOf || todayISO();
    setQuery(exampleQuery);
    setAsOf(date);
    runSearch(exampleQuery, date);
  }

  const showJev =
    hasClassification && data && (data.law_classification || data.jev_error);

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
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || !query.trim()}
                  >
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
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textAlign: "center", py: 2 }}
              >
                Keine an diesem Stichtag gültigen Treffer.
              </Typography>
            ) : (
              <Stack spacing={1.5}>
                {data.results.map((/** @type {any} */ r, /** @type {number} */ i) => (
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
      </Stack>
    </Container>
  );
}
