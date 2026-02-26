import { Stack } from "@mui/material";
import { type Dispatch, type SetStateAction, useState } from "react";
import type { Match, TeamPlayer, Player } from "../../../shared/api/endpoints";
import Scoreboard from "./Scoreboard";
import MatchControlTable, { type SelectMenuState } from "./MatchControlTable";

type Props = {
  match: Match;
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: TeamPlayer[];
  awayPlayers: TeamPlayer[];
  orgPlayerIdToUserId: Record<number, number>;
  userIdToName: Record<number, string>;
  statsMap: Record<
    number,
    { goals: number; assists: number; ownGoals: number }
  >;
  benchPlayers: Player[];
  finished: boolean;
  isPeladaClosed: boolean;
  updating: boolean;
  selectMenu: SelectMenuState;
  setSelectMenu: Dispatch<SetStateAction<SelectMenuState>>;
  playersPerTeam?: number | null;
  // Actions
  recordEvent: (
    matchId: number,
    playerId: number,
    type: "assist" | "goal" | "own_goal",
  ) => Promise<void>;
  deleteEventAndRefresh: (
    matchId: number,
    playerId: number,
    type: "assist" | "goal" | "own_goal",
  ) => Promise<void>;
  adjustScore: (
    matchId: number,
    team: "home" | "away",
    delta: 1 | -1,
  ) => Promise<void>;
  replacePlayerOnTeam: (
    teamId: number,
    outPlayerId: number,
    inPlayerId: number,
  ) => Promise<void>;
  addPlayerToTeam: (teamId: number, playerId: number) => Promise<void>;
  onEndMatch: () => Promise<void>;
};

export default function ActiveMatchDashboard(props: Props) {
  const {
    match,
    homeTeamName,
    awayTeamName,
    homePlayers,
    awayPlayers,
    orgPlayerIdToUserId,
    userIdToName,
    statsMap,
    benchPlayers,
    finished,
    isPeladaClosed,
    updating,
    selectMenu,
    setSelectMenu,
    playersPerTeam,
    recordEvent,
    deleteEventAndRefresh,
    adjustScore,
    replacePlayerOnTeam,
    addPlayerToTeam,
    onEndMatch,
  } = props;

  const [loadingStats, setLoadingStats] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);

  const effectiveFinished = finished && !isEditing;

  const handleStatChange = async (
    playerId: number,
    type: "goal" | "assist" | "own_goal",
    diff: number,
    side: "home" | "away",
  ) => {
    if (diff === 0) return;
    const loadingKey = `${playerId}-${type}`;
    if (loadingStats[loadingKey]) return;

    setLoadingStats((prev) => ({ ...prev, [loadingKey]: true }));
    try {
      const absDiff = Math.abs(diff);
      for (let i = 0; i < absDiff; i++) {
        if (diff > 0) {
          await recordEvent(match.id, playerId, type);
          if (type === "goal") {
            await adjustScore(match.id, side, 1);
          } else if (type === "own_goal") {
            await adjustScore(match.id, side === "home" ? "away" : "home", 1);
          }
        } else {
          await deleteEventAndRefresh(match.id, playerId, type);
          if (type === "goal") {
            await adjustScore(match.id, side, -1);
          } else if (type === "own_goal") {
            await adjustScore(match.id, side === "home" ? "away" : "home", -1);
          }
        }
      }
    } finally {
      setLoadingStats((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  return (
    <Stack spacing={2} sx={{ height: "100%" }}>
      <Scoreboard
        homeTeamName={homeTeamName}
        awayTeamName={awayTeamName}
        homeScore={match.home_score ?? 0}
        awayScore={match.away_score ?? 0}
        sequence={match.sequence}
      />

      <MatchControlTable
        homePlayers={homePlayers}
        awayPlayers={awayPlayers}
        homeTeamId={match.home_team_id}
        awayTeamId={match.away_team_id}
        orgPlayerIdToUserId={orgPlayerIdToUserId}
        userIdToName={userIdToName}
        statsMap={statsMap}
        benchPlayers={benchPlayers}
        finished={effectiveFinished}
        isMatchFinished={finished}
        isPeladaClosed={isPeladaClosed}
        isEditing={isEditing}
        onToggleEdit={() => setIsEditing(!isEditing)}
        updating={updating}
        selectMenu={selectMenu}
        setSelectMenu={setSelectMenu}
        playersPerTeam={playersPerTeam}
        loadingStats={loadingStats}
        onStatChange={handleStatChange}
        onReplacePlayer={replacePlayerOnTeam}
        onAddPlayer={addPlayerToTeam}
        onEndMatch={onEndMatch}
      />
    </Stack>
  );
}
