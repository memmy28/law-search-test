import { Chip } from "@mui/material";

const RELEVANT_SX = { bgcolor: "#dcfce7", color: "#15803d" };
const IRRELEVANT_SX = { bgcolor: "#f3f4f6", color: "#6b7280" };

export function RelevanceChip({ relevant }) {
  return (
    <Chip
      size="small"
      label={relevant ? "relevant" : "nicht relevant"}
      sx={{
        ...(relevant ? RELEVANT_SX : IRRELEVANT_SX),
        fontWeight: 700,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.02em",
      }}
    />
  );
}

export function ProbabilityChip({ label, probability, relevant }) {
  return (
    <Chip
      size="small"
      label={`${label} ${Math.round(probability * 100)}%`}
      sx={{ ...(relevant ? RELEVANT_SX : IRRELEVANT_SX), fontWeight: 600 }}
    />
  );
}
