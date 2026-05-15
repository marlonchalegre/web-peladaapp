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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
} from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import StopIcon from "@mui/icons-material/Stop";
import { useTranslation } from "react-i18next";
import {
  type Player,
  type MonthlyPlayerSubstitution,
} from "../../../shared/api/endpoints";

interface SubstitutionsSectionProps {
  players: Player[];
  substitutions: MonthlyPlayerSubstitution[];
  onCreateSubstitution: (permId: string, tempId: string, date: string) => void;
  onEndSubstitution: (subId: string, date?: string) => void;
  actionLoading: boolean;
}

export default function SubstitutionsSection({
  players,
  substitutions,
  onCreateSubstitution,
  onEndSubstitution,
  actionLoading,
}: SubstitutionsSectionProps) {
  const { t } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [permanentPlayerId, setPermanentPlayerId] = useState<string | "">("");
  const [temporaryPlayerId, setTemporaryPlayerId] = useState<string | "">("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const mensalistas = useMemo(
    () => players.filter((p) => p.member_type === "mensalista"),
    [players],
  );

  const potentialSubs = useMemo(
    () =>
      players.filter(
        (p) => p.member_type !== "mensalista" && p.id !== permanentPlayerId,
      ),
    [players, permanentPlayerId],
  );

  const handleCreate = () => {
    if (permanentPlayerId && temporaryPlayerId && startDate) {
      onCreateSubstitution(permanentPlayerId, temporaryPlayerId, startDate);
      setIsAddDialogOpen(false);
      setPermanentPlayerId("");
      setTemporaryPlayerId("");
    }
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
        <Typography variant="h5" sx={{ fontWeight: "bold" }}>
          {t(
            "organizations.management.sections.substitutions",
            "Monthly Substitutions",
          )}
        </Typography>
        <Button
          variant="contained"
          onClick={() => setIsAddDialogOpen(true)}
          disabled={actionLoading}
          startIcon={<SwapHorizIcon />}
        >
          {t("common.add")}
        </Button>
      </Box>
      <Divider sx={{ mb: 2 }} />

      <List>
        {substitutions.length === 0 ? (
          <Typography
            sx={{ color: "text.secondary", py: 2, textAlign: "center" }}
          >
            {t(
              "organizations.management.substitutions.empty",
              "No substitutions recorded.",
            )}
          </Typography>
        ) : (
          substitutions.map((sub) => (
            <ListItem key={sub.id} divider sx={{ px: 0 }}>
              <ListItemText
                primary={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography sx={{ fontWeight: "medium" }}>
                      {sub.permanent_player_name}
                    </Typography>
                    <SwapHorizIcon fontSize="small" color="action" />
                    <Typography sx={{ fontWeight: "medium" }}>
                      {sub.temporary_player_name}
                    </Typography>
                    {sub.active ? (
                      <Chip
                        label={t("common.active", "Active")}
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label={t("common.ended", "Ended")}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {t("common.since", "Since")}: {sub.start_date}
                    {sub.end_date &&
                      ` - ${t("common.until", "Until")}: ${sub.end_date}`}
                  </Typography>
                }
              />
              {sub.active && (
                <IconButton
                  color="error"
                  onClick={() => onEndSubstitution(sub.id)}
                  disabled={actionLoading}
                  title={t(
                    "organizations.management.substitutions.end",
                    "End Substitution",
                  )}
                >
                  <StopIcon />
                </IconButton>
              )}
            </ListItem>
          ))
        )}
      </List>

      <Dialog
        open={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {t(
            "organizations.management.substitutions.dialog.title",
            "Substitute Monthly Player",
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>
                {t(
                  "organizations.management.substitutions.fields.permanent_player",
                  "Permanent Player (Mensalista)",
                )}
              </InputLabel>
              <Select
                value={permanentPlayerId}
                onChange={(e) => setPermanentPlayerId(e.target.value as string)}
                label={t(
                  "organizations.management.substitutions.fields.permanent_player",
                )}
                data-testid="permanent-player-select"
              >
                {mensalistas.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.user_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>
                {t(
                  "organizations.management.substitutions.fields.temporary_player",
                  "Temporary Player",
                )}
              </InputLabel>
              <Select
                value={temporaryPlayerId}
                onChange={(e) => setTemporaryPlayerId(e.target.value as string)}
                label={t(
                  "organizations.management.substitutions.fields.temporary_player",
                )}
                data-testid="temporary-player-select"
              >
                {potentialSubs.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.user_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label={t("common.fields.start_date", "Start Date")}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsAddDialogOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={!permanentPlayerId || !temporaryPlayerId || actionLoading}
          >
            {t("common.confirm")}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
