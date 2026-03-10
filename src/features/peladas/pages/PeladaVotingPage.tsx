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
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import AssessmentIcon from "@mui/icons-material/Assessment";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

        const [info, status] = await Promise.all([
          endpoints.getVotingInfo(peladaId),
          endpoints.getVotingStatus(peladaId),
        ]);

        setVotingInfo(info);
        setVotingStatus(status);

        if (!info.can_vote) {
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

  const allVotesComplete =
    playerVotes.length > 0 && playerVotes.every((pv) => pv.stars !== null);

  const handleSubmit = async () => {
    if (!allVotesComplete || !votingInfo?.voter_player_id) return;

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const votes = playerVotes.map((pv) => ({
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
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          onClick={() => navigate(`/peladas/${peladaId}`)}
          sx={{ mt: 2 }}
        >
          {t("peladas.voting.button.back_to_pelada")}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" data-testid="voting-page-container">
      <Box sx={{ mt: 2, mb: 2 }}>
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
            startIcon={<SportsSoccerIcon />}
            component={RouterLink}
            to={`/peladas/${peladaId}/matches`}
            size="small"
          >
            {t("peladas.detail.button.view_matches")}
          </Button>
          {!votingInfo?.can_vote && (
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              component={RouterLink}
              to={`/peladas/${peladaId}/results`}
              size="small"
            >
              {t("peladas.voting.button.view_results")}
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
            {t("peladas.voting.info.instructions")}
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
                  sx={{ borderRadius: 2 }}
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
                          <Typography variant="h6" fontWeight="bold">
                            {pv.playerName}
                          </Typography>
                          <Chip
                            label={t(positionKey)}
                            size="small"
                            variant="outlined"
                            color="primary"
                            sx={{ fontSize: "0.7rem", fontWeight: "bold" }}
                          />
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
                            data-testid={`rating-${pv.playerId}`}
                          />
                          {pv.stars !== null && (
                            <Typography
                              variant="caption"
                              color="primary"
                              fontWeight="bold"
                              sx={{ mt: 0.5 }}
                            >
                              {pv.stars} {t("peladas.voting.stars")}
                            </Typography>
                          )}
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
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={!allVotesComplete || submitting}
              data-testid="submit-votes-button"
              fullWidth
              sx={{ fontWeight: "bold" }}
            >
              {submitting
                ? t("common.sending")
                : t("peladas.voting.button.save")}
            </Button>
          </Stack>

          {!allVotesComplete && playerVotes.length > 0 && (
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
    </Container>
  );
}
