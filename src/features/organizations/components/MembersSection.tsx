import { useState, useMemo } from "react";
import {
  Paper,
  Box,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  InputAdornment,
  TablePagination,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EmailIcon from "@mui/icons-material/Email";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import { type User, type Player } from "../../../shared/api/endpoints";

interface MembersSectionProps {
  players: Player[];
  usersMap: Map<number, User>;
  onAddClick: () => void;
  onInviteClick: () => void;
  onRemovePlayer: (playerId: number) => void;
  actionLoading: boolean;
}

export default function MembersSection({
  players,
  usersMap,
  onAddClick,
  onInviteClick,
  onRemovePlayer,
  actionLoading,
}: MembersSectionProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredPlayers = useMemo(() => {
    return players.filter((player) => {
      const user = usersMap.get(player.user_id);
      const name = (user?.name || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      return name.includes(search);
    });
  }, [players, usersMap, searchTerm]);

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
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          {t("organizations.management.sections.members")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={onInviteClick}
            disabled={actionLoading}
            data-testid="members-invite-button"
            size="small"
          >
            {t("organizations.dialog.invite_player.title")}
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={onAddClick}
            disabled={actionLoading}
            data-testid="members-add-button"
            size="small"
          >
            {t("common.add")}
          </Button>
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ mb: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder={t("common.fields.player_name")}
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

      <List>
        {paginatedPlayers.length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ py: 2, textAlign: "center" }}
          >
            {t("organizations.list.empty")}
          </Typography>
        ) : (
          paginatedPlayers.map((player) => {
            const user = usersMap.get(player.user_id);
            const positionKey = user?.position
              ? `common.positions.${user.position.toLowerCase()}`
              : "common.positions.unknown";

            return (
              <ListItem key={player.id} divider sx={{ px: 0 }}>
                <ListItemText
                  primary={
                    <Typography fontWeight="medium">
                      {user?.name || `User #${player.user_id}`}
                    </Typography>
                  }
                  secondary={t(positionKey)}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => onRemovePlayer(player.id)}
                    disabled={actionLoading}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })
        )}
      </List>

      {filteredPlayers.length > 0 && (
        <TablePagination
          component="div"
          count={filteredPlayers.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage={t("common.pagination.rows_per_page")}
        />
      )}
    </Paper>
  );
}
