import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { useOrganizationStatistics } from "../hooks/useOrganizationStatistics";
import StatsFilters from "../components/StatsFilters";
import StatsTable from "../components/StatsTable";

export default function OrganizationStatisticsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const orgId = Number(id);

  const {
    org,
    year,
    setYear,
    error,
    orderBy,
    order,
    sortedStats,
    handleRequestSort,
    nameFilter,
    setNameFilter,
    minPeladas,
    setMinPeladas,
    minGoals,
    setMinGoals,
    minAssists,
    setMinAssists,
    minOwnGoals,
    setMinOwnGoals,
  } = useOrganizationStatistics(orgId);

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i,
  );

  if (error)
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  if (!org) return <Loading message={t("common.loading")} />;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 2 }}>
        <Button
          component={RouterLink}
          to={`/organizations/${orgId}`}
          startIcon={<ArrowBackIcon />}
          variant="text"
        >
          {t("organizations.stats.back_link")}
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          {t("organizations.stats.title", { name: org.name })}
        </Typography>
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel id="year-select-label">{t("common.year")}</InputLabel>
          <Select
            labelId="year-select-label"
            value={year}
            label={t("common.year")}
            onChange={(e) => setYear(Number(e.target.value))}
            size="small"
          >
            {years.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <StatsFilters
        nameFilter={nameFilter}
        onNameFilterChange={setNameFilter}
        minPeladas={minPeladas}
        onMinPeladasChange={setMinPeladas}
        minGoals={minGoals}
        onMinGoalsChange={setMinGoals}
        minAssists={minAssists}
        onMinAssistsChange={setMinAssists}
        minOwnGoals={minOwnGoals}
        onMinOwnGoalsChange={setMinOwnGoals}
      />

      <StatsTable
        stats={sortedStats}
        orderBy={orderBy}
        order={order}
        onSort={handleRequestSort}
      />
    </Container>
  );
}
