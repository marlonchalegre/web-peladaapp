import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import HandshakeIcon from "@mui/icons-material/Handshake";
import StarIcon from "@mui/icons-material/Star";
import { useTranslation } from "react-i18next";
import { type OrganizationPlayerStats } from "../../../shared/api/endpoints";

interface TopStatsCardsProps {
  stats: OrganizationPlayerStats[];
}

interface StatCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  playerName: string;
  value: string | number;
  unit: string;
}

const StatCard = ({
  title,
  subtitle,
  icon,
  playerName,
  value,
  unit,
}: StatCardProps) => {
  return (
    <Card
      sx={{
        flex: 1,
        minWidth: { xs: "100%", sm: "280px" },
        borderRadius: 4,
        boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.05)",
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 0.5 }}>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <Box sx={{ color: "text.secondary" }}>{icon}</Box>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: "grey.200",
              color: "grey.600",
              fontSize: "1.5rem",
            }}
          >
            {playerName.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {playerName}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
              <Typography variant="h5" fontWeight="bold">
                {value}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {unit}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default function TopStatsCards({ stats }: TopStatsCardsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const topScorer = [...stats].sort((a, b) => b.goal - a.goal)[0];
  const topAssister = [...stats].sort((a, b) => b.assist - a.assist)[0];
  const topMvp = [...stats].sort((a, b) => b.avg_rating - a.avg_rating)[0];

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        gap: 3,
        mb: 4,
        overflowX: "auto",
        pb: isMobile ? 0 : 2,
      }}
    >
      <StatCard
        title={t("organizations.stats.cards.top_scorer")}
        subtitle="Top Scorer"
        icon={<SportsSoccerIcon />}
        playerName={topScorer?.player_name || "-"}
        value={topScorer?.goal || 0}
        unit={t("common.goals")}
      />
      <StatCard
        title={t("organizations.stats.cards.top_assister")}
        subtitle="Top Assister"
        icon={<HandshakeIcon />}
        playerName={topAssister?.player_name || "-"}
        value={topAssister?.assist || 0}
        unit={t("common.assists")}
      />
      <StatCard
        title={t("organizations.stats.cards.mvp")}
        subtitle="Most Valuable Player"
        icon={<StarIcon />}
        playerName={topMvp?.player_name || "-"}
        value={topMvp?.avg_rating?.toFixed(1) || "0.0"}
        unit={t("organizations.stats.cards.rating")}
      />
    </Box>
  );
}
