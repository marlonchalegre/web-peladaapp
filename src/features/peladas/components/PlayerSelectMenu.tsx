import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  TextField,
  Avatar,
  Box,
} from "@mui/material";
import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { Player } from "../../../shared/api/endpoints";

interface PlayerSelectMenuProps {
  teamId: number;
  benchPlayers: Player[];
  onClose: () => void;
  onSelect: (playerId: number) => void;
  getPlayerName: (pid: number) => string;
}

export default function PlayerSelectMenu({
  benchPlayers,
  onClose,
  onSelect,
  getPlayerName,
}: PlayerSelectMenuProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const getPositionLabel = (player: Player) => {
    const key = player.position_id
      ? ["goalkeeper", "defender", "midfielder", "striker"][
          player.position_id - 1
        ]
      : "player";
    return t(`common.positions.${key}`).toUpperCase();
  };

  const filteredPlayers = useMemo(() => {
    return benchPlayers.filter((p) =>
      getPlayerName(p.id).toLowerCase().includes(search.toLowerCase()),
    );
  }, [benchPlayers, search, getPlayerName]);

  return (
    <Dialog
      open
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      data-testid="player-select-dialog"
    >
      <DialogTitle sx={{ fontWeight: "bold" }}>
        {t("peladas.dashboard.add_player")}
      </DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 2, pb: 1 }}>
          <TextField
            autoFocus
            fullWidth
            size="small"
            placeholder={t("common.select_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputProps={{ "data-testid": "player-select-search" }}
          />
        </Box>
        <List sx={{ pt: 0, maxHeight: 400, overflow: "auto" }}>
          {filteredPlayers.length === 0 ? (
            <ListItem>
              <ListItemText
                secondary={t("peladas.dashboard.no_bench_players")}
                sx={{ textAlign: "center" }}
                data-testid="no-bench-players-text"
              />
            </ListItem>
          ) : (
            filteredPlayers.map((player) => {
              const name = getPlayerName(player.id);
              return (
                <ListItem key={player.id} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      onSelect(player.id);
                      onClose();
                    }}
                    data-testid={`bench-player-item-${player.id}`}
                  >
                    <ListItemIcon>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          fontSize: "0.9rem",
                          fontWeight: "bold",
                        }}
                      >
                        {name.substring(0, 2).toUpperCase()}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={name}
                      primaryTypographyProps={{ fontWeight: "bold" }}
                      secondary={getPositionLabel(player)}
                      secondaryTypographyProps={{
                        fontSize: "0.7rem",
                        fontWeight: "bold",
                        color: "primary.main",
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
}
