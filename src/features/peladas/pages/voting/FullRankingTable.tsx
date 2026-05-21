import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useTranslation } from "react-i18next";

interface MVPPlayer {
  player_id: string;
  user_id?: string | null;
  name: string;
  average_stars: number;
  position?: string | null;
  goals: number;
  assists: number;
}

interface FullRankingTableProps {
  mvp: MVPPlayer[];
}

export default function FullRankingTable({ mvp }: FullRankingTableProps) {
  const { t } = useTranslation();

  return (
    <Grid size={{ xs: 12 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: "bold",
          mb: 2,
          mt: 2,
        }}
      >
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
            {mvp.map((p, i) => {
              const positionKey = p.position
                ? `common.positions.${p.position.toLowerCase()}`
                : "common.positions.unknown";

              return (
                <TableRow key={p.player_id} hover>
                  <TableCell sx={{ fontWeight: "bold" }}>{i + 1}º</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>{p.name}</TableCell>
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
                      <Typography
                        color="primary"
                        sx={{
                          fontWeight: "bold",
                        }}
                      >
                        {p.average_stars.toFixed(1)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                        }}
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
  );
}
