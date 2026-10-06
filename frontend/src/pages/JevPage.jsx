import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Card,
  CardContent,
  Container,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Link as RouterLink } from "react-router-dom";

import { useApi } from "../api";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";
import { RelevanceChip } from "../components/RelevanceChip";

const byProbability = (a, b) => b.probability - a.probability;
const percent = (p) => `${Math.round(p * 100)}%`;

function NormTable({ norms }) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Norm</TableCell>
          <TableCell>Einschätzung</TableCell>
          <TableCell>Wahrscheinlichkeit</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[...norms].sort(byProbability).map((n) => (
          <TableRow key={n.norm_ref}>
            <TableCell>
              {n.norm_ref} – {n.title}
            </TableCell>
            <TableCell>
              <RelevanceChip relevant={n.relevant} />
            </TableCell>
            <TableCell>{percent(n.probability)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function RunCard({ run }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">"{run.query}"</Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date(run.created_at).toLocaleString("de-DE")}
        </Typography>
        <TableContainer>
          <Table size="small" sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Gesetz</TableCell>
                <TableCell>Einschätzung</TableCell>
                <TableCell>Wahrscheinlichkeit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...run.laws].sort(byProbability).map((law) => (
                <TableRow key={law.law_short} sx={{ verticalAlign: "top" }}>
                  <TableCell>
                    {law.law_short}
                    {law.norms.length > 0 && (
                      <Accordion disableGutters elevation={0} sx={{ mt: 1, bgcolor: "#fafbfc", "&:before": { display: "none" } }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 36 }}>
                          <Typography variant="caption" color="text.secondary">
                            {law.norms.length} Normen von {law.law_short} einzeln klassifiziert
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0 }}>
                          <NormTable norms={law.norms} />
                        </AccordionDetails>
                      </Accordion>
                    )}
                  </TableCell>
                  <TableCell>
                    <RelevanceChip relevant={law.relevant} />
                  </TableCell>
                  <TableCell>{percent(law.probability)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}

export default function JevPage() {
  const { data, error, loading } = useApi("/api/jev/runs");

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        title="Jev-Klassifikation"
        tag={data ? `${data.runs.length} Anfragen protokolliert` : null}
        subtitle="Für jede Suchanfrage lässt die Anwendung das Jev-Modell (TypeSafe AI) per Noul-Frage einschätzen, ob jedes in der Datenbank vorhandene Gesetz einschlägig ist. Wahrscheinlichkeit ≥ 50 % gilt als „relevant“. Nur für relevante Gesetze klassifiziert Jev zusätzlich jede einzelne Norm dieses Gesetzes (zweite Stufe, aufklappbar)."
      />

      {loading && <Loading />}
      {error && <Alert severity="error">{error.message}</Alert>}

      {data && data.runs.length === 0 && (
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Noch keine Jev-Klassifikationen protokolliert. Stelle auf der{" "}
              <Link component={RouterLink} to="/">
                Suchseite
              </Link>{" "}
              eine Frage.
            </Typography>
          </CardContent>
        </Card>
      )}

      <Stack spacing={2}>
        {data?.runs.map((run) => (
          <RunCard key={`${run.created_at}-${run.query}`} run={run} />
        ))}
      </Stack>
    </Container>
  );
}
