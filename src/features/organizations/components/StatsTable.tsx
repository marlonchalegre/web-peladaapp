import {
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  TableBody,
  Box,
  Typography,
  Avatar,
  Stack,
  Chip,
  useMediaQuery,
  useTheme,
  alpha,
} from "@mui/material";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import HandshakeIcon from "@mui/icons-material/Handshake";
import { useTranslation } from "react-i18next";
import { type OrganizationPlayerStats } from "../../../shared/api/endpoints";

interface StatsTableProps {
  stats: OrganizationPlayerStats[];
  orderBy: keyof OrganizationPlayerStats;
  order: "asc" | "desc";
  onSort: (property: keyof OrganizationPlayerStats) => void;
}

const StatBar = ({
  value,
  max,
  color = "primary",
  icon,
}: {
  value: number;
  max: number;
  color?: "primary" | "secondary" | "error" | "info" | "success" | "warning";
  icon?: React.ReactNode;
}) => {
  const theme = useTheme();
  const percentage = max > 0 ? (value / max) * 100 : 0;
  const isDarkMode = theme.palette.mode === "dark";

  const getBarColor = () => {
    if (color === "primary") return theme.palette.primary.main;
    if (color === "error") return theme.palette.error.main;
    if (color === "info") return theme.palette.info.main;
    return theme.palette.grey[isDarkMode ? 700 : 300];
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 100 }}>
      <Box
        sx={{
          flexGrow: 1,
          position: "relative",
          height: 24,
          bgcolor: isDarkMode ? alpha(theme.palette.common.white, 0.05) : "rgba(0,0,0,0.03)",
          borderRadius: 1,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${percentage}%`,
            bgcolor: alpha(getBarColor(), isDarkMode ? 0.3 : 0.1),
            transition: "width 0.5s ease-out",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            px: 1,
            zIndex: 1,
          }}
        >
          {icon && (
            <Box
              sx={{
                display: "flex",
                mr: 0.5,
                color: isDarkMode ? "text.primary" : "inherit",
              }}
            >
              {icon}
            </Box>
          )}
          <Typography
            variant="body2"
            fontWeight="medium"
            sx={{ color: "text.primary" }}
          >
            {value}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default function StatsTable({
  stats,
  orderBy,
  order,
  onSort,
}: StatsTableProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isDarkMode = theme.palette.mode === "dark";

  if (stats.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: "center", borderRadius: 4 }}>
        <Typography color="text.secondary">
          {t("organizations.stats.empty")}
        </Typography>
      </Paper>
    );
  }

  const maxGoals = Math.max(...stats.map((s) => s.goal), 1);
  const maxAssists = Math.max(...stats.map((s) => s.assist), 1);
  const maxPeladas = Math.max(...stats.map((s) => s.peladas_played), 1);
  const maxOwnGoals = Math.max(...stats.map((s) => s.own_goal), 1);

  if (isMobile) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {stats.map((row) => (
          <Paper key={row.player_id} sx={{ p: 2, borderRadius: 3 }}>
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <Avatar
                sx={{
                  bgcolor: isDarkMode ? "grey.800" : "grey.200",
                  color: isDarkMode ? "grey.300" : "grey.600",
                }}
              >
                {row.player_name.charAt(0)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {row.player_name}
                </Typography>
                {row.player_position && (
                  <Typography variant="caption" color="text.secondary">
                    {t(
                      `common.positions.${row.player_position.toLowerCase()}`,
                      { defaultValue: row.player_position },
                    )}
                  </Typography>
                )}
              </Box>
            </Stack>

            <Stack spacing={1.5}>
              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.5 }}
                >
                  {t("organizations.stats.table.peladas")}
                </Typography>
                <StatBar value={row.peladas_played} max={maxPeladas} />
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.5 }}
                >
                  {t("common.goals")}
                </Typography>
                <StatBar
                  value={row.goal}
                  max={maxGoals}
                  icon={<SportsSoccerIcon sx={{ fontSize: 16 }} />}
                />
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.5 }}
                >
                  {t("common.assists")}
                </Typography>
                <StatBar
                  value={row.assist}
                  max={maxAssists}
                  icon={<HandshakeIcon sx={{ fontSize: 16 }} />}
                />
              </Box>
            </Stack>
          </Paper>
        ))}
      </Box>
    );
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        borderRadius: 4,
        boxShadow: "none",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Table sx={{ minWidth: 650 }}>
        <TableHead>
          <TableRow sx={{ bgcolor: isDarkMode ? alpha(theme.palette.common.white, 0.05) : "grey.50" }}>
            <TableCell>
              <TableSortLabel
                active={orderBy === "player_name"}
                direction={orderBy === "player_name" ? order : "asc"}
                onClick={() => onSort("player_name")}
                sx={{ fontWeight: "bold" }}
              >
                {t("common.player")}
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">
              <TableSortLabel
                active={orderBy === "peladas_played"}
                direction={orderBy === "peladas_played" ? order : "asc"}
                onClick={() => onSort("peladas_played")}
                sx={{ fontWeight: "bold" }}
              >
                {t("organizations.stats.table.peladas")}
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">
              <TableSortLabel
                active={orderBy === "goal"}
                direction={orderBy === "goal" ? order : "asc"}
                onClick={() => onSort("goal")}
                sx={{ fontWeight: "bold" }}
              >
                {t("common.goals")}
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">
              <TableSortLabel
                active={orderBy === "assist"}
                direction={orderBy === "assist" ? order : "asc"}
                onClick={() => onSort("assist")}
                sx={{ fontWeight: "bold" }}
              >
                {t("common.assists")}
              </TableSortLabel>
            </TableCell>
            <TableCell align="center">
              <TableSortLabel
                active={orderBy === "own_goal"}
                direction={orderBy === "own_goal" ? order : "asc"}
                onClick={() => onSort("own_goal")}
                sx={{ fontWeight: "bold" }}
              >
                {t("common.own_goals")}
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stats.map((row) => (
            <TableRow key={row.player_id} hover>
              <TableCell>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar
                    sx={{
                      bgcolor: isDarkMode ? "grey.800" : "grey.200",
                      color: isDarkMode ? "grey.300" : "grey.600",
                    }}
                  >
                    {row.player_name.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {row.player_name}
                    </Typography>
                    {row.player_position && (
                      <Chip
                        label={t(
                          `common.positions.${row.player_position.toLowerCase()}`,
                          { defaultValue: row.player_position },
                        )}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          borderColor: theme.palette.primary.light,
                          textTransform: "uppercase",
                          fontWeight: "bold",
                        }}
                      />
                    )}
                  </Box>
                </Stack>
              </TableCell>
              <TableCell align="center">
                <StatBar
                  value={row.peladas_played}
                  max={maxPeladas}
                  color="info"
                />
              </TableCell>
              <TableCell align="center">
                <StatBar
                  value={row.goal}
                  max={maxGoals}
                  icon={<SportsSoccerIcon sx={{ fontSize: 16 }} />}
                />
              </TableCell>
              <TableCell align="center">
                <StatBar
                  value={row.assist}
                  max={maxAssists}
                  icon={<HandshakeIcon sx={{ fontSize: 16 }} />}
                />
              </TableCell>
              <TableCell align="center">
                <StatBar value={row.own_goal} max={maxOwnGoals} color="error" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
