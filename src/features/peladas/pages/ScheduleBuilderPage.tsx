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
  InputLabel,
  Card,
  CardContent,
  Tooltip,
} from "@mui/material";

import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import BreadcrumbNav from "../../../shared/components/BreadcrumbNav";
import { api } from "../../../shared/api/client";
import { createApi, type Team } from "../../../shared/api/endpoints";

const endpoints = createApi(api);

interface PlannedMatch {
  home: number;
  away: number;
}

export default function ScheduleBuilderPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const peladaId = Number(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<PlannedMatch[]>([]);
  const [matchesPerTeam, setMatchesPerTeam] = useState<number>(2);
  const [organizationId, setOrganizationId] = useState<number | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await endpoints.getPeladaFullDetails(peladaId);
      setTeams(data.teams);
      setOrganizationId(data.pelada.organization_id);

      const currentMatchesPerTeam = 2;
      setMatchesPerTeam(currentMatchesPerTeam);

      if (data.teams.length >= 2) {
        // Always fetch algorithmic default
        const preview = await endpoints.getSchedulePreview(
          peladaId,
          currentMatchesPerTeam,
        );
        setMatches(preview.matches);
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

  const handleFetchOptions = async (newVal?: number) => {
    const val = newVal ?? matchesPerTeam;
    try {
      setLoading(true);
      const preview = await endpoints.getSchedulePreview(peladaId, val);
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

  const handleResetToDefault = async () => {
    try {
      setLoading(true);
      const preview = await endpoints.getSchedulePreview(
        peladaId,
        matchesPerTeam,
      );
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
    newMatches[index] = { home: m.away, away: m.home };
    setMatches(newMatches);
  };

  const handleUpdateMatch = (
    index: number,
    field: "home" | "away",
    teamId: number,
  ) => {
    const newMatches = [...matches];
    newMatches[index] = { ...newMatches[index], [field]: teamId };
    setMatches(newMatches);
  };

  const handleAddMatch = () => {
    if (teams.length < 2) return;
    setMatches([...matches, { home: teams[0].id, away: teams[1].id }]);
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
      await endpoints.saveSchedulePlan(peladaId, matches);
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <BreadcrumbNav
          items={[
            {
              label: t("common.organization"),
              path: `/organizations/${organizationId}`,
            },
            {
              label: t("peladas.detail.title", { id: peladaId }),
              path: `/peladas/${peladaId}`,
            },
            { label: t("peladas.detail.button.build_schedule") },
          ]}
        />

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {t("peladas.detail.button.build_schedule")}
            </Typography>
            <Typography variant="body1" color="text.secondary">
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
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={3}
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <FormControl sx={{ minWidth: 200 }} size="small">
              <InputLabel id="matches-per-team-label">
                {t("peladas.detail.schedule.matches_per_team_label")}
              </InputLabel>
              <Select
                labelId="matches-per-team-label"
                value={matchesPerTeam}
                label={t("peladas.detail.schedule.matches_per_team_label")}
                data-testid="matches-per-team-select"
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setMatchesPerTeam(val);
                  handleFetchOptions(val);
                }}
                disabled={loading || teams.length < 2}
              >
                {[1, 2, 3, 4, 5, 6].map((v) => (
                  <MuiMenuItem key={v} value={v}>
                    {v}{" "}
                    {v === 1
                      ? t("peladas.detail.schedule.match")
                      : t("peladas.detail.schedule.match") + "s"}
                  </MuiMenuItem>
                ))}
              </Select>
            </FormControl>

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
        <Typography variant="h6" fontWeight="bold">
          {t("peladas.detail.schedule.planned_matches")}
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
                      fontWeight="bold"
                      color={isInvalid ? "error.main" : "text.secondary"}
                    >
                      {index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <FormControl fullWidth size="small" error={isInvalid}>
                      <Select
                        value={match.home}
                        onChange={(e) =>
                          handleUpdateMatch(
                            index,
                            "home",
                            Number(e.target.value),
                          )
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
                        fontWeight="bold"
                        color={isInvalid ? "white" : "text.secondary"}
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
                          handleUpdateMatch(
                            index,
                            "away",
                            Number(e.target.value),
                          )
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
                      justifyContent="center"
                    >
                      <Tooltip title={t("peladas.detail.schedule.button.swap")}>
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
            boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
          }}
        >
          {saving
            ? t("common.actions.using")
            : t("peladas.detail.schedule.button.use")}
        </Button>
      </Box>
    </Container>
  );
}
