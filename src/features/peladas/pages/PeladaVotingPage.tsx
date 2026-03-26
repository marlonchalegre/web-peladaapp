import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Alert,
  Button,
  Stack,
  Card,
  CardContent,
  Rating,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Grid,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type VotingInfo,
  type VotingStatus,
} from "../../../shared/api/endpoints";
import { useAuth } from "../../../app/providers/AuthContext";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";

const endpoints = createApi(api);

type PlayerVote = {
  playerId: number;
  playerName: string;
  position?: string;
  stars: number | null;
  goals: number;
  assists: number;
  own_goals: number;
  voting_enabled: boolean;
};

export default function PeladaVotingPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const peladaId = Number(id);

  const [votingInfo, setVotingInfo] = useState<VotingInfo | null>(null);
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [playerVotes, setPlayerVotes] = useState<PlayerVote[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmToggle, setConfirmToggle] = useState<{
    playerId: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!peladaId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          setError(t("peladas.voting.error.unauthenticated"));
          return;
        }

        const [info, status, details] = await Promise.all([
          endpoints.getVotingInfo(peladaId),
          endpoints.getVotingStatus(peladaId),
          endpoints.getPeladaFullDetails(peladaId),
        ]);

        setVotingInfo(info);
        setVotingStatus(status);
        setIsAdmin(details.pelada.is_admin || false);

        if (!info.can_vote && !details.pelada.is_admin) {
          setError(info.message || t("peladas.voting.error.cannot_vote"));
          return;
        }

        const votes: PlayerVote[] = info.eligible_players.map((p) => {
          const existingVote = info.current_votes?.find(
            (v) => v.target_id === p.player_id,
          );
          return {
            playerId: p.player_id,
            playerName: p.name,
            position: p.position,
            stars: existingVote ? existingVote.stars : null,
            goals: p.goals ?? 0,
            assists: p.assists ?? 0,
            own_goals: p.own_goals ?? 0,
            voting_enabled: p.voting_enabled ?? true,
          };
        });
        setPlayerVotes(votes);
      } catch (error: unknown) {
        const message =
          error instanceof Error
            ? error.message
            : t("peladas.voting.error.load_failed");
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [peladaId, user, t]);

  const handleVoteChange = (playerId: number, stars: number | null) => {
    setPlayerVotes((prev) =>
      prev.map((pv) => (pv.playerId === playerId ? { ...pv, stars } : pv)),
    );
  };

  const handleToggleVoting = async (playerId: number, enabled: boolean) => {
    try {
      setSubmitting(true);
      setError(null);
      await endpoints.updateVotingEnabled(peladaId, playerId, enabled);

      // Update playerVotes state - keep in list but update voting_enabled and clear stars if disabled
      setPlayerVotes((prev) =>
        prev.map((pv) =>
          pv.playerId === playerId
            ? {
                ...pv,
                voting_enabled: enabled,
                stars: enabled ? pv.stars : null,
              }
            : pv,
        ),
      );

      // Update votingInfo to reflect the change
      setVotingInfo((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          eligible_players: prev.eligible_players.map((p) =>
            p.player_id === playerId ? { ...p, voting_enabled: enabled } : p,
          ),
        };
      });

      setSuccess(
        enabled
          ? "Player enabled for voting"
          : "Player disabled from voting and previous votes removed",
      );
      setConfirmToggle(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to update voting status";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const allVotesComplete =
    playerVotes.length > 0 &&
    playerVotes
      .filter((pv) => pv.voting_enabled)
      .every((pv) => pv.stars !== null);

  const handleSubmit = async () => {
    if (!allVotesComplete || !votingInfo?.voter_player_id) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const votes = playerVotes
        .filter((pv) => pv.voting_enabled)
        .map((pv) => ({
          target_id: pv.playerId,
          stars: pv.stars as number,
        }));

      await endpoints.batchCastVotes(peladaId, {
        voter_id: votingInfo.voter_player_id,
        votes,
      });

      setSuccess(t("peladas.voting.success.saved"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.voting.error.save_failed");
      setError(message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  const votersByStatus = useMemo(() => {
    if (!votingStatus) return { voted: [], pending: [] };
    return {
      voted: votingStatus.voters.filter((v) => v.has_voted),
      pending: votingStatus.voters.filter((v) => !v.has_voted),
    };
  }, [votingStatus]);

  if (loading) {
    return <Loading message={t("common.loading")} />;
  }

  if (error && !votingInfo) {
    return (
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }} disableGutters>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate(`/peladas/${peladaId}`)}
          sx={{ mt: 2, ml: { xs: 1, sm: 0 } }}
        >
          {t("peladas.voting.button.back_to_pelada")}
        </Button>
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      data-testid="voting-page-container"
      sx={{ py: { xs: 2, sm: 4 }, px: { xs: 0, sm: 2 } }}
      disableGutters
    >
      <Box sx={{ mt: 2, mb: 2, px: { xs: 1.5, sm: 0 } }}>
        <BreadcrumbNav
          items={[
            {
              label: t("common.organization"),
              path: "/organizations",
            },
            {
              label: t("peladas.detail.title", { id: peladaId }),
              path: `/peladas/${peladaId}`,
            },
            { label: t("peladas.detail.button.vote") },
          ]}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 3,
          mb: 2,
        }}
      >
        <Typography variant="h4" fontWeight="bold">
          {t("peladas.voting.title", { id: peladaId })}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/peladas/${peladaId}/matches`}
            size="small"
            sx={{
              minWidth: { xs: "40px", sm: "auto" },
              px: { xs: 0, sm: 2 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textTransform: "none",
            }}
          >
            <SportsSoccerIcon sx={{ mr: { xs: 0, sm: 1 } }} />
            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline" } }}
            >
              {t("peladas.detail.button.view_matches")}
            </Box>
          </Button>
          {!votingInfo?.can_vote && (
            <Button
              variant="outlined"
              component={RouterLink}
              to={`/peladas/${peladaId}/results`}
              size="small"
              sx={{
                minWidth: { xs: "40px", sm: "auto" },
                px: { xs: 0, sm: 2 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textTransform: "none",
              }}
            >
              <AssessmentIcon sx={{ mr: { xs: 0, sm: 1 } }} />
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                {t("peladas.voting.button.view_results")}
              </Box>
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {votingInfo?.has_voted && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("peladas.voting.info.already_voted_view_change")}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            {votingInfo?.can_vote
              ? t("peladas.voting.info.instructions")
              : t("peladas.voting.info.admin_instructions")}
          </Alert>

          <Stack spacing={2} sx={{ mb: 3 }}>
            {playerVotes.map((pv) => {
              const positionKey = pv.position
                ? `common.positions.${pv.position.toLowerCase()}`
                : "common.positions.unknown";

              return (
                <Card
                  key={pv.playerId}
                  variant="outlined"
                  data-testid={`voting-card-${pv.playerId}`}
                  sx={{
                    borderRadius: 2,
                    opacity: pv.voting_enabled ? 1 : 0.6,
                    bgcolor: pv.voting_enabled
                      ? "background.paper"
                      : "action.hover",
                    transition: "all 0.3s ease",
                    border: pv.voting_enabled ? undefined : "1px dashed grey",
                  }}
                >
                  <CardContent>
                    <Grid container alignItems="center" spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={{
                              color: pv.voting_enabled
                                ? "text.primary"
                                : "text.secondary",
                            }}
                          >
                            {pv.playerName}
                          </Typography>
                          <Chip
                            label={t(positionKey)}
                            size="small"
                            variant="outlined"
                            color={pv.voting_enabled ? "primary" : "default"}
                            sx={{ fontSize: "0.7rem", fontWeight: "bold" }}
                          />
                          {!pv.voting_enabled && (
                            <Chip
                              label={t("common.actions.disable")}
                              size="small"
                              color="error"
                              variant="filled"
                              sx={{ fontSize: "0.7rem", fontWeight: "bold" }}
                            />
                          )}
                        </Box>
                        <Stack direction="row" spacing={2}>
                          <Typography variant="body2" color="text.secondary">
                            <strong>{t("common.goals")}:</strong> {pv.goals}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            <strong>{t("common.assists_short")}:</strong>{" "}
                            {pv.assists}
                          </Typography>
                          {pv.own_goals > 0 && (
                            <Typography variant="body2" color="error">
                              <strong>{t("common.own_goals_short")}:</strong>{" "}
                              {pv.own_goals}
                            </Typography>
                          )}
                        </Stack>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: { xs: "flex-start", sm: "flex-end" },
                          }}
                        >
                          <Rating
                            name={`player-${pv.playerId}`}
                            value={pv.stars}
                            onChange={(_, newValue) =>
                              handleVoteChange(pv.playerId, newValue)
                            }
                            size="large"
                            max={5}
                            disabled={
                              !votingInfo?.can_vote || !pv.voting_enabled
                            }
                            data-testid={`rating-${pv.playerId}`}
                          />
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mt: 0.5,
                            }}
                          >
                            {pv.stars !== null && pv.voting_enabled && (
                              <Typography
                                variant="caption"
                                color="primary"
                                fontWeight="bold"
                              >
                                {pv.stars} {t("peladas.voting.stars")}
                              </Typography>
                            )}
                            {isAdmin && (
                              <Button
                                size="small"
                                color={pv.voting_enabled ? "error" : "success"}
                                variant="outlined"
                                startIcon={
                                  pv.voting_enabled ? (
                                    <VisibilityOffIcon />
                                  ) : (
                                    <VisibilityIcon />
                                  )
                                }
                                onClick={() => {
                                  if (pv.voting_enabled) {
                                    setConfirmToggle({
                                      playerId: pv.playerId,
                                      name: pv.playerName,
                                    });
                                  } else {
                                    handleToggleVoting(pv.playerId, true);
                                  }
                                }}
                                sx={{ py: 0, height: 24, fontSize: "0.65rem" }}
                              >
                                {pv.voting_enabled
                                  ? t("common.actions.disable")
                                  : t("common.actions.enable")}
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>

          {playerVotes.length === 0 && (
            <Alert severity="warning">
              {t("peladas.voting.warning.no_eligible_players")}
            </Alert>
          )}

          <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/peladas/${peladaId}`)}
              disabled={submitting}
              fullWidth={!votingInfo?.can_vote}
            >
              {votingInfo?.can_vote ? t("common.cancel") : t("common.back")}
            </Button>
            {votingInfo?.can_vote && (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!allVotesComplete || submitting}
                data-testid="save-votes-button"
                fullWidth
                sx={{ fontWeight: "bold" }}
              >
                {submitting
                  ? t("common.sending")
                  : t("peladas.voting.button.save")}
              </Button>
            )}
          </Stack>

          {!allVotesComplete && playerVotes.length > 0 && votingInfo?.can_vote && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {t("peladas.voting.warning.incomplete")}
            </Alert>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {t("peladas.voting.status.title")}
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight="bold"
                display="block"
                gutterBottom
              >
                {t("peladas.voting.status.voted")} (
                {votersByStatus.voted.length})
              </Typography>
              <List dense>
                {votersByStatus.voted.map((v) => (
                  <ListItem key={v.player_id} sx={{ px: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={v.name} />
                  </ListItem>
                ))}
                {votersByStatus.voted.length === 0 && (
                  <Typography variant="caption" sx={{ px: 1, py: 1 }}>
                    {t("peladas.voting.status.none")}
                  </Typography>
                )}
              </List>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight="bold"
                display="block"
                gutterBottom
              >
                {t("peladas.voting.status.pending")} (
                {votersByStatus.pending.length})
              </Typography>
              <List dense>
                {votersByStatus.pending.map((v) => (
                  <ListItem key={v.player_id} sx={{ px: 1 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <PendingIcon color="action" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={v.name}
                      primaryTypographyProps={{ color: "text.secondary" }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccess(null)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {success}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error && !!votingInfo}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>

      <Dialog
        open={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        aria-labelledby="confirm-disable-title"
        aria-describedby="confirm-disable-description"
      >
        <DialogTitle id="confirm-disable-title">
          {t("common.actions.disable")} {confirmToggle?.name}?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-disable-description">
            Tem certeza que deseja desativar a votação para este jogador?
            <Box
              component="span"
              sx={{
                display: "block",
                mt: 1,
                fontWeight: "bold",
                color: "error.main",
              }}
            >
              Todos os votos já recebidos por este jogador serão descartados.
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmToggle(null)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={() =>
              confirmToggle && handleToggleVoting(confirmToggle.playerId, false)
            }
            color="error"
            variant="contained"
            autoFocus
          >
            {t("common.actions.disable")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
