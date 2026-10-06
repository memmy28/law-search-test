import {
  Button,
  Card,
  CardActions,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import StatusChip from "./StatusChip";

export default function ResultCard({ rank, result }) {
  return (
    <Card>
      <CardContent sx={{ pb: 0 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="baseline"
          spacing={2}
        >
          <Typography variant="subtitle1">
            {rank}. {result.law_short} {result.norm_ref} – {result.title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ whiteSpace: "nowrap" }}
          >
            Score {result.score.toFixed(3)}
          </Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          gültig: {result.valid_from} bis {result.valid_to ?? "offen"}
        </Typography>
        <Stack sx={{ mt: 1 }} direction="row">
          <StatusChip status={result.status} long />
        </Stack>
        <Typography variant="body2" sx={{ mt: 1.5, lineHeight: 1.6 }}>
          {result.body}
        </Typography>
      </CardContent>
      <CardActions>
        <Button component={RouterLink} to={`/norm/${result.id}`} size="small">
          Quelle
        </Button>
      </CardActions>
    </Card>
  );
}
