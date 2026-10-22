import { useMemo } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type {
  Match,
  MatchEventType,
  Player,
  TeamPlayer,
} from "../../../shared/api/endpoints";

export type GoalSheetState = {
  side: "home" | "away";
  step: "scorer" | "assist" | "own_goal";
  scorerId?: string;
} | null;

export type EventSheetState = {
  step: "type" | "player";
  type?: MatchEventType;
} | null;

export type OnFieldTeamPlayer = TeamPlayer & {
  side: "home" | "away";
  teamId: string;
  isEmpty?: boolean;
};

type Props = {
  match: Match;
  homeTeamName: string;
  awayTeamName: string;
  homeList: OnFieldTeamPlayer[];
  awayList: OnFieldTeamPlayer[];
  allOnFieldPlayers: OnFieldTeamPlayer[];
  orgPlayerIdToPlayer: Record<string, Player>;
  getPlayerName: (playerId: string) => string;
  clockLabel: string;
  playerTeamMap?: Record<string, string>;
  goalSheet: GoalSheetState;
  setGoalSheet: React.Dispatch<React.SetStateAction<GoalSheetState>>;
  eventSheet: EventSheetState;
  setEventSheet: React.Dispatch<React.SetStateAction<EventSheetState>>;
  recordEvent: (
    matchId: string,
    playerId: string,
    type: MatchEventType,
    sessionTimeMs?: number,
    matchTimeMs?: number,
    assistantId?: string,
    teamId?: string,
  ) => Promise<void>;
  adjustScore?: (
    matchId: string,
    team: "home" | "away",
    delta: 1 | -1,
  ) => Promise<void>;
};

const bottomSheetPaperSx = {
  borderRadius: { xs: "24px 24px 0 0", sm: "20px" },
  bgcolor: "background.paper",
  m: 0,
  width: "100%",
  maxWidth: { xs: "100%", sm: "460px" },
  position: { xs: "fixed", sm: "relative" } as const,
  bottom: { xs: 0, sm: "auto" },
  left: { xs: 0, sm: "auto" },
  right: { xs: 0, sm: "auto" },
  boxShadow: {
    xs: "0 -8px 30px rgba(0,0,0,0.2)",
    sm: "0 20px 50px rgba(0,0,0,0.3)",
  },
};

const EVENT_TYPES: {
  type: MatchEventType;
  label: string;
}[] = [
  { type: "drible", label: "Drible" },
  { type: "chute", label: "Chute" },
  { type: "falta", label: "Falta" },
  { type: "furada", label: "Furada" },
  { type: "defesa", label: "Defesaça" },
  { type: "vish", label: "Vish" },
];

export default function MatchEventSheets({
  match,
  homeTeamName,
  awayTeamName,
  homeList,
  awayList,
  allOnFieldPlayers,
  orgPlayerIdToPlayer,
  getPlayerName,
  clockLabel,
  playerTeamMap,
  goalSheet,
  setGoalSheet,
  eventSheet,
  setEventSheet,
  recordEvent,
  adjustScore,
}: Props) {
  const { t } = useTranslation();

  const goalSideList = useMemo(
    () =>
      (goalSheet?.side === "home" ? homeList : awayList).filter(
        (p) => !p.isEmpty,
      ),
    [goalSheet?.side, homeList, awayList],
  );
  const goalSideName = goalSheet?.side === "home" ? homeTeamName : awayTeamName;
  const defendingSideList = useMemo(
    () =>
      (goalSheet?.side === "home" ? awayList : homeList).filter(
        (p) => !p.isEmpty,
      ),
    [goalSheet?.side, homeList, awayList],
  );
  const defendingSideName =
    goalSheet?.side === "home" ? awayTeamName : homeTeamName;

  const assistantOptions = useMemo(() => {
    if (!goalSheet || goalSheet.step !== "assist" || !goalSheet.scorerId)
      return [];
    const list = goalSheet.side === "home" ? homeList : awayList;
    return list.filter((p) => p.player_id !== goalSheet.scorerId);
  }, [goalSheet, homeList, awayList]);

  const commitGoal = async (assistantId?: string) => {
    if (!goalSheet?.scorerId) return;
    const { scorerId, side } = goalSheet;
    setGoalSheet(null);
    const scorerTeamId =
      side === "home" ? match.home_team_id : match.away_team_id;
    await recordEvent(
      match.id,
      scorerId,
      "goal",
      undefined,
      undefined,
      assistantId,
      scorerTeamId,
    );
  };

  const commitOwnGoal = async (playerId: string) => {
    if (!goalSheet) return;
    const side = goalSheet.side;
    const defendingTeamId =
      side === "home" ? match.away_team_id : match.home_team_id;
    setGoalSheet(null);
    if (!defendingTeamId) return;

    await recordEvent(
      match.id,
      playerId,
      "own_goal",
      undefined,
      undefined,
      undefined,
      defendingTeamId,
    );
  };

  const handleSkipOwnGoal = async () => {
    if (!goalSheet) return;
    const side = goalSheet.side;
    setGoalSheet(null);
    if (adjustScore) {
      await adjustScore(match.id, side, 1);
    }
  };

  const handleConfirmEvent = async (playerId: string) => {
    if (!eventSheet?.type) return;
    setEventSheet(null);
    await recordEvent(
      match.id,
      playerId,
      eventSheet.type,
      undefined,
      undefined,
      undefined,
      playerTeamMap?.[playerId],
    );
  };

  const positionLabel = (p: { player_id: string; is_goalkeeper?: boolean }) => {
    if (p.is_goalkeeper) return "GOL";
    const data = orgPlayerIdToPlayer[p.player_id];
    const pos = (
      data?.position ||
      data?.user_position ||
      "player"
    ).toLowerCase();
    const short: Record<string, string> = {
      goalkeeper: "GOL",
      defender: "ZAG",
      midfielder: "MEI",
      striker: "ATA",
    };
    return short[pos] || pos.toUpperCase();
  };

  const playersGrid = (
    players: OnFieldTeamPlayer[],
    onPick: (playerId: string) => void,
    testidPrefix: "goal" | "assistant" | "event" | "own_goal",
    showTeamTag: boolean,
  ) => (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
      {players.map((p) => {
        const name = getPlayerName(p.player_id);
        const isHome = p.side === "home";
        return (
          <Button
            key={`${p.side}-${p.player_id}`}
            onClick={() => onPick(p.player_id)}
            data-testid={`${testidPrefix}-player-item-${p.player_id}`}
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "4px",
              border: (theme) => `1.5px solid ${theme.palette.divider}`,
              bgcolor: "background.paper",
              borderRadius: "14px",
              p: "13px 12px",
              cursor: "pointer",
              textAlign: "left",
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "action.hover",
              },
            }}
          >
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                lineHeight: 1.15,
                color: "text.primary",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {name}
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: "7px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "9.5px",
                lineHeight: 1,
                letterSpacing: "0.08em",
                color: "text.secondary",
              }}
            >
              <span>{positionLabel(p)}</span>
              {showTeamTag && <span>{isHome ? "LARANJA" : "AZUL"}</span>}
            </Box>
          </Button>
        );
      })}
    </Box>
  );

  const eventTypesGrid = (
    <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
      {EVENT_TYPES.map((ev) => (
        <Button
          key={ev.type}
          onClick={() => setEventSheet({ step: "player", type: ev.type })}
          data-testid={`event-type-card-${ev.type}`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: "9px",
            border: (theme) => `1.5px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
            borderRadius: "14px",
            p: "15px 13px",
            cursor: "pointer",
            textAlign: "left",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: "action.hover",
            },
          }}
        >
          <Box
            sx={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              bgcolor: (theme) => theme.palette.matchEvents[ev.type],
              flexShrink: 0,
            }}
          />
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "13.5px",
              lineHeight: 1,
              color: "text.primary",
            }}
          >
            {t(`common.${ev.type}`, ev.label)}
          </Typography>
        </Button>
      ))}
    </Box>
  );

  return (
    <>
      {/* Goal Sheet: scorer -> assist / own_goal */}
      <Dialog
        open={Boolean(goalSheet)}
        onClose={() => setGoalSheet(null)}
        slotProps={{ paper: { sx: bottomSheetPaperSx } }}
        data-testid={
          goalSheet?.step === "assist"
            ? "assist-select-dialog"
            : goalSheet?.step === "own_goal"
              ? "own-goal-select-dialog"
              : "goal-select-dialog"
        }
      >
        <DialogContent sx={{ p: { xs: "20px 18px 26px", sm: "22px" } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              mb: "14px",
            }}
          >
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                bgcolor:
                  goalSheet?.step === "own_goal"
                    ? "secondary.main"
                    : goalSheet?.side === "away"
                      ? "away.main"
                      : "home.main",
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                flex: 1,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "10px",
                lineHeight: 1,
                letterSpacing: "0.16em",
                color: "text.secondary",
              }}
            >
              {goalSheet?.step === "own_goal"
                ? `GOL CONTRA A FAVOR DO ${goalSideName.toUpperCase()} · ${clockLabel}`
                : `GOL DO ${goalSideName.toUpperCase()} · ${clockLabel}`}
            </Typography>
            <IconButton
              onClick={() => setGoalSheet(null)}
              aria-label={t("common.close")}
              sx={{
                border: "1.5px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                color: "text.secondary",
                width: 30,
                height: 30,
                borderRadius: "10px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                lineHeight: 1,
                p: 0,
                "&:hover": {
                  borderColor: "error.main",
                  color: "error.main",
                },
              }}
            >
              ✕
            </IconButton>
          </Box>

          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: { xs: "21px", sm: "22px" },
              lineHeight: 1.2,
              color: "text.primary",
              mb: "14px",
            }}
            data-testid="goal-sheet-question"
          >
            {goalSheet?.step === "scorer"
              ? t("peladas.matches.who_scored", "Quem marcou?")
              : goalSheet?.step === "assist"
                ? t("peladas.matches.who_assisted", "Quem deu a assistência?")
                : t(
                    "peladas.matches.who_scored_own_goal",
                    "Quem fez o gol contra?",
                  )}
          </Typography>

          {goalSheet?.step === "scorer" ? (
            <>
              {playersGrid(
                goalSideList,
                (pid) => {
                  if (goalSheet) {
                    setGoalSheet({
                      side: goalSheet.side,
                      step: "assist",
                      scorerId: pid,
                    });
                  }
                },
                "goal",
                false,
              )}
              <Button
                onClick={() => {
                  if (goalSheet) {
                    setGoalSheet({
                      side: goalSheet.side,
                      step: "own_goal",
                    });
                  }
                }}
                data-testid="own-goal-option"
                sx={{
                  width: "100%",
                  mt: "12px",
                  border: 0,
                  borderRadius: "13px",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  py: "15px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                {t("peladas.matches.own_goal_btn", "GOL CONTRA")}
              </Button>
              <Button
                onClick={handleSkipOwnGoal}
                data-testid="own-goal-skip-option"
                sx={{
                  width: "100%",
                  mt: "6px",
                  borderRadius: "13px",
                  bgcolor: "transparent",
                  color: "text.secondary",
                  py: "10px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                {t("peladas.matches.goal_unidentified", "GOL NÃO IDENTIFICADO")}
              </Button>
            </>
          ) : goalSheet?.step === "assist" ? (
            <>
              {playersGrid(
                assistantOptions,
                (pid) => commitGoal(pid),
                "assistant",
                false,
              )}
              <Button
                onClick={() => commitGoal(undefined)}
                data-testid="without-assistance-option"
                sx={{
                  width: "100%",
                  mt: "12px",
                  border: 0,
                  borderRadius: "13px",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  py: "15px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                SEM ASSISTÊNCIA
              </Button>
            </>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  mb: "10px",
                }}
              >
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    bgcolor:
                      goalSheet?.side === "home" ? "away.main" : "home.main",
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "11px",
                    lineHeight: 1,
                    letterSpacing: "0.08em",
                    color: "text.secondary",
                    textTransform: "uppercase",
                  }}
                >
                  {t(
                    "peladas.matches.defending_team_players",
                    "Jogador do {{team}}",
                    { team: defendingSideName },
                  )}
                </Typography>
              </Box>

              {playersGrid(
                defendingSideList,
                (pid) => commitOwnGoal(pid),
                "own_goal",
                false,
              )}

              <Button
                onClick={handleSkipOwnGoal}
                data-testid="unidentified-own-goal-option"
                sx={{
                  width: "100%",
                  mt: "12px",
                  border: 0,
                  borderRadius: "13px",
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  py: "15px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "12.5px",
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                {t(
                  "peladas.matches.own_goal_unidentified",
                  "GOL CONTRA NÃO IDENTIFICADO",
                )}
              </Button>

              <Button
                onClick={() => {
                  if (goalSheet) {
                    setGoalSheet({ side: goalSheet.side, step: "scorer" });
                  }
                }}
                data-testid="back-to-scorer-option"
                sx={{
                  width: "100%",
                  mt: "6px",
                  borderRadius: "13px",
                  bgcolor: "transparent",
                  color: "text.secondary",
                  py: "10px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  cursor: "pointer",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                {t("common.back", "VOLTAR")}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Event Sheet: type -> player */}
      <Dialog
        open={Boolean(eventSheet)}
        onClose={() => setEventSheet(null)}
        slotProps={{ paper: { sx: bottomSheetPaperSx } }}
        data-testid="record-event-dialog"
      >
        <DialogContent sx={{ p: { xs: "20px 18px 26px", sm: "22px" } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              mb: "14px",
            }}
          >
            <Box
              sx={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                bgcolor: "text.secondary",
                flexShrink: 0,
              }}
            />
            <Typography
              sx={{
                flex: 1,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "10px",
                lineHeight: 1,
                letterSpacing: "0.16em",
                color: "text.secondary",
              }}
            >
              {`REGISTRAR LANCE · ${clockLabel}`}
            </Typography>
            <IconButton
              onClick={() => setEventSheet(null)}
              aria-label={t("common.close")}
              sx={{
                border: "1.5px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                color: "text.secondary",
                width: 30,
                height: 30,
                borderRadius: "10px",
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                lineHeight: 1,
                p: 0,
                "&:hover": {
                  borderColor: "error.main",
                  color: "error.main",
                },
              }}
            >
              ✕
            </IconButton>
          </Box>

          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: { xs: "21px", sm: "22px" },
              lineHeight: 1.2,
              color: "text.primary",
              mb: "14px",
            }}
          >
            {eventSheet?.step === "type"
              ? "Que lance foi?"
              : "Quem fez o lance?"}
          </Typography>

          {eventSheet?.step === "type" ? (
            eventTypesGrid
          ) : (
            <>
              {playersGrid(
                allOnFieldPlayers,
                handleConfirmEvent,
                "event",
                true,
              )}
              <Button
                onClick={() => setEventSheet({ step: "type" })}
                sx={{
                  width: "100%",
                  mt: "12px",
                  borderRadius: "13px",
                  bgcolor: "transparent",
                  color: "text.secondary",
                  py: "12px",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "11px",
                  lineHeight: 1,
                  letterSpacing: "0.06em",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                {t("common.back", "VOLTAR")}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
