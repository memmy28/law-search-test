import { Chip } from "@mui/material";

import { STATUS_COLORS, STATUS_LABEL_LONG, STATUS_LABEL_SHORT } from "../theme";

/** @param {{status: string, long?: boolean}} props */
export default function StatusChip({ status, long = false }) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.vergangen;
  const label =
    (long ? STATUS_LABEL_LONG : STATUS_LABEL_SHORT)[status] ?? status;
  return (
    <Chip
      size="small"
      label={label}
      sx={{
        bgcolor: colors.bg,
        color: colors.text,
        fontWeight: 700,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
      }}
    />
  );
}
