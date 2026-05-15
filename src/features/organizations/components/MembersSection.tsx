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
  IconButton,
  TextField,
  InputAdornment,
  TablePagination,
  Select,
  MenuItem,
  FormControl,
  ListItemAvatar,
  Avatar,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EmailIcon from "@mui/icons-material/Email";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import { type User, type Player } from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";

interface MembersSectionProps {
  players: Player[];
  usersMap: Map<string, User>;
  onAddClick: () => void;
  onInviteClick: () => void;
  onRemovePlayer: (playerId: string) => void;
  onUpdatePlayer: (playerId: string, payload: Partial<Player>) => void;
  actionLoading: boolean;
  page: number;
  rowsPerPage: number;
  onPageChange: (newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
}

export default function MembersSection({
  players,
  usersMap,
  onAddClick,
  onInviteClick,
  onRemovePlayer,
  onUpdatePlayer,
  actionLoading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: MembersSectionProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

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
    onPageChange(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onRowsPerPageChange(parseInt(event.target.value, 10));
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
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
          }}
        >
          {t("organizations.management.sections.members")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={onInviteClick}
            disabled={actionLoading}
            data-testid="members-invite-button"
            size="small"
            sx={{
              minWidth: { xs: "40px", sm: "auto" },
              px: { xs: 0, sm: 2 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <EmailIcon sx={{ mr: { xs: 0, sm: 1 } }} />
            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline" } }}
            >
              {t("organizations.dialog.invite_player.title")}
            </Box>
          </Button>
          <Button
            variant="contained"
            onClick={onAddClick}
            disabled={actionLoading}
            data-testid="members-add-button"
            size="small"
            sx={{
              minWidth: { xs: "40px", sm: "auto" },
              px: { xs: 0, sm: 2 },
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PersonAddIcon sx={{ mr: { xs: 0, sm: 1 } }} />
            <Box
              component="span"
              sx={{ display: { xs: "none", sm: "inline" } }}
            >
              {t("common.add")}
            </Box>
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
            onPageChange(0);
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      <List>
        {paginatedPlayers.length === 0 ? (
          <Typography
            sx={{
              color: "text.secondary",
              py: 2,
              textAlign: "center",
            }}
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
              <ListItem
                key={player.id}
                divider
                sx={{ px: 0, pr: { xs: 1, sm: 4 }, alignItems: "center" }}
                data-testid="player-item"
              >
                <ListItemAvatar>
                  {(user?.avatar_filename ?? player.user_avatar_filename) ? (
                    <SecureAvatar
                      userId={user?.id ?? player.user_id}
                      filename={
                        user?.avatar_filename ?? player.user_avatar_filename
                      }
                      sx={{
                        width: { xs: 36, sm: 40 },
                        height: { xs: 36, sm: 40 },
                      }}
                      fallbackText={(
                        (user?.name ?? player.user_name ?? "").charAt(0) || ""
                      ).toUpperCase()}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: { xs: 36, sm: 40 },
                        height: { xs: 36, sm: 40 },
                        bgcolor: "primary.dark",
                      }}
                    >
                      {(
                        (user?.name ?? player.user_name ?? "").charAt(0) || ""
                      ).toUpperCase()}
                    </Avatar>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography
                      sx={{
                        fontWeight: "medium",
                      }}
                      noWrap
                    >
                      {user?.name || `User #${player.user_id}`}
                    </Typography>
                  }
                  secondary={
                    <Typography noWrap sx={{ color: "text.secondary" }}>
                      {t(positionKey)}
                    </Typography>
                  }
                  sx={{ flex: 1, minWidth: 0 }}
                />
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <FormControl
                    size="small"
                    variant="standard"
                    sx={{
                      minWidth: { xs: 64, sm: 120 },
                      width: { xs: 64, sm: "auto" },
                    }}
                  >
                    <Select
                      value={player.member_type || "convidado"}
                      onChange={(e) =>
                        onUpdatePlayer(player.id, {
                          member_type: e.target.value as
                            | "mensalista"
                            | "diarista"
                            | "convidado"
                            | "mensalista_temporario"
                            | "diarista_temporario",
                        })
                      }
                      disabled={actionLoading}
                      disableUnderline
                      sx={{ fontSize: "0.85rem", width: "100%" }}
                      data-testid={`member-type-select-${player.id}`}
                    >
                      <MenuItem value="convidado">
                        {t(
                          "organizations.management.member_type.convidado",
                          "Convidado",
                        )}
                      </MenuItem>
                      <MenuItem value="diarista">
                        {t(
                          "organizations.management.member_type.diarista",
                          "Diarista",
                        )}
                      </MenuItem>
                      <MenuItem value="mensalista">
                        {t(
                          "organizations.management.member_type.mensalista",
                          "Mensalista",
                        )}
                      </MenuItem>
                      <MenuItem value="mensalista_temporario">
                        {t(
                          "organizations.management.member_type.mensalista_temporario",
                          "Mensalista (Temp.)",
                        )}
                      </MenuItem>
                      <MenuItem value="diarista_temporario">
                        {t(
                          "organizations.management.member_type.diarista_temporario",
                          "Diarista (Subst.)",
                        )}
                      </MenuItem>
                    </Select>
                  </FormControl>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => onRemovePlayer(player.id)}
                    disabled={actionLoading}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
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
          sx={{
            width: "100%",
            px: { xs: 1, sm: 0 },
            ".MuiTablePagination-toolbar": {
              px: { xs: 0, sm: 1 },
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            },
            ".MuiTablePagination-actions": {
              mr: 0,
              transform: { xs: "translateX(-6px)", sm: "translateX(0)" },
              pr: { xs: 0, sm: 0 },
            },
          }}
        />
      )}
    </Paper>
  );
}
