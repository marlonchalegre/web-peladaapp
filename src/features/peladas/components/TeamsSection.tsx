import {
  Button,
  Typography,
  Stack,
  Box,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import type { DragEvent } from "react";
import type { Player, Team, User } from "../../../shared/api/endpoints";
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
  scores: Record<number, number>;
  isAdminOverride?: boolean;
  fixedGoalkeepersEnabled?: boolean;
};

export default function TeamsSection(props: TeamsSectionProps) {
  const { t } = useTranslation();
  const {
    teams,
    teamPlayers,
    playersPerTeam,
    creatingTeam,
    locked = false,
    onCreateTeam,
    onDeleteTeam,
    onDragStartPlayer,
    dropToTeam,
    onSetGoalkeeper,
    onRemovePlayer,
    onRandomizeTeams,
    scores,
    isAdminOverride = false,
    fixedGoalkeepersEnabled = false,
  } = props;

  return (
    <section>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            {t("peladas.teams.title")}
          </Typography>
        </Box>

        {!locked && isAdminOverride && (
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<ShuffleIcon />}
              onClick={async () => {
                await onRandomizeTeams();
              }}
              disabled={creatingTeam}
              data-testid="randomize-teams-button"
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              {t("peladas.teams.button.randomize")}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={async () => {
                await onCreateTeam(
                  t("peladas.teams.default_name", { number: teams.length + 1 }),
                );
              }}
              disabled={creatingTeam}
              data-testid="create-team-button"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                bgcolor: "primary.light",
                color: "primary.main",
                boxShadow: "none",
                "&:hover": { bgcolor: "grey.200", boxShadow: "none" },
              }}
            >
              {t("peladas.teams.button.create")}
            </Button>
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
                  onDragStartPlayer={(e, pid) =>
                    onDragStartPlayer(e, pid, t.id)
                  }
                  onSetGoalkeeper={(pid) => onSetGoalkeeper(t.id, pid)}
                  onRemovePlayer={(pid) => onRemovePlayer(t.id, pid)}
                  locked={locked}
                  fixedGoalkeepersEnabled={fixedGoalkeepersEnabled}
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
                  minHeight: 200,
                  border: "2px dashed",
                  borderColor: "divider",
                  borderRadius: 3,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                  textTransform: "none",
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: "inherit",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mb: 1,
                  }}
                >
                  <AddIcon />
                </Box>
                <Typography variant="h6">
                  {t("peladas.teams.button.add_placeholder")}
                </Typography>
              </Button>
            </Grid>
          )}
        </Grid>
      </Box>
    </section>
  );
}
