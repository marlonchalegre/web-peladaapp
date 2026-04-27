import { useEffect, useState } from "react";
import { useParams, Link as RouterLink } from "react-router-dom";
import {
  Container,
  Typography,
  Alert,
  Button,
  Stack,
  Card,
  CardContent,
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import GroupIcon from "@mui/icons-material/Group";
import LockIcon from "@mui/icons-material/Lock";
import axios from "axios";
import { api } from "../../../shared/api/client";
import { type VotingResults, createApi } from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { Loading } from "../../../shared/components/Loading";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";

const endpoints = createApi(api);

export default function PeladaVotingResultsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const peladaId = Number(id);

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
        player_id: i,
        user_id: 0,
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
        player_id: i,
        user_id: 0,
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
        player_id: i + 10,
        user_id: 0,
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
        player_id: i,
        name: "Voter Name",
        has_voted: i < 5,
      })),
    organization_id: 0,
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
          PaperProps={{
            sx: { borderRadius: 4, p: 2, maxWidth: "400px" },
          }}
        >
          <DialogTitle id="restricted-results-title" textAlign="center">
            <LockIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h5" component="div" fontWeight="bold">
              {t("common.actions.view", "Resultados Restritos")}
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1" textAlign="center" sx={{ mb: 2 }}>
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
              label: t("peladas.detail.title", { id: peladaId }),
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
        <Typography variant="h3" fontWeight="bold">
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
                  <Typography variant="h4" component="div" fontWeight="bold">
                    {participationRate}%
                  </Typography>
                </Box>
              </Box>
              <Typography variant="h6" fontWeight="bold">
                {t("peladas.voting.results.participation")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {displayResults!.total_voted} {t("common.of")}{" "}
                {displayResults!.total_eligible}{" "}
                {t("peladas.voting.results.players_voted")}
              </Typography>
            </Paper>
          </Grid>

          {/* MVP Podium */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper
              variant="outlined"
              sx={{ p: 3, borderRadius: 4, height: "100%" }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
              >
                <EmojiEventsIcon color="primary" fontSize="large" />
                <Typography variant="h5" fontWeight="bold">
                  {t("peladas.voting.results.mvp_title")}
                </Typography>
              </Box>

              <Grid container spacing={2} alignItems="flex-end">
                {/* 2nd Place */}
                <Grid size={{ xs: 4 }}>
                  {displayResults!.mvp[1] && (
                    <Box sx={{ textAlign: "center" }}>
                      <SecureAvatar
                        userId={displayResults!.mvp[1].user_id || 0}
                        filename={displayResults!.mvp[1].avatar_filename}
                        sx={{
                          bgcolor: "grey.400",
                          width: 56,
                          height: 56,
                          mx: "auto",
                          mb: 1,
                        }}
                        fallbackText={displayResults!.mvp[1].name.charAt(0)}
                      />
                      <Typography variant="subtitle2" fontWeight="bold" noWrap>
                        {displayResults!.mvp[1].name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {displayResults!.mvp[1].average_stars.toFixed(1)} ★
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: "grey.100",
                          height: 60,
                          mt: 1,
                          borderRadius: "8px 8px 0 0",
                        }}
                      />
                    </Box>
                  )}
                </Grid>

                {/* 1st Place */}
                <Grid size={{ xs: 4 }}>
                  {displayResults!.mvp[0] && (
                    <Box sx={{ textAlign: "center" }}>
                      <EmojiEventsIcon
                        sx={{ color: "gold", fontSize: 40, mb: 1 }}
                      />
                      <SecureAvatar
                        userId={displayResults!.mvp[0].user_id || 0}
                        filename={displayResults!.mvp[0].avatar_filename}
                        sx={{
                          bgcolor: "gold",
                          width: 80,
                          height: 80,
                          mx: "auto",
                          mb: 1,
                          border: "4px solid gold",
                        }}
                        fallbackText={displayResults!.mvp[0].name.charAt(0)}
                      />
                      <Typography variant="h6" fontWeight="bold" noWrap>
                        {displayResults!.mvp[0].name}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        color="primary"
                        fontWeight="bold"
                      >
                        {displayResults!.mvp[0].average_stars.toFixed(1)} ★
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: "gold",
                          height: 100,
                          mt: 1,
                          borderRadius: "8px 8px 0 0",
                          opacity: 0.8,
                        }}
                      />
                    </Box>
                  )}
                </Grid>

                {/* 3rd Place */}
                <Grid size={{ xs: 4 }}>
                  {displayResults!.mvp[2] && (
                    <Box sx={{ textAlign: "center" }}>
                      <SecureAvatar
                        userId={displayResults!.mvp[2].user_id || 0}
                        filename={displayResults!.mvp[2].avatar_filename}
                        sx={{
                          bgcolor: "brown",
                          width: 56,
                          height: 56,
                          mx: "auto",
                          mb: 1,
                        }}
                        fallbackText={displayResults!.mvp[2].name.charAt(0)}
                      />
                      <Typography variant="subtitle2" fontWeight="bold" noWrap>
                        {displayResults!.mvp[2].name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {displayResults!.mvp[2].average_stars.toFixed(1)} ★
                      </Typography>
                      <Box
                        sx={{
                          bgcolor: "grey.100",
                          height: 40,
                          mt: 1,
                          borderRadius: "8px 8px 0 0",
                        }}
                      />
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Special Awards */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <SportsSoccerIcon color="error" />
                  <Typography variant="h6" fontWeight="bold">
                    {t("peladas.voting.results.top_scorer")}
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {displayResults!.striker.slice(0, 3).map((s, i) => (
                    <Box
                      key={s.player_id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Typography fontWeight="bold" color="text.secondary">
                          {i + 1}º
                        </Typography>
                        <Typography fontWeight="medium">{s.name}</Typography>
                      </Box>
                      <Chip
                        label={`${s.goals} Gols`}
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    </Box>
                  ))}
                  {displayResults!.striker.length === 0 && (
                    <Typography color="text.secondary">
                      {t("peladas.voting.results.no_awards")}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined" sx={{ borderRadius: 4 }}>
              <CardContent>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <RestaurantIcon color="info" />
                  <Typography variant="h6" fontWeight="bold">
                    {t("peladas.voting.results.top_assists")}
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {displayResults!.garcom.slice(0, 3).map((g, i) => (
                    <Box
                      key={g.player_id}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Typography fontWeight="bold" color="text.secondary">
                          {i + 1}º
                        </Typography>
                        <Typography fontWeight="medium">{g.name}</Typography>
                      </Box>
                      <Chip
                        label={`${g.assists} Assis.`}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    </Box>
                  ))}
                  {displayResults!.garcom.length === 0 && (
                    <Typography color="text.secondary">
                      {t("peladas.voting.results.no_awards")}
                    </Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Full Ranking Table */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, mt: 2 }}>
              {t("peladas.voting.results.full_ranking")}
            </Typography>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 4 }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "grey.50" }}>
                    <TableCell width={60} sx={{ fontWeight: "bold" }}>
                      Pos.
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Jogador</TableCell>
                    <TableCell sx={{ fontWeight: "bold" }}>Posição</TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>
                      Avaliação
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>
                      Gols
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: "bold" }}>
                      Assis.
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayResults!.mvp.map((p, i) => {
                    const positionKey = p.position
                      ? `common.positions.${p.position.toLowerCase()}`
                      : "common.positions.unknown";

                    return (
                      <TableRow key={p.player_id} hover>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          {i + 1}º
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          {p.name}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t(positionKey)}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem" }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 0.5,
                            }}
                          >
                            <Typography fontWeight="bold" color="primary">
                              {p.average_stars.toFixed(1)}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              ★
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="center">{p.goals}</TableCell>
                        <TableCell align="center">{p.assists}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>

          {/* Voter Transparency */}
          <Grid size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
              >
                <GroupIcon color="action" />
                <Typography variant="h6" fontWeight="bold">
                  {t("peladas.voting.results.voter_transparency")}
                </Typography>
              </Box>
              <Grid container spacing={2}>
                {displayResults!.voters.map((v) => (
                  <Grid size={{ xs: 6, sm: 4, md: 3 }} key={v.player_id}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {v.has_voted ? (
                        <Chip
                          label={v.name}
                          color="success"
                          size="small"
                          icon={<SportsSoccerIcon />}
                          sx={{ width: "100%", justifyContent: "flex-start" }}
                        />
                      ) : (
                        <Chip
                          label={v.name}
                          variant="outlined"
                          size="small"
                          sx={{
                            width: "100%",
                            justifyContent: "flex-start",
                            color: "text.secondary",
                            borderStyle: "dashed",
                          }}
                        />
                      )}
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
