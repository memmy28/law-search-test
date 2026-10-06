import { Box, Stack, Tooltip, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import { STATUS_COLORS } from "../theme";

const LABEL_WIDTH = 230;
const ROW_HEIGHT = 32;
const AXIS_PAD = 24;

// Jahresbeschriftung so ausdünnen, dass höchstens ~12 Labels entstehen
// (der Datensatz reicht von 1907 bis 2027, jedes Jahr wäre unlesbar).
function yearStep(span) {
  const raw = span / 12;
  return [1, 2, 5, 10, 20, 25, 50, 100].find((s) => s >= raw) ?? 100;
}

export default function NormTimeline({ norms, today: todayStr }) {
  if (!norms?.length) {
    return (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ py: 2, textAlign: "center" }}
      >
        Keine Normen in der Datenbank.
      </Typography>
    );
  }

  const groups = new Map();
  norms.forEach((n) => {
    const key = `${n.law_short} ${n.norm_ref}`;
    if (!groups.has(key)) groups.set(key, { label: key, items: [] });
    groups.get(key).items.push(n);
  });
  const rows = [...groups.values()].sort((a, b) =>
    a.label.localeCompare(b.label, "de"),
  );

  const today = new Date(todayStr);
  const openEndedFallback = new Date(today.getFullYear() + 2, 0, 1);
  const dates = [today];
  norms.forEach((n) => {
    dates.push(new Date(n.valid_from));
    dates.push(n.valid_to ? new Date(n.valid_to) : openEndedFallback);
  });
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const pct = (d) => ((d - minDate) / (maxDate - minDate)) * 100;

  const startYear = new Date(minDate).getFullYear();
  const endYear = new Date(maxDate).getFullYear();
  const step = yearStep(endYear - startYear);
  const years = [];
  for (let y = Math.ceil(startYear / step) * step; y <= endYear; y += step)
    years.push(y);

  return (
    <Box
      sx={{ position: "relative", pt: `${AXIS_PAD}px`, pb: `${AXIS_PAD}px` }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          left: LABEL_WIDTH,
          right: 0,
          top: AXIS_PAD,
          bottom: AXIS_PAD,
        }}
      >
        {years.map((year) => {
          const x = pct(new Date(year, 0, 1));
          if (x < 0 || x > 100) return null;
          return (
            <Box
              key={year}
              sx={{
                position: "absolute",
                left: `${x}%`,
                top: 0,
                bottom: 0,
                borderLeft: 1,
                borderColor: "divider",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  position: "absolute",
                  top: -20,
                  transform: "translateX(-50%)",
                  fontSize: 10,
                  color: "text.secondary",
                }}
              >
                {year}
              </Typography>
            </Box>
          );
        })}
        <Box
          sx={{
            position: "absolute",
            left: `${pct(today)}%`,
            top: 0,
            bottom: 0,
            borderLeft: "1.5px dashed",
            borderColor: "text.primary",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              position: "absolute",
              bottom: -20,
              transform: "translateX(-50%)",
              fontSize: 10,
            }}
          >
            heute
          </Typography>
        </Box>
      </Box>

      <Stack sx={{ position: "relative" }}>
        {rows.map((group) => (
          <Stack
            key={group.label}
            direction="row"
            alignItems="center"
            sx={{ height: ROW_HEIGHT }}
          >
            <Typography
              variant="body2"
              noWrap
              title={group.label}
              sx={{ width: LABEL_WIDTH, flexShrink: 0, fontSize: 12, pr: 1 }}
            >
              {group.label}
            </Typography>
            <Box sx={{ position: "relative", flex: 1, height: "100%" }}>
              {group.items.map((item) => {
                const x1 = pct(new Date(item.valid_from));
                const x2 = item.valid_to ? pct(new Date(item.valid_to)) : 100;
                const validTo = item.valid_to ?? "offen";
                return (
                  <Tooltip
                    key={item.id}
                    arrow
                    title={`${item.title} · ${item.valid_from} bis ${validTo}`}
                  >
                    <Box
                      component={RouterLink}
                      to={`/norm/${item.id}`}
                      aria-label={`${group.label}: ${item.valid_from} bis ${validTo}`}
                      sx={{
                        position: "absolute",
                        display: "block",
                        left: `${x1}%`,
                        width: `${Math.max(x2 - x1, 0.6)}%`,
                        minWidth: 4,
                        top: 7,
                        height: ROW_HEIGHT - 15,
                        borderRadius: 1,
                        bgcolor: STATUS_COLORS[item.status]?.bar ?? "#999",
                        "&:hover": { opacity: 0.8 },
                      }}
                    />
                  </Tooltip>
                );
              })}
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}
