import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { Player } from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { getInitials } from "../../../shared/utils/initials";

interface OrganizationRosterDialogProps {
  open: boolean;
  onClose: () => void;
  orgName: string;
  players: Player[];
}

const AVATAR_BG_COLORS = [
  "#c9d9cd",
  "#dcd3bd",
  "#cdd6e0",
  "#e2cfc7",
  "#d3cfc4",
  "#d8d2c4",
  "#cfd8cd",
];

const formatPosition = (pos?: string) => {
  if (!pos) return "jogador";
  switch (pos.toLowerCase()) {
    case "goalkeeper":
    case "goleiro":
      return "goleiro";
    case "defender":
    case "zagueiro":
      return "zagueiro";
    case "midfielder":
    case "meio-campo":
      return "meia";
    case "striker":
    case "atacante":
      return "atacante";
    default:
      return pos.toLowerCase();
  }
};

const formatMemberType = (memberType?: string) => {
  switch (memberType) {
    case "mensalista":
      return "mensalista";
    case "mensalista_temporario":
      return "mensalista temporário";
    case "diarista":
      return "diarista";
    case "diarista_temporario":
      return "diarista temporário";
    case "convidado":
      return "convidado";
    default:
      return "";
  }
};

export default function OrganizationRosterDialog({
  open,
  onClose,
  orgName,
  players,
}: OrganizationRosterDialogProps) {
  const sortedPlayers = [...players].sort((a, b) =>
    (a.user_name || "").localeCompare(b.user_name || ""),
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        paper: {
          sx: {
            bgcolor: "background.paper",
            borderRadius: "18px",
            border: (theme) =>
              theme.palette.mode === "dark"
                ? "1px solid rgba(255,255,255,0.12)"
                : "2px solid #17181a",
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          fontFamily: "Archivo, sans-serif",
          fontWeight: 800,
          fontSize: "15px",
          color: "text.primary",
        }}
      >
        ELENCO · {players.length}
        <IconButton
          onClick={onClose}
          aria-label="Fechar"
          data-testid="roster-close-button"
          sx={{ color: "#6b675c" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 2, pb: 2.5 }}>
        <Typography
          sx={{
            font: "700 9.5px/1 Archivo,sans-serif",
            letterSpacing: ".14em",
            color: "#6b675c",
            textTransform: "uppercase",
            mb: 1.5,
          }}
        >
          {orgName}
        </Typography>
        <Box
          sx={{
            bgcolor: (theme) =>
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.03)"
                : "#ffffff",
            border: 1,
            borderColor: "divider",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {sortedPlayers.map((player, idx) => (
            <Box
              key={player.id}
              data-testid="roster-row"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.4,
                p: "11px 14px",
                borderBottom:
                  idx === sortedPlayers.length - 1
                    ? "none"
                    : (theme) => `1.5px solid ${theme.palette.divider}`,
              }}
            >
              <SecureAvatar
                userId={player.user_id}
                filename={player.user_avatar_filename}
                fallbackText={getInitials(player.user_name)}
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: AVATAR_BG_COLORS[idx % AVATAR_BG_COLORS.length],
                  color: "#17181a",
                  font: "800 10px Archivo,sans-serif",
                }}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  noWrap
                  sx={{
                    font: "700 12.5px/1.2 Archivo,sans-serif",
                    color: "text.primary",
                  }}
                >
                  {player.user_name || "Jogador"}
                </Typography>
                <Typography
                  sx={{
                    font: "600 10.5px/1.3 Archivo,sans-serif",
                    color: "#6b675c",
                    mt: 0.25,
                  }}
                >
                  {formatPosition(player.position || player.user_position)}
                  {formatMemberType(player.member_type)
                    ? ` · ${formatMemberType(player.member_type)}`
                    : ""}
                </Typography>
              </Box>
            </Box>
          ))}
          {sortedPlayers.length === 0 && (
            <Box sx={{ p: 3, textAlign: "center" }}>
              <Typography
                sx={{
                  font: "600 12px/1.4 Archivo,sans-serif",
                  color: "#6b675c",
                }}
              >
                Nenhum jogador no elenco.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
