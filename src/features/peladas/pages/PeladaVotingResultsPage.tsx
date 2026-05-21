import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Alert,
  Button,
  Box,
  Grid,
  Paper,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import LockIcon from "@mui/icons-material/Lock";
import axios from "axios";
import { api } from "../../../shared/api/client";
import { type VotingResults, createApi } from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";

import MvpPodium from "./voting/MvpPodium";
import SpecialAwards from "./voting/SpecialAwards";
import FullRankingTable from "./voting/FullRankingTable";
import VoterTransparency from "./voting/VoterTransparency";

const endpoints = createApi(api);

export default function PeladaVotingResultsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const peladaId = id!;

  const [results, setResults] = useState<VotingResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);

  useEffect(() => {
    if (!peladaId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const data = await endpoints.getVotingResults(peladaId);
        setResults(data);
        setIsRestricted(false);
      } catch (error: unknown) {
        let message = t("peladas.voting.results.error.load_failed");
        if (axios.isAxiosError(error) && error.response?.status === 400) {
          message = t("peladas.voting.results.error.still_voting");
          setError(message);
        } else if (
          axios.isAxiosError(error) &&
          error.response?.status === 403
        ) {
          setIsRestricted(true);
          setError(null);
        } else {
          if (error instanceof Error) {
            message = error.message;
          }
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [peladaId, t]);

  // Dummy data for the blurred background when restricted
  const dummyResults: VotingResults = {
    mvp: Array(10)
      .fill(null)
      .map((_, i) => ({
        player_id: String(i),
        user_id: String(0),
        name: "Player Name",
        average_stars: 4.5 - i * 0.2,
        position: "Midfielder",
        goals: Math.max(0, 3 - i),
        assists: Math.max(0, 2 - i),
        own_goals: 0,
        avatar_filename: null,
      })),
    striker: Array(3)
      .fill(null)
      .map((_, i) => ({
        player_id: String(i),
        user_id: "0",
        name: "Striker Name",
        goals: 3 - i,
        average_stars: 4.0,
        assists: 0,
        own_goals: 0,
        avatar_filename: null,
      })),
    garcom: Array(3)
      .fill(null)
      .map((_, i) => ({
        player_id: String(i + 10),
        user_id: "0",
        name: "Assister Name",
        assists: 3 - i,
        average_stars: 4.0,
        goals: 0,
        own_goals: 0,
        avatar_filename: null,
      })),
    total_voted: 5,
    total_eligible: 10,
    voters: Array(10)
      .fill(null)
      .map((_, i) => ({
        player_id: String(i),
        name: "Voter Name",
        has_voted: i < 5,
      })),
    organization_id: "0",
    organization_name: "Organization Name",
  };

  const displayResults = isRestricted ? dummyResults : results;

  if (loading) {
    return <Loading message={t("common.loading")} />;
  }

  if (error || (!displayResults && !isRestricted)) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}
        disableGutters
      >
        <Alert severity="error" sx={{ mt: 2, mb: 2, mx: { xs: 1.5, sm: 0 } }}>
          {error || t("peladas.voting.results.error.not_found")}
        </Alert>
        <Box sx={{ display: "flex", gap: 2, px: { xs: 1.5, sm: 0 } }}>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/peladas/${peladaId}`}
            sx={{
              minWidth: { xs: "40px", sm: "auto" },
              px: { xs: 0, sm: 2 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textTransform: "none",
            }}
          >
            <ArrowBackIcon sx={{ mr: { xs: 0, sm: 1 } }} />
            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline" } }}
            >
              {t("peladas.voting.button.back_to_pelada")}
            </Box>
          </Button>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/peladas/${peladaId}/matches`}
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
        </Box>
      </Container>
    );
  }

  const participationRate = Math.round(
    (displayResults!.total_voted / displayResults!.total_eligible) * 100,
  );

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}
      disableGutters
    >
      {isRestricted && (
        <Dialog
          open={true}
          aria-labelledby="restricted-results-title"
          slotProps={{
            paper: {
              sx: { borderRadius: 4, p: 2, maxWidth: "400px" },
            },
          }}
        >
          <DialogTitle id="restricted-results-title" align="center">
            <LockIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
            <Typography
              variant="h5"
              component="div"
              sx={{
                fontWeight: "bold",
              }}
            >
              {t("common.actions.view", "Resultados Restritos")}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" align="center" sx={{ mb: 2 }}>
              {t(
                "peladas.voting.results.error.not_voted",
                "Você participou desta pelada mas não votou. Por isso, você não tem acesso aos resultados.",
              )}
            </Typography>
          </DialogContent>
          <DialogActions
            sx={{
              flexDirection: "column",
              gap: 1,
              px: 3,
              pb: 3,
            }}
          >
            <Button
              variant="contained"
              fullWidth
              component={RouterLink}
              to={`/peladas/${peladaId}`}
              sx={{ borderRadius: 2, py: 1.5 }}
            >
              {t("common.back", "Voltar")}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      <Box
        sx={{
          mt: 2,
          mb: 2,
          px: { xs: 1.5, sm: 0 },
          filter: isRestricted ? "blur(12px)" : "none",
          pointerEvents: isRestricted ? "none" : "auto",
          transition: "filter 0.3s ease",
        }}
      >
        <BreadcrumbNav
          items={[
            {
              label:
                displayResults!.organization_name || t("common.organization"),
              path: displayResults!.organization_id
                ? `/organizations/${displayResults!.organization_id}`
                : "/home",
            },
            {
              label: t("peladas.detail.title"),
              path: `/peladas/${peladaId}`,
            },
            { label: t("peladas.voting.results.title") },
          ]}
        />
      </Box>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mt: 4,
          mb: 4,
          px: { xs: 1.5, sm: 0 },
          filter: isRestricted ? "blur(12px)" : "none",
          pointerEvents: isRestricted ? "none" : "auto",
        }}
      >
        <Typography
          variant="h3"
          sx={{
            fontWeight: "bold",
          }}
        >
          {t("peladas.voting.results.hero_title")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/peladas/${peladaId}/matches`}
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
        </Box>
      </Box>

      <Box
        sx={{
          px: { xs: 1.5, sm: 0 },
          filter: isRestricted ? "blur(12px)" : "none",
          pointerEvents: isRestricted ? "none" : "auto",
          userSelect: isRestricted ? "none" : "auto",
        }}
      >
        <Grid container spacing={4}>
          {/* Participation Card */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                borderRadius: 4,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
                <CircularProgress
                  variant="determinate"
                  value={participationRate}
                  size={120}
                  thickness={5}
                  color={participationRate > 70 ? "success" : "warning"}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: "absolute",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Typography
                    variant="h4"
                    component="div"
                    sx={{
                      fontWeight: "bold",
                    }}
                  >
                    {participationRate}%
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                }}
              >
                {t("peladas.voting.results.participation")}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                }}
              >
                {displayResults!.total_voted} {t("common.of")}{" "}
                {displayResults!.total_eligible}{" "}
                {t("peladas.voting.results.players_voted")}
              </Typography>
            </Paper>
          </Grid>

          {/* MVP Podium */}
          <Grid size={{ xs: 12, md: 8 }}>
            <MvpPodium mvp={displayResults!.mvp} />
          </Grid>

          {/* Special Awards */}
          <SpecialAwards
            striker={displayResults!.striker}
            garcom={displayResults!.garcom}
          />

          {/* Full Ranking Table */}
          <FullRankingTable mvp={displayResults!.mvp} />

          {/* Voter Transparency */}
          <VoterTransparency voters={displayResults!.voters} />
        </Grid>
      </Box>
    </Container>
  );
}
