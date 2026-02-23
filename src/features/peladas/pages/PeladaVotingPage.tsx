import { useEffect, useState } from "react";
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
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { api } from "../../../shared/api/client";
import { createApi, type VotingInfo } from "../../../shared/api/endpoints";
import { useAuth } from "../../../app/providers/AuthContext";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";

const endpoints = createApi(api);

type PlayerVote = {
  playerId: number;
  playerName: string;
  stars: number | null;
};

export default function PeladaVotingPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const peladaId = Number(id);

  const [votingInfo, setVotingInfo] = useState<VotingInfo | null>(null);
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

        // Check if user is authenticated
        if (!user) {
          setError(t("peladas.voting.error.unauthenticated"));
          return;
        }

        // Get voting info in one single request
        const info = await endpoints.getVotingInfo(peladaId);
        setVotingInfo(info);

        if (!info.can_vote) {
          setError(info.message || t("peladas.voting.error.cannot_vote"));
          return;
        }

        // Initialize player votes for eligible players, pre-populating with existing votes if available
        const votes: PlayerVote[] = info.eligible_players.map((p) => {
          const existingVote = info.current_votes?.find(
            (v) => v.target_id === p.player_id,
          );
          return {
            playerId: p.player_id,
            playerName: p.name,
            stars: existingVote ? existingVote.stars : null,
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

      // Redirect to pelada detail page after 2 seconds
      setTimeout(() => {
        navigate(`/peladas/${peladaId}`);
      }, 2000);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : t("peladas.voting.error.save_failed");
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

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
    <Container maxWidth="md">
      <Box sx={{ mt: 2, mb: 2 }}>
        <Button
          component={RouterLink}
          to={`/peladas/${peladaId}`}
          startIcon={<ArrowBackIcon />}
          variant="text"
        >
          {t("peladas.voting.button.back_to_pelada")}
        </Button>
      </Box>
      <Typography variant="h4" gutterBottom sx={{ mt: 3 }}>
        {t("peladas.voting.title", { id: peladaId })}
      </Typography>

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

      <Alert severity="info" sx={{ mb: 3 }}>
        {t("peladas.voting.info.instructions")}
      </Alert>

      <Stack spacing={2} sx={{ mb: 3 }}>
        {playerVotes.map((pv) => (
          <Card
            key={pv.playerId}
            variant="outlined"
            data-testid={`voting-card-${pv.playerId}`}
          >
            <CardContent>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="h6" data-testid="player-name">
                  {pv.playerName}
                </Typography>
                <Box>
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
                      display="block"
                      textAlign="center"
                    >
                      {pv.stars} stars
                    </Typography>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
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
        >
          {submitting ? t("common.sending") : t("peladas.voting.button.save")}
        </Button>
      </Stack>

      {!allVotesComplete && playerVotes.length > 0 && (
        <Alert severity="warning">
          {t("peladas.voting.warning.incomplete")}
        </Alert>
      )}
    </Container>
  );
}
