import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Paper,
  Button,
  Box,
  Typography,
  Alert,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ActiveMatchDashboard from "../components/ActiveMatchDashboard";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import { usePeladaMatches } from "../hooks/usePeladaMatches";
import MatchHistoryList from "../components/MatchHistoryList";
import SessionInsights from "../components/SessionInsights";

export default function PeladaMatchesPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const peladaId = Number(id);

  const {
    loading,
    error,
    matches,
    selectedMatchId,
    setSelectedMatchId,
    pelada,
    teamNameById,
    isPeladaClosed,
    closing,
    handleClosePelada,
    // Active Match props
    selectedMatch,
    activeMatchData,
    orgPlayerIdToUserId,
    userIdToName,
    currentMatchStats,
    updatingScore,
    selectMenu,
    setSelectMenu,
    recordEvent,
    deleteEventAndRefresh,
    adjustScore,
    replacePlayerOnMatchTeam,
    addPlayerToTeam,
    endMatch,
    // Insights props
    standings,
    playerStats,
    togglePlayerSort,
  } = usePeladaMatches(peladaId);

  if (loading) return <Loading message={t("peladas.matches.loading")} />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ flexGrow: 1, p: 2 }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <IconButton
            component={RouterLink}
            to={`/peladas/${peladaId}`}
            sx={{ mr: 2 }}
            aria-label={t("common.back")}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {t("peladas.matches.title", { id: peladaId })}
          </Typography>
        </Box>

        <Box>
          {isPeladaClosed ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
              {t("peladas.matches.status.closed")}
            </Typography>
          ) : (
            <Button
              variant="contained"
              color="error"
              onClick={handleClosePelada}
              disabled={closing}
              data-testid="close-pelada-button"
              sx={{ px: 3, borderRadius: 2, fontWeight: "bold" }}
            >
              {closing
                ? t("peladas.matches.button.closing")
                : t("peladas.matches.button.close_pelada")}
            </Button>
          )}
        </Box>
      </Box>

      <Grid
        container
        spacing={3}
        sx={{
          height: { xs: "auto", md: "calc(100vh - 240px)" },
          minHeight: { md: 600 },
        }}
      >
        {/* Left Column: Match History Stream */}
        <Grid
          size={{ xs: 12, md: 2 }}
          sx={{
            height: "100%",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <MatchHistoryList
            matches={matches}
            selectedMatchId={selectedMatchId}
            onSelectMatch={setSelectedMatchId}
            teamNameById={teamNameById}
          />
        </Grid>

        {/* Center Column: Active Match Dashboard */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: "100%" }}>
          {selectedMatch && activeMatchData ? (
            <ActiveMatchDashboard
              match={selectedMatch}
              homeTeamName={
                teamNameById[selectedMatch.home_team_id] ||
                t("peladas.matches.team_fallback", {
                  id: selectedMatch.home_team_id,
                })
              }
              awayTeamName={
                teamNameById[selectedMatch.away_team_id] ||
                t("peladas.matches.team_fallback", {
                  id: selectedMatch.away_team_id,
                })
              }
              homePlayers={activeMatchData.homePlayers}
              awayPlayers={activeMatchData.awayPlayers}
              orgPlayerIdToUserId={orgPlayerIdToUserId}
              userIdToName={userIdToName}
              statsMap={currentMatchStats}
              benchPlayers={activeMatchData.benchPlayers}
              finished={activeMatchData.finished || isPeladaClosed}
              updating={!!updatingScore[selectedMatch.id]}
              selectMenu={selectMenu}
              setSelectMenu={setSelectMenu}
              playersPerTeam={pelada?.players_per_team}
              recordEvent={recordEvent}
              deleteEventAndRefresh={deleteEventAndRefresh}
              adjustScore={adjustScore}
              replacePlayerOnTeam={(teamId, outId, inId) =>
                replacePlayerOnMatchTeam(selectedMatch.id, teamId, outId, inId)
              }
              addPlayerToTeam={(teamId, playerId) =>
                addPlayerToTeam(selectedMatch.id, teamId, playerId)
              }
              onEndMatch={() => endMatch(selectedMatch.id)}
            />
          ) : (
            <Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="h5" color="text.secondary">
                {t("peladas.matches.select_match_hint")}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Right Column: Session Insights */}
        <Grid size={{ xs: 12, md: 4 }} sx={{ height: "100%" }}>
          <SessionInsights
            standings={standings}
            playerStats={playerStats}
            onToggleSort={togglePlayerSort}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
