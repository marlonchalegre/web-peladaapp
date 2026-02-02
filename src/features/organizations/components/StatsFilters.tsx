import { Paper, Typography, Grid, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

interface StatsFiltersProps {
  nameFilter: string;
  onNameFilterChange: (val: string) => void;
  minPeladas: string;
  onMinPeladasChange: (val: string) => void;
  minGoals: string;
  onMinGoalsChange: (val: string) => void;
  minAssists: string;
  onMinAssistsChange: (val: string) => void;
  minOwnGoals: string;
  onMinOwnGoalsChange: (val: string) => void;
}

export default function StatsFilters({
  nameFilter,
  onNameFilterChange,
  minPeladas,
  onMinPeladasChange,
  minGoals,
  onMinGoalsChange,
  minAssists,
  onMinAssistsChange,
  minOwnGoals,
  onMinOwnGoalsChange,
}: StatsFiltersProps) {
  const { t } = useTranslation();

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t("common.filters")}
      </Typography>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth
            label={t("common.fields.player_name")}
            value={nameFilter}
            onChange={(e) => onNameFilterChange(e.target.value)}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <TextField
            fullWidth
            label={t("organizations.stats.filters.min_peladas")}
            type="number"
            value={minPeladas}
            onChange={(e) => onMinPeladasChange(e.target.value)}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <TextField
            fullWidth
            label={t("organizations.stats.filters.min_goals")}
            type="number"
            value={minGoals}
            onChange={(e) => onMinGoalsChange(e.target.value)}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <TextField
            fullWidth
            label={t("organizations.stats.filters.min_assists")}
            type="number"
            value={minAssists}
            onChange={(e) => onMinAssistsChange(e.target.value)}
            size="small"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth
            label={t("organizations.stats.filters.min_own_goals")}
            type="number"
            value={minOwnGoals}
            onChange={(e) => onMinOwnGoalsChange(e.target.value)}
            size="small"
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
