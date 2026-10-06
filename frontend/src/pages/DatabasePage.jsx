import {
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
import { Link as RouterLink } from "react-router-dom";

import { useApi } from "../api";
import PageHeader from "../components/PageHeader";
import StatusChip from "../components/StatusChip";
import Loading from "../components/Loading";

export default function DatabasePage() {
  const { data, error, loading } = useApi("/api/norms");

  const groups = new Map();
  data?.norms.forEach((n) => {
    if (!groups.has(n.law_short)) groups.set(n.law_short, []);
    groups.get(n.law_short).push(n);
  });

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        title="Datenbank"
        tag={data ? `${data.norms.length} Normen · ${groups.size} Gesetze` : null}
        subtitle="Alle Gesetze, Normen und Fassungen, die aktuell in der Wissensdatenbank enthalten sind."
      />

      {loading && <Loading />}
      {error && <Alert severity="error">{error.message}</Alert>}

      <Stack spacing={2}>
        {[...groups.entries()].map(([law, norms]) => (
          <Card key={law}>
            <CardContent>
              <Typography variant="h6">
                {law}{" "}
                <Typography component="span" variant="body2" color="text.secondary">
                  ({norms.length} Fassung{norms.length === 1 ? "" : "en"})
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
                    {norms.map((n) => (
                      <TableRow key={n.id} hover>
                        <TableCell>
                          <Link component={RouterLink} to={`/norm/${n.id}`} fontWeight={600} underline="hover">
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
                verknüpft Rechtsbegriffe mit der sie definierenden Norm und den Normen, die sie verwenden.
                Andere Beziehungsarten wie "verweist auf", "setzt um" oder "ändert" sind in diesem Prototyp
                weiterhin nicht als Daten hinterlegt — das wäre die vollständige Graph-Schicht aus Schritt 6 der{" "}
                <Link component={RouterLink} to="/architektur">
                  Architektur
                </Link>
                .
              </Typography>
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
