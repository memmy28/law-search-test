import {
  Alert,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  Container,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useParams } from "react-router-dom";

import { useApi } from "../api";
import PageHeader from "../components/PageHeader";
import StatusChip from "../components/StatusChip";
import Loading from "../components/Loading";

function DefinitionChips({ label, definitions }) {
  if (!definitions.length) return null;
  return (
    <>
      <Typography variant="overline" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {definitions.map((d) => (
          <Chip
            key={d.id}
            label={d.term}
            size="small"
            clickable
            component={RouterLink}
            to="/definitionen"
            color="primary"
            variant="outlined"
          />
        ))}
      </Stack>
    </>
  );
}

export default function NormDetailPage() {
  const { id } = useParams();
  const { data, error, loading } = useApi(`/api/norms/${id}`);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Loading />
      </Container>
    );
  }

  if (error || !data) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error">Norm nicht gefunden.</Alert>
        <Button component={RouterLink} to="/" sx={{ mt: 2 }}>
          ← Zurück zur Suche
        </Button>
      </Container>
    );
  }

  const { norm, versions, defines, uses } = data;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button component={RouterLink} to="/" size="small" sx={{ mb: 1, ml: -1 }}>
        ← Zurück zur Suche
      </Button>
      <PageHeader title={`${norm.law_short} ${norm.norm_ref}`} tag="Detail" subtitle={norm.heading_context} />

      <Stack spacing={2}>
        <Card>
          <CardContent sx={{ pb: 0 }}>
            <Typography variant="subtitle1">{norm.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              gültig: {norm.valid_from} bis {norm.valid_to ?? "offen"}
            </Typography>
            <Stack direction="row" sx={{ mt: 1 }}>
              <StatusChip status={norm.status} long />
            </Stack>
            <Typography variant="body1" sx={{ mt: 2, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {norm.body}
            </Typography>
          </CardContent>
          <CardActions>
            <Button href={norm.source_url} target="_blank" rel="noopener" size="small">
              Offizielle Quelle ansehen ↗
            </Button>
          </CardActions>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Alle Fassungen von {norm.law_short} {norm.norm_ref}
            </Typography>
            <List disablePadding>
              {versions.map((v) => (
                <ListItemButton
                  key={v.id}
                  component={RouterLink}
                  to={`/norm/${v.id}`}
                  selected={v.id === norm.id}
                  sx={{ borderRadius: 2, gap: 1.5 }}
                >
                  <StatusChip status={v.status} />
                  <ListItemText
                    primary={v.title}
                    secondary={`${v.valid_from} – ${v.valid_to ?? "offen"}`}
                    slotProps={{ primary: { variant: "body2" }, secondary: { variant: "caption" } }}
                  />
                </ListItemButton>
              ))}
            </List>
          </CardContent>
        </Card>

        {(defines.length > 0 || uses.length > 0) && (
          <Card>
            <CardContent>
              <Typography variant="h6">Verweise auf Definitionen</Typography>
              <DefinitionChips label="Definiert" definitions={defines} />
              <DefinitionChips label="Verwendet" definitions={uses} />
            </CardContent>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
