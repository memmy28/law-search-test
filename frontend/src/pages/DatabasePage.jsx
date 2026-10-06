import {
  Alert,
  Box,
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
import { Link as RouterLink } from "react-router-dom";

import { useApi } from "../api";
import PageHeader from "../components/PageHeader";
import StatusChip from "../components/StatusChip";
import Loading from "../components/Loading";
import NormTimeline from "../components/NormTimeline";
import { STATUS_COLORS, STATUS_LABEL_LONG } from "../theme";

export default function DatabasePage() {
  const { data, error, loading } = useApi("/api/norms");

  /** @type {Map<string, any[]>} */
  const groups = new Map();
  data?.norms.forEach((/** @type {any} */ n) => {
    const list = groups.get(n.law_short) ?? [];
    list.push(n);
    groups.set(n.law_short, list);
  });

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        title="Datenbank"
        tag={
          data ? `${data.norms.length} Normen · ${groups.size} Gesetze` : null
        }
        subtitle="Alle Gesetze, Normen und Fassungen, die aktuell in der Wissensdatenbank enthalten sind."
      />

      {loading && <Loading />}
      {error && <Alert severity="error">{error.message}</Alert>}

      <Stack spacing={2}>
        {[...groups.entries()].map(([law, lawNorms]) => (
          <Card key={law}>
            <CardContent>
              <Typography variant="h6">
                {law}{" "}
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                >
                  ({lawNorms.length} Fassung{lawNorms.length === 1 ? "" : "en"})
                </Typography>
              </Typography>
              <TableContainer>
                <Table size="small" sx={{ mt: 1 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Norm</TableCell>
                      <TableCell>Titel</TableCell>
                      <TableCell>Gültig von</TableCell>
                      <TableCell>Gültig bis</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lawNorms.map((n) => (
                      <TableRow key={n.id} hover>
                        <TableCell>
                          <Link
                            component={RouterLink}
                            to={`/norm/${n.id}`}
                            fontWeight={600}
                            underline="hover"
                          >
                            {n.norm_ref}
                          </Link>
                        </TableCell>
                        <TableCell>{n.title}</TableCell>
                        <TableCell>{n.valid_from}</TableCell>
                        <TableCell>{n.valid_to ?? "offen"}</TableCell>
                        <TableCell>
                          <StatusChip status={n.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        ))}

        {data && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Verbindungen zwischen Normen
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Eine Art von Verbindung gibt es bereits: die{" "}
                <Link component={RouterLink} to="/definitionen">
                  Definitionsbibliothek
                </Link>{" "}
                verknüpft Rechtsbegriffe mit der sie definierenden Norm und den
                Normen, die sie verwenden. Andere Beziehungsarten wie "verweist
                auf", "setzt um" oder "ändert" sind in diesem Prototyp weiterhin
                nicht als Daten hinterlegt — das wäre die vollständige
                Graph-Schicht aus Schritt 6 der{" "}
                <Link component={RouterLink} to="/architektur">
                  Architektur
                </Link>
                .
              </Typography>
            </CardContent>
          </Card>
        )}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6">
              Zeitliche Übersicht aller Normen
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Jede Zeile ist eine Norm, jeder Balken eine Fassung. Die
              gestrichelte Linie markiert heute.
            </Typography>
            <Stack
              direction="row"
              spacing={2}
              sx={{ mt: 1.5 }}
              flexWrap="wrap"
              useFlexGap
            >
              {Object.entries(STATUS_LABEL_LONG).map(([status, label]) => (
                <Stack
                  key={status}
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                >
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: 0.5,
                      bgcolor: STATUS_COLORS[status].bar,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {label}
                  </Typography>
                </Stack>
              ))}
            </Stack>
            {loading && <Loading />}
            {error && (
              <Alert severity="error">
                Zeitstrahl konnte nicht geladen werden.
              </Alert>
            )}
            {data && <NormTimeline norms={data.norms} today={data.today} />}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
