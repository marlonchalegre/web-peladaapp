import { Box, Chip, IconButton, Tooltip, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import type { Pelada } from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";

export type PeladasTableProps = {
  peladas: Pelada[];
  onDelete?: (peladaId: string) => Promise<void>;
};

export default function PeladasTable({ peladas, onDelete }: PeladasTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!peladas.length) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography sx={{ color: "text.secondary" }}>
          {t("organizations.peladas.empty")}
        </Typography>
      </Box>
    );
  }

  const getPeladaLink = (pelada: Pelada) => {
    switch (pelada.status) {
      case "attendance":
        return `/peladas/${pelada.id}/attendance`;
      case "voting":
        return `/peladas/${pelada.id}/voting`;
      case "open":
        return `/peladas/${pelada.id}`;
      default:
        return `/peladas/${pelada.id}/matches`;
    }
  };

  return (
    <Box sx={{ width: "100%" }}>
      {peladas.map((p) => {
        const peladaLink = getPeladaLink(p);
        const isOpen = p.status === "attendance" || p.status === "open";
        const date = p.scheduled_at ? new Date(p.scheduled_at) : null;
        const dateDisplay = date
          ? `${String(date.getDate()).padStart(2, "0")}/${String(
              date.getMonth() + 1,
            ).padStart(2, "0")}/${date.getFullYear()}`
          : t("common.date.tbd", "TBD");
        const timeDisplay = date
          ? `${date
              .toLocaleDateString(t("common.locale_code", "pt-BR"), {
                weekday: "short",
              })
              .replace(".", "")} · ${date.toLocaleTimeString(
              t("common.locale_code", "pt-BR"),
              { hour: "2-digit", minute: "2-digit", hour12: false },
            )}`
          : "";

        return (
          <Box
            key={`pelada-${p.id}`}
            data-testid="pelada-row"
            onClick={() => navigate(peladaLink)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.75,
              cursor: "pointer",
              borderBottom: "1.5px solid #f2efe7",
              "&:last-of-type": { borderBottom: "none" },
              "&:hover": { bgcolor: "#f9f8f4" },
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                sx={{
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "15px",
                  color: "#17181a",
                }}
              >
                {dateDisplay}
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "10px",
                  color: "#6b675c",
                  mt: 0.25,
                  textTransform: "capitalize",
                }}
              >
                {timeDisplay}
              </Typography>
            </Box>

            <Chip
              label={t(`pelada.status.${p.status}`, p.status || "")}
              size="small"
              data-testid={`pelada-link-${p.id}`}
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "9px",
                letterSpacing: ".06em",
                textTransform: "uppercase",
                borderRadius: "6px",
                height: 22,
                bgcolor: isOpen ? "#146b3a" : "transparent",
                color: isOpen ? "#ffffff" : "#6b675c",
                border: isOpen ? "none" : "1.5px solid #ddd8cc",
              }}
            />

            {onDelete && (
              <Tooltip title={t("common.delete", "Excluir")}>
                <IconButton
                  aria-label={t("organizations.peladas.aria.delete", {
                    id: p.id,
                  })}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(p.id);
                  }}
                  size="small"
                  sx={{ color: "#a8452a" }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}

            <ChevronRightIcon sx={{ color: "#c9c4b6", fontSize: 20 }} />
          </Box>
        );
      })}
    </Box>
  );
}
