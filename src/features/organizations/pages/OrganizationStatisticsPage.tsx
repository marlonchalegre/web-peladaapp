import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Container, Alert, Box, useMediaQuery, useTheme } from "@mui/material";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { useOrganizationStatistics } from "../hooks/useOrganizationStatistics";
import { useAuth } from "../../../app/providers/AuthContext";
import ImportStatsDialog from "../components/ImportStatsDialog";
import ExportStatsDialog from "../components/ExportStatsDialog";
import OrganizationStatisticsDesktopView from "../components/OrganizationStatisticsDesktopView";
import OrganizationStatisticsMobileView from "../components/OrganizationStatisticsMobileView";
import { api } from "../../../shared/api/client";
import { createApi, type WeeklyPresence } from "../../../shared/api/endpoints";

const endpoints = createApi(api);

export default function OrganizationStatisticsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const orgId = id!;
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const { user } = useAuth();

  const {
    org,
    year,
    setYear,
    error,
    stats,
    sortedStats,
    players,
    handleImport,
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
    <Box sx={{ width: "100%", bgcolor: "#f6f4ee", minHeight: "100vh" }}>
      <OrganizationStatisticsMobileView
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
