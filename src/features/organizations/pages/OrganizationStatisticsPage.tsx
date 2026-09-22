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
import OrganizationStatisticsDesktopView from "../components/OrganizationStatisticsDesktopView";
import { api } from "../../../shared/api/client";
import { createApi, type WeeklyPresence } from "../../../shared/api/endpoints";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";

const endpoints = createApi(api);

export default function OrganizationStatisticsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const orgId = id!;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
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
  const [weeklyPresence, setWeeklyPresence] = useState<WeeklyPresence[]>([]);

  useEffect(() => {
    if (!orgId) return;
    let active = true;
    endpoints
      .getWeeklyPresence(orgId, 12)
      .then((data) => {
        if (active) setWeeklyPresence(data);
      })
      .catch(() => {
        if (active) setWeeklyPresence([]);
      });
    return () => {
      active = false;
    };
  }, [orgId]);

  useEffect(() => {
    if (!orgId || !user) return;
    const userIsAdmin = user.admin_orgs?.includes(orgId) ?? false;

    setIsAdmin(userIsAdmin);

    endpoints.listAdminsByOrganization(orgId).then((admins) => {
      if (admins.some((a) => a.user_id === user.id)) {
        setIsAdmin(true);
      }
    });
  }, [orgId, user]);

  const years = Array.from({ length: 5 }, (_, i) =>
    String(new Date().getFullYear() - i),
  );

  if (error)
    return (
      <Container sx={{ mt: 4, px: { xs: 1, sm: 2 } }} disableGutters>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  if (!org) return <Loading message={t("common.loading")} />;

  const totalGoals = stats.reduce((acc, curr) => acc + (curr.goal || 0), 0);
  const totalPeladas = stats.reduce(
    (acc, curr) => Math.max(acc, curr.peladas_played || 0),
    0,
  );
  const avgGoals =
    totalPeladas > 0 ? (totalGoals / totalPeladas).toFixed(1) : "0";

  if (isDesktop) {
    return (
      <Box sx={{ width: "100%", bgcolor: "#f6f4ee", minHeight: "100vh" }}>
        <OrganizationStatisticsDesktopView
          org={org}
          stats={stats}
          totalPeladas={totalPeladas}
          totalGoals={totalGoals}
          avgGoals={avgGoals}
          year={year}
          years={years}
          onYearChange={setYear}
          currentUser={user}
          isAdmin={isAdmin}
          onOpenImport={() => setImportOpen(true)}
          onOpenExport={() => setExportOpen(true)}
          weeklyPresence={weeklyPresence}
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
      </Box>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        pt: 2,
        pb: 3,
        px: { xs: 1, sm: 2 },
      }}
      disableGutters
    >
      <>
        <Box sx={{ px: { xs: 1, sm: 0 }, mb: 2 }}>
          <BreadcrumbNav
            items={[
              { label: org.name, path: `/organizations/${orgId}` },
              { label: t("organizations.detail.button.statistics") },
            ]}
          />
        </Box>

        {/* Template 3b Dark Header */}
        <Box
          sx={{
            bgcolor: "#17181a",
            borderRadius: "18px",
            p: { xs: 2.5, sm: 3 },
            mb: 3,
            color: "#f6f4ee",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
            }}
          >
            <Box>
              <Typography
                sx={{
                  font: "700 9.5px/1 Archivo,sans-serif",
                  letterSpacing: ".16em",
                  color: "#9a958a",
                  textTransform: "uppercase",
                }}
              >
                {org.name} · FUTEBOL
              </Typography>
              <Typography
                variant={isMobile ? "h5" : "h4"}
                sx={{
                  fontWeight: 800,
                  color: "#f6f4ee",
                  mt: 0.5,
                  letterSpacing: -0.5,
                }}
              >
                {t("organizations.stats.title", { name: org.name })}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1}>
              {isAdmin && (
                <Button
                  variant="outlined"
                  onClick={() => setImportOpen(true)}
                  size="small"
                  data-testid="import-stats-button"
                  sx={{
                    borderRadius: "10px",
                    borderColor: "#3a3b3e",
                    color: "#f6f4ee",
                    textTransform: "none",
                    fontWeight: 700,
                    minWidth: { xs: "40px", sm: "auto" },
                    px: { xs: 0, sm: 2 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    "&:hover": {
                      borderColor: "#f6f4ee",
                      bgcolor: "rgba(255, 255, 255, 0.05)",
                    },
                  }}
                >
                  <FileUploadIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    {t("common.import")}
                  </Box>
                </Button>
              )}
              <Button
                variant="outlined"
                onClick={() => setExportOpen(true)}
                size="small"
                sx={{
                  borderRadius: "10px",
                  borderColor: "#3a3b3e",
                  color: "#f6f4ee",
                  textTransform: "none",
                  fontWeight: 700,
                  minWidth: { xs: "40px", sm: "auto" },
                  px: { xs: 0, sm: 2 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  "&:hover": {
                    borderColor: "#f6f4ee",
                    bgcolor: "rgba(255, 255, 255, 0.05)",
                  },
                }}
              >
                <FileDownloadIcon sx={{ mr: { xs: 0, sm: 1 } }} />
                <Box
                  component="span"
                  sx={{ display: { xs: "none", sm: "inline" } }}
                >
                  {t("common.export")}
                </Box>
              </Button>
            </Stack>
          </Box>

          {/* Summary Metrics */}
          <Box
            sx={{
              display: "flex",
              gap: { xs: 2.5, sm: 3.5 },
              mt: 3,
              flexWrap: "wrap",
            }}
          >
            <Box>
              <Typography
                sx={{
                  font: "700 28px/1 'Archivo Narrow',Archivo,sans-serif",
                  color: "#f6f4ee",
                }}
              >
                {totalPeladas}
              </Typography>
              <Typography
                sx={{
                  font: "700 8.5px/1.2 Archivo,sans-serif",
                  letterSpacing: ".1em",
                  color: "#9a958a",
                  mt: 0.5,
                  textTransform: "uppercase",
                }}
              >
                PELADAS
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  font: "700 28px/1 'Archivo Narrow',Archivo,sans-serif",
                  color: "#f2a100",
                }}
              >
                {totalGoals}
              </Typography>
              <Typography
                sx={{
                  font: "700 8.5px/1.2 Archivo,sans-serif",
                  letterSpacing: ".1em",
                  color: "#9a958a",
                  mt: 0.5,
                  textTransform: "uppercase",
                }}
              >
                GOLS
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  font: "700 28px/1 'Archivo Narrow',Archivo,sans-serif",
                  color: "#f6f4ee",
                }}
              >
                {avgGoals}
              </Typography>
              <Typography
                sx={{
                  font: "700 8.5px/1.2 Archivo,sans-serif",
                  letterSpacing: ".1em",
                  color: "#9a958a",
                  mt: 0.5,
                  textTransform: "uppercase",
                }}
              >
                MÉDIA/JOGO
              </Typography>
            </Box>
            <Box>
              <Typography
                sx={{
                  font: "700 28px/1 'Archivo Narrow',Archivo,sans-serif",
                  color: "#f6f4ee",
                }}
              >
                {stats.length}
              </Typography>
              <Typography
                sx={{
                  font: "700 8.5px/1.2 Archivo,sans-serif",
                  letterSpacing: ".1em",
                  color: "#9a958a",
                  mt: 0.5,
                  textTransform: "uppercase",
                }}
              >
                JOGADORES
              </Typography>
            </Box>
          </Box>
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
      </>

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
