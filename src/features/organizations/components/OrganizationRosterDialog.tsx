import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { Player } from "../../../shared/api/endpoints";
import { SecureAvatar } from "../../../shared/components/SecureAvatar";
import { getInitials } from "../../../shared/utils/initials";
import { AVATAR_BG_COLORS } from "../../peladas/utils/playerUtils";

interface OrganizationRosterDialogProps {
  open: boolean;
  onClose: () => void;
  orgName: string;
  players: Player[];
}

const formatPosition = (pos?: string, t?: TFunction) => {
  if (!pos) return t ? t("common.player", "jogador").toLowerCase() : "jogador";
  const p = pos.toLowerCase();
  switch (p) {
    case "goalkeeper":
    case "goleiro":
      return t ? t("positions.goalkeeper", "goleiro").toLowerCase() : "goleiro";
    case "defender":
    case "zagueiro":
      return t ? t("positions.defender", "zagueiro").toLowerCase() : "zagueiro";
    case "midfielder":
    case "meio-campo":
    case "meia":
      return t ? t("positions.midfielder", "meia").toLowerCase() : "meia";
    case "striker":
    case "atacante":
      return t ? t("positions.striker", "atacante").toLowerCase() : "atacante";
    default:
      return p;
  }
};

const formatMemberType = (memberType?: string, t?: TFunction) => {
  switch (memberType) {
    case "mensalista":
      return t
        ? t("member_types.mensalista", "mensalista").toLowerCase()
        : "mensalista";
    case "mensalista_temporario":
      return t
        ? t(
            "member_types.mensalista_temporario",
            "mensalista temporário",
          ).toLowerCase()
        : "mensalista temporário";
    case "diarista":
      return t
        ? t("member_types.diarista", "diarista").toLowerCase()
        : "diarista";
    case "diarista_temporario":
      return t
        ? t(
            "member_types.diarista_temporario",
            "diarista temporário",
          ).toLowerCase()
        : "diarista temporário";
    case "convidado":
      return t
        ? t("member_types.convidado", "convidado").toLowerCase()
        : "convidado";
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
  const { t } = useTranslation();
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
                ? `1px solid ${theme.palette.divider}`
                : theme.palette.brutalist?.border ||
                  `2px solid ${theme.palette.divider}`,
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
        {t("organizations.roster.dialog_title", "ELENCO · {{count}}", {
          count: players.length,
        })}
        <IconButton
          onClick={onClose}
          aria-label={t("common.close", "Fechar")}
          data-testid="roster-close-button"
          sx={{ color: "text.secondary" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 2, pb: 2.5 }}>
        <Typography
          sx={{
            font: "700 9.5px/1 Archivo,sans-serif",
            letterSpacing: ".14em",
            color: "text.secondary",
            textTransform: "uppercase",
            mb: 1.5,
          }}
        >
          {orgName}
        </Typography>
        <Box
          sx={{
            bgcolor: "background.paper",
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
                  color: "text.primary",
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
                  {player.user_name || t("common.player", "Jogador")}
                </Typography>
                <Typography
                  sx={{
                    font: "600 10.5px/1.3 Archivo,sans-serif",
                    color: "text.secondary",
                    mt: 0.25,
                  }}
                >
                  {formatPosition(player.position || player.user_position, t)}
                  {formatMemberType(player.member_type, t)
                    ? ` · ${formatMemberType(player.member_type, t)}`
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
                  color: "text.secondary",
                }}
              >
                {t("organizations.roster.empty", "Nenhum jogador no elenco.")}
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
