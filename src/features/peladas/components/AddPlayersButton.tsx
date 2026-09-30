import { Button } from "@mui/material";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { useTranslation } from "react-i18next";

interface AddPlayersButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export default function AddPlayersButton({
  onClick,
  disabled,
}: AddPlayersButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      variant="outlined"
      size="small"
      startIcon={<GroupAddIcon sx={{ fontSize: "14px !important" }} />}
      onClick={onClick}
      disabled={disabled}
      data-testid="invite-player-button"
      sx={{
        textTransform: "none",
        fontFamily: "Archivo, sans-serif",
        fontWeight: 700,
        fontSize: "10.5px",
        letterSpacing: ".02em",
        borderRadius: "8px",
        py: 0.25,
        px: 1,
        borderColor: "divider",
        color: "text.primary",
        "&:hover": {
          bgcolor: "action.hover",
          borderColor: "text.secondary",
        },
      }}
    >
      {t("peladas.available.button.add_players", "Adicionar jogadores")}
    </Button>
  );
}
