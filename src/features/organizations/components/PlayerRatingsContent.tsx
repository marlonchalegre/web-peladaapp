import { useState, useMemo, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  InputAdornment,
  Snackbar,
  TablePagination,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import { createApi, type Player } from "../../../shared/api/endpoints";

const endpoints = createApi(api);

interface PlayerRatingsContentProps {
  orgId: number;
  initialPlayers: Player[];
  orgName: string;
  onUpdateSuccess?: () => void;
}

export default function PlayerRatingsContent({
  initialPlayers,
  orgName,
  onUpdateSuccess,
}: PlayerRatingsContentProps) {
  const { t } = useTranslation();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

  const handleRatingChange = async (playerId: number, newRating: number) => {
    try {
      await endpoints.updatePlayer(playerId, { grade: newRating });
      setPlayers((prev) =>
        prev.map((p) => (p.id === playerId ? { ...p, grade: newRating } : p)),
      );
      setSnackbar({
        open: true,
        message: t("organizations.ratings.save_success"),
        severity: "success",
      });
      onUpdateSuccess?.();
    } catch (err) {
      console.error("Failed to update rating", err);
      setSnackbar({
        open: true,
        message: t("organizations.ratings.error.update_rating_failed"),
        severity: "error",
      });
    }
  };

  const filteredPlayers = useMemo(() => {
    return players.filter((p) => {
      const name = p.user_name?.toLowerCase() || "";
      const username = p.user_username?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      return name.includes(search) || username.includes(search);
    });
  }, [players, searchTerm]);

  const paginatedPlayers = useMemo(() => {
    return filteredPlayers.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage,
    );
  }, [filteredPlayers, page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        {t("organizations.ratings.title", { name: orgName })}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {t("organizations.ratings.subtitle")}
      </Typography>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t("organizations.ratings.search_placeholder")}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "action.hover" }}>
              <TableCell sx={{ fontWeight: "bold" }}>
                {t("organizations.ratings.table.player")}
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: "bold" }}>
                {t("organizations.ratings.table.current_rating")}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {t("organizations.ratings.table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {t("organizations.list.empty")}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPlayers.map((player) => (
                <TableRow key={player.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Typography variant="subtitle1" fontWeight="medium">
                        {player.user_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        @{player.user_username}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <TextField
                      type="number"
                      size="small"
                      inputProps={{ min: 0, max: 10, step: 0.5 }}
                      value={player.grade || 0}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          handleRatingChange(player.id, val);
                        }
                      }}
                      data-testid={`rating-input-${player.id}`}
                      sx={{ width: 80 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color="primary"
                      data-testid={`grade-${player.id}`}
                    >
                      {player.grade ? player.grade.toFixed(1) : "-"}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPlayers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage={t("common.pagination.rows_per_page")}
        />
      </TableContainer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
      />
    </Box>
  );
}
