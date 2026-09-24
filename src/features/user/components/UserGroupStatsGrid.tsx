import { Box, Typography, useTheme } from "@mui/material";

interface UserGroupStatsGridProps {
  peladasPlayed: number;
  goals: number;
  assists: number;
  titles: number;
}

export function UserGroupStatsGrid({
  peladasPlayed,
  goals,
  assists,
  titles,
}: UserGroupStatsGridProps) {
  const theme = useTheme();
  const assistColor = theme.palette.mode === "dark" ? "#4caf50" : "#146b3a";

  const items = [
    { label: "JOGOS", val: peladasPlayed, color: "text.primary" },
    { label: "GOLS", val: goals, color: "text.primary" },
    { label: "ASSIST.", val: assists, color: assistColor },
    { label: "TÍTULOS", val: titles, color: "text.primary" },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: "1px",
        bgcolor: "divider",
      }}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{ bgcolor: "background.paper", p: "12px 9px" }}
        >
          <Typography
            sx={{
              fontFamily: "'Archivo Narrow', Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "23px",
              lineHeight: 1,
              color: item.color,
            }}
          >
            {item.val}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "8px",
              lineHeight: 1.2,
              letterSpacing: ".08em",
              color: "text.secondary",
              mt: 0.5,
              textTransform: "uppercase",
            }}
          >
            {item.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default UserGroupStatsGrid;
