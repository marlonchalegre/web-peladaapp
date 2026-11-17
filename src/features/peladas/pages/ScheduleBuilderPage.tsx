import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Stack,
  Divider,
  Select,
  MenuItem as MuiMenuItem,
  FormControl,
  Card,
  CardContent,
  Tooltip,
  Chip,
} from "@mui/material";

import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";
import PeladaTabsBar from "../components/PeladaTabsBar";
import PeladaFormatSelector from "../components/PeladaFormatSelector";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Team,
  type PeladaFormat,
  type PeladaFormatConfig,
} from "../../../shared/api/endpoints";
import { DEFAULT_PELADA_FORMAT_CONFIG } from "../../../shared/api/types";

const endpoints = createApi(api);

interface PlannedMatch {
  home: string;
  away: string;
  stage?: string;
}

export default function ScheduleBuilderPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const peladaId = id!;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<PlannedMatch[]>([]);
  const [matchesPerTeam, setMatchesPerTeam] = useState<number>(2);
  const [format, setFormat] = useState<PeladaFormat>("round_robin");
  const [formatConfig, setFormatConfig] = useState<PeladaFormatConfig>(
    DEFAULT_PELADA_FORMAT_CONFIG,
  );
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await endpoints.getPeladaFullDetails(peladaId);
      setTeams(data.teams);
      setOrganizationId(data.pelada.organization_id);

      const savedFormat = (data.pelada.format as PeladaFormat) || "round_robin";
      setFormat(savedFormat);
      const savedConfig = data.pelada.format_config || {};
      setFormatConfig((prev) => ({ ...prev, ...savedConfig }));

      const currentMatchesPerTeam = savedConfig.matches_per_team || 2;
      setMatchesPerTeam(currentMatchesPerTeam);

      if (data.teams.length >= 2) {
        if (data.pelada.has_schedule_plan) {
          const plan = await endpoints.getSchedulePlan(peladaId);
          setMatches(plan);
          if (!savedConfig.matches_per_team) {
            const calculated = Math.round(
              (plan.length * 2) / data.teams.length,
            );
            if (Number.isFinite(calculated) && calculated >= 1) {
              setMatchesPerTeam(calculated);
            }
          }
        } else {
          // Fetch algorithmic default
          const preview = await endpoints.getSchedulePreview(
            peladaId,
            currentMatchesPerTeam,
            savedFormat,
          );
          setMatches(preview.matches);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("peladas.detail.schedule.error.load_failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [peladaId, t]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleFetchOptions = async (
    newVal?: number,
    newFormat?: PeladaFormat,
  ) => {
    const val = newVal ?? matchesPerTeam;
    const fmt = newFormat ?? format;
    if (teams.length < 2) return;
    try {
      setLoading(true);
      const preview = await endpoints.getSchedulePreview(peladaId, val, fmt);
      setMatches(preview.matches);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("peladas.detail.schedule.error.preview_failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormatChange = (newFormat: PeladaFormat) => {
    setFormat(newFormat);
    handleFetchOptions(matchesPerTeam, newFormat);
  };

  const handleResetToDefault = () => {
    handleFetchOptions(matchesPerTeam, format);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newMatches = [...matches];
    const temp = newMatches[index];
    newMatches[index] = newMatches[index - 1];
    newMatches[index - 1] = temp;
    setMatches(newMatches);
  };

  const handleMoveDown = (index: number) => {
    if (index === matches.length - 1) return;
    const newMatches = [...matches];
    const temp = newMatches[index];
    newMatches[index] = newMatches[index + 1];
    newMatches[index + 1] = temp;
    setMatches(newMatches);
  };

  const handleSwap = (index: number) => {
    const newMatches = [...matches];
    const m = newMatches[index];
    newMatches[index] = { ...m, home: m.away, away: m.home };
    setMatches(newMatches);
  };

  const handleUpdateMatch = (
    index: number,
    field: "home" | "away",
    teamId: string,
  ) => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], [field]: teamId };
    setMatches(newMatches);
  };

  const handleAddMatch = () => {
    if (teams.length < 2) return;
    const defaultStage =
      format === "championship_final" || format === "championship_semis_final"
        ? "group"
        : "regular";
    setMatches([
      ...matches,
      { home: teams[0].id, away: teams[1].id, stage: defaultStage },
    ]);
  };

  const handleRemoveMatch = (index: number) => {
    const newMatches = matches.filter((_, i) => i !== index);
    setMatches(newMatches);
  };

  const handleSave = async () => {
    const hasInvalidMatches = matches.some((m) => m.home === m.away);
    if (hasInvalidMatches) {
      setError(t("peladas.detail.schedule.error.same_team"));
      return;
    }

    try {
      setSaving(true);
      await endpoints.saveSchedulePlan(peladaId, matches, {
        format,
        format_config: {
          ...formatConfig,
          matches_per_team: matchesPerTeam,
        },
      });
      navigate(`/peladas/${peladaId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t("peladas.detail.schedule.error.save_failed");
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const isScheduleValid =
    matches.length > 0 && matches.every((m) => m.home !== m.away);

  if (loading && teams.length === 0) return <Loading />;

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <PeladaTabsBar peladaId={peladaId} status="open" active="matches" />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <BreadcrumbNav
            items={[
              {
                label: t("common.organization"),
                path: `/organizations/${organizationId}`,
              },
              {
                label: t("peladas.detail.title"),
                path: `/peladas/${peladaId}`,
              },
              { label: t("peladas.detail.button.build_schedule") },
            ]}
          />

          <Stack
            direction="row"
            sx={{
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                }}
              >
                {t("peladas.detail.button.build_schedule")}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "text.secondary",
                }}
              >
                {t("peladas.detail.schedule.subtitle")}
              </Typography>
            </Box>
          </Stack>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {teams.length < 2 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {t("peladas.detail.schedule.warning.not_enough_teams")}
          </Alert>
        )}
        <Card
          sx={{
            mb: 4,
            borderRadius: 3,
            boxShadow: (theme) => theme.customShadows?.card,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <PeladaFormatSelector
              teamCount={teams.length}
              format={format}
              formatConfig={formatConfig}
              matchesPerTeam={matchesPerTeam}
              onFormatChange={handleFormatChange}
              onFormatConfigChange={setFormatConfig}
              onMatchesPerTeamChange={(val) => {
                setMatchesPerTeam(val);
                handleFetchOptions(val, format);
              }}
              disabled={loading || teams.length < 2}
            />

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{
                mt: 2.5,
                alignItems: { xs: "stretch", sm: "center" },
              }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<HistoryIcon />}
                onClick={handleResetToDefault}
                disabled={loading || teams.length < 2}
                sx={{ borderRadius: 2, py: 1, px: 3, fontWeight: "bold" }}
              >
                {t("peladas.detail.schedule.button.use_random")}
              </Button>

              <Box sx={{ flexGrow: 1 }} />

              {format !== "winner_stays_on" && (
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleAddMatch}
                  disabled={loading || teams.length < 2}
                  data-testid="add-match-button"
                  sx={{ borderRadius: 2, fontWeight: "bold" }}
                >
                  {t("peladas.detail.schedule.button.add_match")}
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
        <Box
          sx={{
            mb: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
            }}
          >
            {format === "winner_stays_on"
              ? t(
                  "peladas.formats.wso.opening_match_title",
                  "Partida de Abertura (Quem Ganha Fica)",
                )
              : format === "championship_final" ||
                  format === "championship_semis_final"
                ? t(
                    "peladas.formats.championship.group_stage_title",
                    "1ª Fase — Partidas Classificatórias",
                  )
                : t("peladas.detail.schedule.planned_matches")}
          </Typography>
        </Box>
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Table>
            <TableHead sx={{ bgcolor: "action.hover" }}>
              <TableRow>
                <TableCell
                  width={60}
                  align="center"
                  sx={{ fontWeight: "bold", color: "text.secondary" }}
                >
                  #
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "text.secondary" }}
                >
                  {t("peladas.detail.schedule.home")}
                </TableCell>
                <TableCell width={40} />
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "text.secondary" }}
                >
                  {t("peladas.detail.schedule.away")}
                </TableCell>
                <TableCell
                  align="center"
                  width={180}
                  sx={{ fontWeight: "bold", color: "text.secondary" }}
                >
                  {t("common.actions.title")}
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matches.map((match, index) => {
                const isInvalid = match.home === match.away;
                return (
                  <TableRow
                    key={index}
                    hover
                    sx={isInvalid ? { bgcolor: "error.lighter" } : {}}
                  >
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        color={isInvalid ? "error.main" : "text.secondary"}
                        sx={{
                          fontWeight: "bold",
                        }}
                      >
                        {index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small" error={isInvalid}>
                        <Select
                          value={match.home}
                          onChange={(e) =>
                            handleUpdateMatch(index, "home", e.target.value)
                          }
                          sx={{ borderRadius: 2, bgcolor: "background.paper" }}
                          data-testid={`home-select-${index}`}
                        >
                          {teams.map((t) => (
                            <MuiMenuItem key={t.id} value={t.id}>
                              {t.name}
                            </MuiMenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          bgcolor: isInvalid ? "error.main" : "action.selected",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Typography
                          variant="caption"
                          color={isInvalid ? "white" : "text.secondary"}
                          sx={{
                            fontWeight: "bold",
                          }}
                        >
                          VS
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small" error={isInvalid}>
                        <Select
                          value={match.away}
                          onChange={(e) =>
                            handleUpdateMatch(index, "away", e.target.value)
                          }
                          sx={{ borderRadius: 2, bgcolor: "background.paper" }}
                          data-testid={`away-select-${index}`}
                        >
                          {teams.map((t) => (
                            <MuiMenuItem key={t.id} value={t.id}>
                              {t.name}
                            </MuiMenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        sx={{
                          justifyContent: "center",
                        }}
                      >
                        <Tooltip
                          title={t("peladas.detail.schedule.button.swap")}
                        >
                          <IconButton
                            size="small"
                            onClick={() => handleSwap(index)}
                            sx={{ color: "primary.main" }}
                            data-testid={`swap-button-${index}`}
                          >
                            <SwapHorizIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Divider
                          orientation="vertical"
                          flexItem
                          sx={{ mx: 0.5 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === matches.length - 1}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <Divider
                          orientation="vertical"
                          flexItem
                          sx={{ mx: 0.5 }}
                        />
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveMatch(index)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Knockout / Queue Preview Cards */}
        {(format === "championship_final" ||
          format === "championship_semis_final") && (
          <Paper
            variant="outlined"
            data-testid="championship-bracket-preview"
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 3,
              bgcolor: "action.hover",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", mb: 1.5 }}
            >
              <EmojiEventsIcon color="warning" fontSize="small" />
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                {t(
                  "peladas.formats.championship.knockout_preview_title",
                  "Fase Final (Gerada automaticamente após a 1ª Fase)",
                )}
              </Typography>
            </Stack>
            <Stack spacing={1}>
              {format === "championship_semis_final" && (
                <>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "center" }}
                  >
                    <Chip
                      size="small"
                      label={t("peladas.stages.semifinal_1", "Semifinal 1")}
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      1º Colocado vs 4º Colocado
                    </Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{ alignItems: "center" }}
                  >
                    <Chip
                      size="small"
                      label={t("peladas.stages.semifinal_2", "Semifinal 2")}
                      color="primary"
                      variant="outlined"
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      2º Colocado vs 3º Colocado
                    </Typography>
                  </Stack>
                  {formatConfig.include_third_place && (
                    <Stack
                      direction="row"
                      spacing={1.5}
                      sx={{ alignItems: "center" }}
                    >
                      <Chip
                        size="small"
                        label={t(
                          "peladas.stages.third_place",
                          "Disputa de 3º Lugar",
                        )}
                        variant="outlined"
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Perdedor SF1 vs Perdedor SF2
                      </Typography>
                    </Stack>
                  )}
                </>
              )}
              <Stack
                direction="row"
                spacing={1.5}
                sx={{ alignItems: "center" }}
              >
                <Chip
                  size="small"
                  label={t("peladas.stages.final", "GRANDE FINAL 🏆")}
                  color="warning"
                />
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {format === "championship_semis_final"
                    ? "Vencedor SF1 vs Vencedor SF2"
                    : "1º Colocado vs 2º Colocado"}
                </Typography>
              </Stack>
            </Stack>
          </Paper>
        )}

        {format === "winner_stays_on" && teams.length > 2 && (
          <Paper
            variant="outlined"
            data-testid="winner-stays-on-queue-preview"
            sx={{
              mt: 3,
              p: 2.5,
              borderRadius: 3,
              bgcolor: "action.hover",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1 }}>
              {t(
                "peladas.formats.wso.initial_queue_title",
                "Fila de Espera Inicial (Próximos Desafiantes)",
              )}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              sx={{ flexWrap: "wrap", gap: 1 }}
            >
              {teams
                .filter(
                  (team) =>
                    !matches[0] ||
                    (team.id !== matches[0].home &&
                      team.id !== matches[0].away),
                )
                .map((team, idx) => (
                  <Chip
                    key={team.id}
                    label={`${idx + 1}º na fila: ${team.name}`}
                    variant="outlined"
                    color="primary"
                  />
                ))}
            </Stack>
          </Paper>
        )}

        <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="contained"
            size="large"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving || !isScheduleValid}
            data-testid="save-schedule-button"
            sx={{
              borderRadius: 3,
              px: 6,
              py: 1.5,
              fontWeight: "bold",
              fontSize: "1.1rem",
              boxShadow: (theme) => theme.customShadows?.card,
            }}
          >
            {saving
              ? t("common.actions.using")
              : t("peladas.detail.schedule.button.use")}
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
