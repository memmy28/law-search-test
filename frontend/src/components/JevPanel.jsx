import { Alert, Card, CardContent, Divider, Link, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { ProbabilityChip } from "./RelevanceChip";

function groupByLaw(norms) {
  const byLaw = new Map();
  norms.forEach((n) => {
    if (!byLaw.has(n.law_short)) byLaw.set(n.law_short, []);
    byLaw.get(n.law_short).push(n);
  });
  return [...byLaw.entries()];
}

export default function JevPanel({ laws, error, norms, normError }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Jev-Einschätzung: welche Gesetze sind einschlägig?
        </Typography>

        {error ? (
          <Alert severity="warning">Jev-Klassifikation nicht verfügbar: {error}</Alert>
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {laws.map((l) => (
              <ProbabilityChip key={l.law} label={l.law} probability={l.probability} relevant={l.relevant} />
            ))}
          </Stack>
        )}

        {!error && normError && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Normen-Klassifikation nicht verfügbar: {normError}
          </Alert>
        )}

        {!error && !normError && norms?.length > 0 && (
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {groupByLaw(norms).map(([lawShort, list]) => (
              <Stack key={lawShort} spacing={1}>
                <Divider />
                <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
                  {lawShort} – einzelne Normen:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  {list.map((n) => (
                    <ProbabilityChip
                      key={n.norm_id}
                      label={n.norm_ref}
                      probability={n.probability}
                      relevant={n.relevant}
                    />
                  ))}
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Verlauf aller Klassifikationen:{" "}
          <Link component={RouterLink} to="/jev">
            Jev-Klassifikation
          </Link>
        </Typography>
      </CardContent>
    </Card>
  );
}
