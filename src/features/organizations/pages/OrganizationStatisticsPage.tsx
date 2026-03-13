import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Alert,
  Box,
  Button,
  useMediaQuery,
  useTheme,
  Stack,
} from "@mui/material";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { useOrganizationStatistics } from "../hooks/useOrganizationStatistics";
import { useAuth } from "../../../app/providers/AuthContext";
import StatsFilters from "../components/StatsFilters";
import StatsTable from "../components/StatsTable";
import TopStatsCards from "../components/TopStatsCards";
import ImportStatsDialog from "../components/ImportStatsDialog";
import ExportStatsDialog from "../components/ExportStatsDialog";
import { api } from "../../../shared/api/client";
import { createApi } from "../../../shared/api/endpoints";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";

const endpoints = createApi(api);

export default function OrganizationStatisticsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const orgId = Number(id);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { user } = useAuth();

  const {
    org,
    year,
    setYear,
    error,
    orderBy,
    order,
    stats,
    sortedStats,
    handleRequestSort,
    players,
    handleImport,
    nameFilter,
    setNameFilter,
    minPeladas,
    setMinPeladas,
    minGoals,
    setMinGoals,
    minAssists,
    setMinAssists,
  } = useOrganizationStatistics(orgId);

  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  useEffect(() => {
    if (!orgId || !user) return;
    const userIsAdmin = user.admin_orgs?.includes(orgId) ?? false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAdmin(userIsAdmin);

    endpoints.listAdminsByOrganization(orgId).then((admins) => {
      if (admins.some((a) => a.user_id === user.id)) {
        setIsAdmin(true);
      }
    });
  }, [orgId, user]);

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
      <BreadcrumbNav
        items={[
          { label: org.name, path: `/organizations/${orgId}` },
          { label: t("organizations.detail.button.statistics") },
        ]}
      />

      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "flex-start" : "center",
          gap: 2,
          mb: 4,
        }}
      >
        <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold">
          {t("organizations.stats.title", { name: org.name })}
        </Typography>

        <Stack direction="row" spacing={1}>
          {isAdmin && (
            <Button
              variant="outlined"
              startIcon={<FileUploadIcon />}
              onClick={() => setImportOpen(true)}
              size="small"
              data-testid="import-stats-button"
              sx={{ borderRadius: 2, textTransform: "none" }}
            >
              {t("common.import")}
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => setExportOpen(true)}
            size="small"
            sx={{ borderRadius: 2, textTransform: "none" }}
          >
            {t("common.export")}
          </Button>
        </Stack>
      </Box>

      <TopStatsCards stats={stats} />

      <StatsFilters
        nameFilter={nameFilter}
        onNameFilterChange={setNameFilter}
        minPeladas={minPeladas}
        onMinPeladasChange={setMinPeladas}
        minGoals={minGoals}
        onMinGoalsChange={setMinGoals}
        minAssists={minAssists}
        onMinAssistsChange={setMinAssists}
        year={year}
        onYearChange={setYear}
        years={years}
      />

      <StatsTable
        stats={sortedStats}
        orderBy={orderBy}
        order={order}
        onSort={handleRequestSort}
      />

      <ImportStatsDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={handleImport}
        players={players}
        defaultYear={year}
      />

      <ExportStatsDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        stats={sortedStats}
        year={year}
      />
    </Container>
  );
}
