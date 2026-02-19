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
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EmailIcon from "@mui/icons-material/Email";
import DeleteIcon from "@mui/icons-material/Delete";
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
        <Typography variant="h5">
          {t("organizations.management.sections.members")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EmailIcon />}
            onClick={onInviteClick}
            disabled={actionLoading}
            data-testid="members-invite-button"
          >
            {t("organizations.dialog.invite_player.title")}
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={onAddClick}
            disabled={actionLoading}
            data-testid="members-add-button"
          >
            {t("common.add")}
          </Button>
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <List>
        {players.length === 0 ? (
          <Typography color="text.secondary">
            {t("organizations.list.empty")}
          </Typography>
        ) : (
          players.map((player) => {
            const user = usersMap.get(player.user_id);
            return (
              <ListItem key={player.id}>
                <ListItemText
                  primary={user?.name || `User #${player.user_id}`}
                  secondary={user?.email}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    color="error"
                    onClick={() => onRemovePlayer(player.id)}
                    disabled={actionLoading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            );
          })
        )}
      </List>
    </Paper>
  );
}
