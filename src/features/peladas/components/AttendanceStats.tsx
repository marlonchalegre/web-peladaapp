import { Box, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import { useTranslation } from "react-i18next";

interface AttendanceStatsProps {
  total: number;
  confirmedCount: number;
  declinedCount: number;
  pendingCount: number;
}

export default function AttendanceStats({
  total,
  confirmedCount,
  declinedCount,
  pendingCount,
}: AttendanceStatsProps) {
  const { t } = useTranslation();

  return (
    <Box sx={{ mb: 4, pb: 4, borderBottom: 1, borderColor: "divider" }}>
      <Grid container spacing={4}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: "bold", letterSpacing: 1 }}
          >
            {t("peladas.attendance.stats.total_players")}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {total}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: "bold", letterSpacing: 1 }}
          >
            {t("peladas.attendance.stats.total_confirmed")}
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "success.main" }}
          >
            {confirmedCount}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: "bold", letterSpacing: 1 }}
          >
            {t("peladas.attendance.stats.total_declined")}
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "error.main" }}
          >
            {declinedCount}
          </Typography>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ fontWeight: "bold", letterSpacing: 1 }}
          >
            {t("peladas.attendance.stats.total_pending")}
          </Typography>
          <Typography
            variant="h4"
            sx={{ fontWeight: "bold", color: "text.secondary" }}
          >
            {pendingCount}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}
