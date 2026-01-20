import {
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Box,
} from "@mui/material";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Match } from "../../../shared/api/endpoints";

type MatchesSectionProps = {
  matches: Match[];
  subsDraft: Record<number, { out?: number; in?: number; minute?: number }>;
  setSubsDraft: Dispatch<
    SetStateAction<
      Record<number, { out?: number; in?: number; minute?: number }>
    >
  >;
  updatingScores: Record<number, boolean>;
  onUpdateScore: (matchId: number, home: number, away: number) => Promise<void>;
  onCreateSubstitution: (
    matchId: number,
    outId: number,
    inId: number,
    minute?: number,
  ) => Promise<void>;
};

export default function MatchesSection({
  matches,
  subsDraft,
  setSubsDraft,
  updatingScores,
  onUpdateScore,
  onCreateSubstitution,
}: MatchesSectionProps) {
  return (
    <section>
      <Typography variant="h5" gutterBottom>
        Partidas
      </Typography>
      <Stack spacing={2}>
        {matches.map((m) => (
          <Paper key={m.id} sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Jogo {m.sequence}: {m.home_score} x {m.away_score}
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ mb: 1 }}
            >
              <Box
                className="droppable"
                sx={{
                  p: 1,
                  border: "1px dashed",
                  borderColor: "divider",
                  minWidth: 120,
                }}
              >
                Sai: {subsDraft[m.id]?.out ?? "-"}
              </Box>
              <Box
                className="droppable"
                sx={{
                  p: 1,
                  border: "1px dashed",
                  borderColor: "divider",
                  minWidth: 120,
                }}
              >
                Entra: {subsDraft[m.id]?.in ?? "-"}
              </Box>
              <TextField
                name={`minute-${m.id}`}
                type="number"
                label="Minuto"
                size="small"
                inputProps={{ min: 0 }}
                value={subsDraft[m.id]?.minute ?? ""}
                onChange={(e) =>
                  setSubsDraft((prev) => ({
                    ...prev,
                    [m.id]: {
                      ...(prev[m.id] || {}),
                      minute: Number(e.target.value),
                    },
                  }))
                }
                sx={{ width: 120 }}
              />
              <Button
                variant="contained"
                size="small"
                disabled={
                  subsDraft[m.id]?.out == null ||
                  subsDraft[m.id]?.in == null ||
                  subsDraft[m.id]?.out === subsDraft[m.id]?.in
                }
                onClick={async () => {
                  const d = subsDraft[m.id];
                  if (!d?.out || !d?.in || d.out === d.in) return;
                  await onCreateSubstitution(m.id, d.out, d.in, d.minute);
                  setSubsDraft((prev) => ({ ...prev, [m.id]: {} }));
                }}
              >
                Confirmar
              </Button>
              <Button
                variant="text"
                size="small"
                onClick={() =>
                  setSubsDraft((prev) => ({ ...prev, [m.id]: {} }))
                }
              >
                Limpar
              </Button>
            </Stack>
            <Stack
              component="form"
              direction="row"
              spacing={1}
              alignItems="center"
              onSubmit={async (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                const home = Number(data.get("home") || 0);
                const away = Number(data.get("away") || 0);
                await onUpdateScore(m.id, home, away);
              }}
            >
              <TextField
                name="home"
                type="number"
                label="Mandante"
                size="small"
                inputProps={{ min: 0 }}
                defaultValue={m.home_score}
                sx={{ width: 120 }}
              />
              <Typography>×</Typography>
              <TextField
                name="away"
                type="number"
                label="Visitante"
                size="small"
                inputProps={{ min: 0 }}
                defaultValue={m.away_score}
                sx={{ width: 120 }}
              />
              <Button
                type="submit"
                variant="outlined"
                size="small"
                disabled={!!updatingScores[m.id]}
              >
                {updatingScores[m.id] ? "Salvando..." : "Salvar"}
              </Button>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </section>
  );
}
