import {
  Alert,
  Card,
  CardContent,
  Container,
  Link,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { useApi } from "../api";
import PageHeader from "../components/PageHeader";
import Loading from "../components/Loading";

function NormLinkList({ norms }) {
  return (
    <List dense disablePadding>
      {norms.map((n) => (
        <ListItem key={`${n.id}-${n.role}`} disableGutters sx={{ py: 0.25 }}>
          <ListItemText
            slotProps={{ primary: { variant: "body2" } }}
            primary={
              <>
                <Link
                  component={RouterLink}
                  to={`/norm/${n.id}`}
                  fontWeight={600}
                  underline="hover"
                >
                  {n.law_short} {n.norm_ref}
                </Link>{" "}
                – {n.title}
              </>
            }
          />
        </ListItem>
      ))}
    </List>
  );
}

export default function DefinitionsPage() {
  const { data, error, loading } = useApi("/api/definitions");

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <PageHeader
        title="Definitionen"
        tag={data ? `${data.definitions.length} Begriffe` : null}
        subtitle={
          <>
            Rechtsbegriffe, die eine Norm definiert und die andere Normen
            verwenden. Enthält die Anfrage einen dieser Begriffe, schränkt die
            Suche die Kandidaten hart auf die verknüpften Normen ein (siehe{" "}
            <Link component={RouterLink} to="/architektur">
              Architektur
            </Link>
            , Version 2).
          </>
        }
      />

      {loading && <Loading />}
      {error && <Alert severity="error">{error.message}</Alert>}

      <Stack spacing={2}>
        {data?.definitions.map((d) => (
          <Card key={d.id}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {d.term}
              </Typography>
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                {d.definition_text}
              </Typography>

              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: "block", mt: 2 }}
              >
                Definiert von
              </Typography>
              <NormLinkList norms={d.defined_by} />

              <Typography
                variant="overline"
                color="text.secondary"
                sx={{ display: "block", mt: 1.5 }}
              >
                Verwendet von
              </Typography>
              {d.used_by.length ? (
                <NormLinkList norms={d.used_by} />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Keine weiteren Normen verknüpft.
                </Typography>
              )}
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Container>
  );
}
