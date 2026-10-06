import { Box, Chip, Stack, Typography } from "@mui/material";

export default function PageHeader({ title, tag, subtitle, children }) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {tag && (
          <Chip
            label={tag}
            size="small"
            sx={{ bgcolor: "#eaefff", color: "primary.main", fontWeight: 600 }}
          />
        )}
      </Stack>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
          {subtitle}
        </Typography>
      )}
      {children}
    </Box>
  );
}
