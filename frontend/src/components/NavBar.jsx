import {
  AppBar,
  Box,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";

import {
  STATE_DESCRIPTIONS,
  STATE_LABELS,
  useAppState,
} from "../state/AppStateContext";

const NAV_ITEMS = [
  { to: "/", label: "Suche" },
  { to: "/datenbank", label: "Datenbank" },
  { to: "/architektur", label: "Architektur" },
  { to: "/definitionen", label: "Definitionen", requires: "definition" },
  { to: "/jev", label: "Jev-Klassifikation", requires: "classification" },
];

export default function NavBar() {
  const { state, states, setState, hasDefinitions, hasClassification } =
    useAppState();
  const { pathname } = useLocation();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.requires === "definition") return hasDefinitions;
    if (item.requires === "classification") return hasClassification;
    return true;
  });

  const isActive = (to) =>
    to === "/"
      ? pathname === "/" || pathname.startsWith("/norm/")
      : pathname.startsWith(to);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ gap: 3, flexWrap: "wrap", px: { xs: 2, md: 4 } }}>
        <Typography
          component={RouterLink}
          to="/"
          variant="subtitle2"
          sx={{
            fontWeight: 700,
            color: "text.primary",
            textDecoration: "none",
            mr: "auto",
          }}
        >
          Rechts-Wissensdatenbank
        </Typography>

        <Stack direction="row" spacing={1}>
          {visibleItems.map((item) => {
            const active = isActive(item.to);
            return (
              <Button
                key={item.to}
                component={RouterLink}
                to={item.to}
                size="small"
                sx={{
                  color: active ? "primary.main" : "text.secondary",
                  borderRadius: 0,
                  borderBottom: 2,
                  borderColor: active ? "primary.main" : "transparent",
                  px: 0.5,
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Stack>

        <Box sx={{ borderLeft: 1, borderColor: "divider", pl: 3 }}>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={state}
            onChange={(_, next) => next && setState(next)}
            aria-label="Entwicklungsstand"
          >
            {states.map((s) => (
              <ToggleButton
                key={s}
                value={s}
                aria-label={STATE_DESCRIPTIONS[s]}
              >
                <Tooltip title={STATE_DESCRIPTIONS[s]}>
                  <Box component="span">{STATE_LABELS[s]}</Box>
                </Tooltip>
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
