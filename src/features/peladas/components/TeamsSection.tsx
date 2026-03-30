import {
  Button,
  Typography,
  Stack,
  Box,
  CircularProgress,
  TextField,
  InputAdornment,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import GroupsIcon from "@mui/icons-material/Groups";
import PersonIcon from "@mui/icons-material/Person";
import type { DragEvent } from "react";
import type {
  Player,
  Team,
  User,
  Transaction,
  OrganizationFinance,
} from "../../../shared/api/endpoints";
import TeamCard from "./TeamCard";
import { useTranslation } from "react-i18next";

type PlayerWithUser = Player & { user: User; is_goalkeeper?: boolean };

export type TeamsSectionProps = {
  teams: Team[];
  teamPlayers: Record<number, PlayerWithUser[]>;
  playersPerTeam?: number | null;
  creatingTeam: boolean;
  locked?: boolean;
  onCreateTeam: (name: string) => Promise<void>;
  onDeleteTeam: (teamId: number) => Promise<void>;
  onDragStartPlayer: (
    e: DragEvent<HTMLElement>,
    playerId: number,
    sourceTeamId: number | null,
  ) => void;
  dropToTeam: (
    e: DragEvent<HTMLElement>,
    targetTeamId: number,
  ) => Promise<void>;
  onSetGoalkeeper: (teamId: number, playerId: number) => Promise<void>;
  onRemovePlayer: (teamId: number, playerId: number) => Promise<void>;
  onRandomizeTeams: () => Promise<void>;
  onUpdatePlayersPerTeam?: (count: number) => Promise<void>;
  scores: Record<number, number>;
  isAdminOverride?: boolean;
  peladaTransactions?: Transaction[];
  organizationFinance?: OrganizationFinance;
  onMarkPaid?: (playerId: number, amount: number) => void;
  onReversePayment?: (playerId: number) => void;
};
export default function TeamsSection(props: TeamsSectionProps) {
  const { t } = useTranslation();
  const {
    teams,
    teamPlayers,
    playersPerTeam,
    creatingTeam,
    locked,
    onCreateTeam,
    onDeleteTeam,
    onDragStartPlayer,
    dropToTeam,
    onSetGoalkeeper,
    onRemovePlayer,
    onRandomizeTeams,
    onUpdatePlayersPerTeam,
    scores,
    isAdminOverride,
    peladaTransactions = [],
    organizationFinance,
    onMarkPaid,
    onReversePayment,
  } = props;

  return (
    <section>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          mb: 4,
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
            }}
          >
            <GroupsIcon fontSize="small" />
          </Box>
          <Typography
            variant="h5"
            sx={{ fontWeight: 800, letterSpacing: -0.5 }}
          >
            {t("peladas.teams.title")}
          </Typography>
        </Stack>

        {!locked && isAdminOverride && (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              type="number"
              label={t("organizations.form.pelada.players_per_team")}
              value={playersPerTeam ?? 5}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val > 0) {
                  onUpdatePlayersPerTeam?.(val);
                }
              }}
              sx={{
                width: { xs: "100%", sm: 160 },
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              inputProps={{ min: 1 }}
              data-testid="players-per-team-input"
            />

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                onClick={async () => {
                  await onRandomizeTeams();
                }}
                disabled={creatingTeam}
                data-testid="randomize-teams-button"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: "bold",
                  flex: 1,
                  minWidth: { xs: "40px", sm: "auto" },
                  px: { xs: 1.5, md: 2 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ShuffleIcon sx={{ mr: { xs: 0, md: 1 } }} />
                <Box
                  component="span"
                  sx={{ display: { xs: "none", md: "inline" } }}
                >
                  {t("peladas.teams.button.randomize")}
                </Box>
              </Button>
              <Button
                variant="contained"
                onClick={async () => {
                  await onCreateTeam(
                    t("peladas.teams.default_name", {
                      number: teams.length + 1,
                    }),
                  );
                }}
                disabled={creatingTeam}
                data-testid="create-team-button"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  fontWeight: 800,
                  boxShadow: "0 4px 12px rgba(25, 118, 210, 0.2)",
                  px: { xs: 1.5, md: 2 },
                  minWidth: { xs: "40px", sm: "auto" },
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AddIcon sx={{ mr: { xs: 0, md: 1 } }} />
                <Box
                  component="span"
                  sx={{ display: { xs: "none", md: "inline" } }}
                >
                  {t("peladas.teams.button.create")}
                </Box>
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>

      <Box sx={{ position: "relative" }}>
        {creatingTeam && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(255, 255, 255, 0.5)",
              zIndex: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 3,
            }}
          >
            <CircularProgress />
          </Box>
        )}
        <Grid container spacing={3} alignItems="stretch">
          {teams.map((t) => {
            const players = teamPlayers[t.id] || [];

            // Calculate average
            let avg: number | null = null;
            const vals = players
              .map((p) =>
                typeof scores[p.id] === "number" ? scores[p.id] : p.grade,
              )
              .filter((g): g is number => typeof g === "number");

            if (vals.length > 0) {
              avg = vals.reduce((a, b) => a + b, 0) / vals.length;
            }

            const playersWithScores = players.map((p) => {
              const s = scores[p.id] ?? p.grade;
              return {
                ...p,
                displayScore: typeof s === "number" ? s.toFixed(1) : "-",
              };
            });

            return (
              <Grid key={t.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <TeamCard
                  team={t}
                  players={playersWithScores}
                  averageScore={avg}
                  maxPlayers={playersPerTeam ?? 5}
                  onDelete={() => onDeleteTeam(t.id)}
                  onDrop={(e) => dropToTeam(e, t.id)}
                  onDragStartPlayer={(e, playerId) =>
                    onDragStartPlayer(e, playerId, t.id)
                  }
                  onSetGoalkeeper={(playerId) =>
                    onSetGoalkeeper(t.id, playerId)
                  }
                  onRemovePlayer={(playerId) => onRemovePlayer(t.id, playerId)}
                  locked={locked}
                  isAdminOverride={isAdminOverride}
                  peladaTransactions={peladaTransactions}
                  organizationFinance={organizationFinance}
                  onMarkPaid={onMarkPaid}
                  onReversePayment={onReversePayment}
                />
              </Grid>
            );
          })}

          {/* Add Team Placeholder */}
          {!locked && isAdminOverride && (
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Button
                fullWidth
                onClick={async () => {
                  await onCreateTeam(
                    t("peladas.teams.default_name", {
                      number: teams.length + 1,
                    }),
                  );
                }}
                disabled={creatingTeam}
                sx={{
                  height: "100%",
                  minHeight: 220,
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 4,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                  textTransform: "none",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    color: "primary.main",
                    bgcolor: "primary.lighter",
                    "& .add-icon-box": {
                      bgcolor: "primary.main",
                      color: "white",
                      borderColor: "primary.main",
                    },
                  },
                }}
              >
                <Box
                  className="add-icon-box"
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: "divider",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 2,
                    transition: "all 0.2s",
                  }}
                >
                  <AddIcon fontSize="large" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  {t("peladas.teams.button.add_placeholder")}
                </Typography>
                <Typography variant="caption" sx={{ mt: 0.5, opacity: 0.7 }}>
                  Adicione um novo time para equilibrar a pelada
                </Typography>
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>
    </section>
  );
}
