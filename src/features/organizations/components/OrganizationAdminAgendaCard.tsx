import { Box, IconButton, Typography } from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { Pelada, PeladaHistoryEntry } from "../../../shared/api/endpoints";
import {
  compactActionBtnSx,
  clickableRowSx,
  formatDayMonth,
  formatWeekday,
  formatTime,
} from "../utils/organizationDetailUtils";

export interface MobileAdminAgendaCardProps {
  openPeladas: Pelada[];
  closedPeladas: Pelada[];
  visiblePeladas: Pelada[];
  totalPeladas: number;
  rangeStart: number;
  rangeEnd: number;
  hasMore: boolean;
  historyByPelada: Record<string, PeladaHistoryEntry>;
  isAdmin: boolean;
  onDeletePelada: (pelada: Pelada) => void;
  onLoadMore: () => void;
}

export function MobileAdminAgendaCard({
  openPeladas,
  closedPeladas,
  visiblePeladas,
  totalPeladas,
  rangeStart,
  rangeEnd,
  hasMore,
  historyByPelada,
  isAdmin,
  onDeletePelada,
  onLoadMore,
}: MobileAdminAgendaCardProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navigateTo = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigate(path);
  };

  const renderOpenPeladaCard = (pelada: Pelada) => {
    const confirmed = pelada.confirmed_count ?? 0;
    const max = pelada.max_players ?? 0;
    const progress = max > 0 ? Math.min(100, (confirmed / max) * 100) : 0;

    return (
      <Box
        key={pelada.id}
        data-testid={`mobile-open-pelada-${pelada.id}`}
        onClick={() => navigate(`/peladas/${pelada.id}/attendance`)}
        sx={{
          bgcolor: (theme) => theme.palette.status?.paid?.bg || "action.hover",
          border: "2px solid",
          borderColor: "primary.main",
          borderRadius: "16px",
          p: "13px 14px",
          mb: 1.5,
          cursor: "pointer",
          transition: "opacity 0.15s ease",
          "&:hover": {
            opacity: 0.95,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Typography
            sx={{
              font: "700 13px/1 'Archivo Narrow',Archivo,sans-serif",
              color: "text.primary",
            }}
          >
            {formatDayMonth(pelada.scheduled_at)} ·{" "}
            {formatWeekday(pelada.scheduled_at).slice(0, 3)} ·{" "}
            {formatTime(pelada.scheduled_at)}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            {isAdmin && (
              <IconButton
                aria-label={t("organizations.peladas.aria.delete")}
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePelada(pelada);
                }}
                size="small"
                sx={{ color: "secondary.main", p: 0.5 }}
              >
                <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            )}
            <Box
              sx={{
                font: "800 9px/1 Archivo,sans-serif",
                letterSpacing: ".08em",
                color: "primary.contrastText",
                bgcolor: "primary.main",
                borderRadius: "6px",
                p: "5px 7px",
                flexShrink: 0,
              }}
            >
              LISTA ABERTA
            </Box>
            <Box
              component="button"
              onClick={(e) => navigateTo(e, `/peladas/${pelada.id}/attendance`)}
              data-testid={`view-list-${pelada.id}`}
              sx={compactActionBtnSx}
            >
              {t("peladas.attendance.view_list", "VER LISTA")}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            mt: 1.25,
          }}
        >
          <Box
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 4,
              bgcolor: "action.hover",
              overflow: "hidden",
              display: "flex",
            }}
          >
            <Box sx={{ width: `${progress}%`, bgcolor: "primary.main" }} />
          </Box>
          <Typography
            sx={{
              font: "700 11.5px/1 Archivo,sans-serif",
              color: "text.primary",
            }}
          >
            {confirmed}/{max || "—"}
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderClosedPeladaRow = (pelada: Pelada) => {
    const history = historyByPelada[pelada.id];
    const matches = history?.matches_count;
    const playersCount = history?.players_count;

    return (
      <Box
        key={pelada.id}
        data-testid="pelada-row"
        onClick={() => navigate(`/peladas/${pelada.id}`)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          py: "13px",
          borderBottom: "1.5px solid",
          borderColor: "divider",
          "&:last-of-type": { borderBottom: "none" },
          ...clickableRowSx,
        }}
      >
        <Box sx={{ width: 46, flexShrink: 0 }}>
          <Typography
            sx={{
              font: "700 13px/1.2 'Archivo Narrow',Archivo,sans-serif",
              color: "text.primary",
            }}
          >
            {formatDayMonth(pelada.scheduled_at)}
          </Typography>
          <Typography
            sx={{
              font: "600 10px/1.3 Archivo,sans-serif",
              color: "text.secondary",
              mt: 0.25,
            }}
          >
            {formatTime(pelada.scheduled_at)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              font: "700 12.5px/1.2 Archivo,sans-serif",
              color: "text.primary",
            }}
          >
            {matches !== undefined
              ? `Encerrada · ${matches} partida${matches === 1 ? "" : "s"}`
              : "Encerrada"}
          </Typography>
          <Typography
            sx={{
              font: "600 10.5px/1.3 Archivo,sans-serif",
              color: "text.secondary",
              mt: 0.25,
            }}
          >
            {playersCount !== undefined
              ? `${playersCount} jogadores`
              : "Sem dados"}
            {history?.champion_team_name
              ? ` · Campeão: ${history.champion_team_name}`
              : ""}
          </Typography>
        </Box>
        {isAdmin && (
          <IconButton
            aria-label={t("organizations.peladas.aria.delete")}
            onClick={(e) => {
              e.stopPropagation();
              onDeletePelada(pelada);
            }}
            size="small"
            sx={{ color: "secondary.main", p: 0.5 }}
          >
            <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}
        <Box
          component="button"
          onClick={(e) => navigateTo(e, `/peladas/${pelada.id}`)}
          sx={compactActionBtnSx}
        >
          SÚMULA
        </Box>
      </Box>
    );
  };

  return (
    <Box sx={{ px: 2.5, pt: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          mb: 1.25,
        }}
      >
        <Typography
          sx={{
            font: "700 9.5px/1 Archivo,sans-serif",
            letterSpacing: ".18em",
            color: "text.secondary",
          }}
        >
          AGENDA DO GRUPO
        </Typography>
        <Typography
          sx={{
            font: "700 11px/1 Archivo,sans-serif",
            color: "text.secondary",
          }}
        >
          {totalPeladas} peladas
        </Typography>
      </Box>

      {visiblePeladas.length === 0 ? (
        <Box
          sx={{
            bgcolor: "background.paper",
            border: "1.5px solid",
            borderColor: "divider",
            borderRadius: "16px",
            p: 3,
            textAlign: "center",
          }}
        >
          <Typography
            sx={{
              font: "600 12px/1.4 Archivo,sans-serif",
              color: "text.secondary",
            }}
          >
            Nenhuma pelada encontrada.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: "background.paper",
            border: "1.5px solid",
            borderColor: "divider",
            borderRadius: "16px",
            px: 1.75,
            py: 0.5,
          }}
        >
          {openPeladas.map(renderOpenPeladaCard)}
          {closedPeladas.map(renderClosedPeladaRow)}
        </Box>
      )}

      {visiblePeladas.length > 0 && (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.75,
            pt: 1.5,
          }}
        >
          <Typography
            sx={{
              font: "700 11.5px/1 Archivo,sans-serif",
              color: "text.secondary",
            }}
          >
            {rangeStart}–{rangeEnd} de {totalPeladas}
          </Typography>
          {hasMore && (
            <Typography
              component="button"
              onClick={onLoadMore}
              data-testid="load-more-peladas"
              sx={{
                border: 0,
                bgcolor: "transparent",
                font: "800 11.5px/1 Archivo,sans-serif",
                color: "primary.main",
                cursor: "pointer",
              }}
            >
              · ver mais
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
}
