import {
  Button,
  Typography,
  Box,
  Stack,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import AddIcon from "@mui/icons-material/Add";
import GroupsIcon from "@mui/icons-material/Groups";
import { type DragEvent } from "react";
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
  onMoveToTeam?: (playerId: number, teamId: number) => void;
  onSendToBench?: (playerId: number) => void;
  onMoveToFixedGk?: (playerId: number, side: "home" | "away") => void;
  scores: Record<number, number>;
  isAdminOverride?: boolean;
  hasFixedGoalkeepers?: boolean;
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
    onMoveToTeam,
    onSendToBench,
    onMoveToFixedGk,
    scores,
    isAdminOverride,
    hasFixedGoalkeepers,
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
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
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
      </Box>

      <Box sx={{ position: "relative", mt: 2 }}>
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
                  onMoveToTeam={onMoveToTeam}
                  onSendToBench={onSendToBench}
                  onMoveToFixedGk={onMoveToFixedGk}
                  teams={teams}
                  locked={locked}
                  isAdminOverride={isAdminOverride}
                  hasFixedGoalkeepers={hasFixedGoalkeepers}
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
