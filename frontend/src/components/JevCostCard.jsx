import { Card, CardContent, Typography } from "@mui/material";

export default function JevCostCard({ durationMs, questionCount, estimatedCostUsd, costPerQuestionUsd }) {
  const seconds = (durationMs / 1000).toFixed(2);
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Jev-Laufzeit &amp; Kosten
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Jev hat <strong>{questionCount}</strong> Noul-Frage{questionCount === 1 ? "" : "n"} in{" "}
          <strong>{seconds}s</strong> beantwortet · geschätzte Kosten:{" "}
          <strong>${estimatedCostUsd.toFixed(4)}</strong>
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
          Schätzung, keine echte Abrechnung – TypeSafe veröffentlicht keine Preisliste. Annahme: $
          {costPerQuestionUsd.toFixed(4)} pro Noul-Frage (in jev.py anpassbar).
        </Typography>
      </CardContent>
    </Card>
  );
}
