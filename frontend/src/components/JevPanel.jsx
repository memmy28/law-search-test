import {
  Alert,
  Card,
  CardContent,
  Divider,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { ProbabilityChip } from "./RelevanceChip";

/** @param {any[]} norms */
function groupByLaw(norms) {
  /** @type {Map<string, any[]>} */
  const byLaw = new Map();
  norms.forEach((n) => {
    const list = byLaw.get(n.law_short) ?? [];
    list.push(n);
    byLaw.set(n.law_short, list);
  });
  return [...byLaw.entries()];
}

/**
 * @param {Object} props
 * @param {any[]} props.laws
 * @param {string|null} [props.error]
 * @param {any[]} [props.norms]
 * @param {string|null} [props.normError]
 */
export default function JevPanel({ laws, error, norms, normError }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Jev-Einschätzung: welche Gesetze sind einschlägig?
        </Typography>

        {error ? (
          <Alert severity="warning">
            Jev-Klassifikation nicht verfügbar: {error}
          </Alert>
        ) : (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {laws.map((l) => (
              <ProbabilityChip
                key={l.law}
                label={l.law}
                probability={l.probability}
                relevant={l.relevant}
              />
            ))}
          </Stack>
        )}

        {!error && normError && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Normen-Klassifikation nicht verfügbar: {normError}
          </Alert>
        )}

        {!error && !normError && norms && norms.length > 0 && (
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {groupByLaw(norms).map(([lawShort, list]) => (
              <Stack key={lawShort} spacing={1}>
                <Divider />
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: "text.secondary" }}
                >
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
