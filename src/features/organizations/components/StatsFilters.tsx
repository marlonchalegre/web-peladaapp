import { useState } from "react";
import {
  Typography,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
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
  // Year
  year: number;
  onYearChange: (val: number) => void;
  years: number[];
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
  year,
  onYearChange,
  years,
}: StatsFiltersProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ mb: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          cursor: "pointer",
        }}
        onClick={() => setExpanded(!expanded)}
        data-testid="filters-header"
      >
        <Typography variant="h5" fontWeight="bold">
          {t("common.filters")}
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          {!isMobile && (
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel id="year-select-label">{t("common.year")}</InputLabel>
              <Select
                labelId="year-select-label"
                value={year}
                label={t("common.year")}
                onChange={(e) => onYearChange(Number(e.target.value))}
                sx={{
                  borderRadius: 2,
                  height: "40px",
                }}
              >
                {years.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{ ml: 1 }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Stack>
      </Box>

      <Collapse in={expanded}>
        <Stack spacing={2}>
          {isMobile && (
            <FormControl size="small" fullWidth sx={{ mb: 1 }}>
              <InputLabel id="year-select-label-mobile">
                {t("common.year")}
              </InputLabel>
              <Select
                labelId="year-select-label-mobile"
                value={year}
                label={t("common.year")}
                onChange={(e) => onYearChange(Number(e.target.value))}
                sx={{ borderRadius: 2 }}
              >
                {years.map((y) => (
                  <MenuItem key={y} value={y}>
                    {y}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={2}
            alignItems={isMobile ? "stretch" : "center"}
          >
            <TextField
              placeholder={t("common.fields.player_name")}
              value={nameFilter}
              onChange={(e) => onNameFilterChange(e.target.value)}
              size="small"
              sx={{
                flexGrow: 2,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label={t("organizations.stats.filters.min_peladas")}
              type="number"
              value={minPeladas}
              onChange={(e) => onMinPeladasChange(e.target.value)}
              size="small"
              sx={{
                width: isMobile ? "100%" : "180px",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              label={t("organizations.stats.filters.min_goals")}
              type="number"
              value={minGoals}
              onChange={(e) => onMinGoalsChange(e.target.value)}
              size="small"
              sx={{
                width: isMobile ? "100%" : "180px",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <TextField
              label={t("organizations.stats.filters.min_assists")}
              type="number"
              value={minAssists}
              onChange={(e) => onMinAssistsChange(e.target.value)}
              size="small"
              sx={{
                width: isMobile ? "100%" : "180px",
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          </Stack>
        </Stack>
      </Collapse>
    </Box>
  );
}
