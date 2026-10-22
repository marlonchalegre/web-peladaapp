import { useState, useMemo } from "react";
import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Pelada, PeladaHistoryEntry } from "../../../shared/api/endpoints";

interface OrganizationAgendaTableProps {
  peladas: Pelada[];
  totalPeladas: number;
  isAdmin: boolean;
  historyByPelada?: Record<string, PeladaHistoryEntry>;
}

export default function OrganizationAgendaTable({
  peladas,
  totalPeladas,
  isAdmin,
  historyByPelada = {},
}: OrganizationAgendaTableProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [filter, setFilter] = useState<"all" | "open" | "pending">("all");
  const [nowTs] = useState(() => Date.now());

  const navigateTo = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigate(path);
  };

  const filteredPeladas = useMemo(
    () =>
      peladas.filter((p) => {
        if (filter === "open")
          return p.status === "attendance" || p.status === "open";
        if (filter === "pending") {
          if (p.status === "closed" || !nowTs) return false;
          const raw = p.scheduled_at || (p as { when?: string }).when || "";
          const ts = raw ? new Date(raw).getTime() : NaN;
          return !Number.isNaN(ts) && ts < nowTs;
        }
        return true;
      }),
    [peladas, filter, nowTs],
  );

  return (
    <>
      {/* 5. Table AGENDA DO GRUPO */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          mb: 1.5,
        }}
      >
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: "9.5px",
            letterSpacing: ".18em",
            color: "text.secondary",
          }}
        >
          {t("organizations.detail.group_agenda", "AGENDA DO GRUPO")}
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {(["all", "open", "pending"] as const).map((filterKey) => {
            const label =
              filterKey === "all"
                ? t("organizations.detail.filter_all", "TODAS")
                : filterKey === "open"
                  ? t("organizations.detail.filter_open", "ABERTAS")
                  : t("organizations.detail.filter_pending", "PENDÊNCIA");
            const isSelected = filter === filterKey;
            return (
              <Box
                key={filterKey}
                component="button"
                onClick={() => setFilter(filterKey)}
                sx={{
                  bgcolor: isSelected
                    ? (theme) =>
                        theme.palette.mode === "dark"
                          ? "action.hover"
                          : "text.primary"
                    : "background.paper",
                  color: isSelected
                    ? (theme) =>
                        theme.palette.mode === "dark"
                          ? "text.primary"
                          : "background.paper"
                    : "text.primary",
                  border: isSelected ? "none" : "1.5px solid",
                  borderColor: "divider",
                  borderRadius: "8px",
                  px: 1.2,
                  py: 0.7,
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: isSelected ? 800 : 700,
                  fontSize: "10px",
                  letterSpacing: ".06em",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "text.primary",
                  },
                }}
              >
                {label}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* Table Container */}
      <Box
        sx={{
          bgcolor: "background.paper",
          border: "1.5px solid",
          borderColor: "divider",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* Table Header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            p: "10px 18px",
            bgcolor: "action.hover",
            borderBottom: "1.5px solid",
            borderColor: "divider",
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: "8.5px",
            letterSpacing: ".14em",
            color: "text.secondary",
          }}
        >
          <Box sx={{ width: 86, flexShrink: 0 }}>
            {t("organizations.detail.table.date", "DATA")}
          </Box>
          <Box sx={{ flex: 1 }}>
            {t("organizations.detail.table.situation", "SITUAÇÃO")}
          </Box>
          <Box sx={{ width: 190, flexShrink: 0 }}>
            {t("organizations.detail.table.list", "LISTA")}
          </Box>
          <Box sx={{ width: 110, flexShrink: 0 }}>
            {t("organizations.detail.table.financial", "FINANCEIRO")}
          </Box>
          <Box sx={{ width: 170, flexShrink: 0, textAlign: "right" }}>
            {t("organizations.detail.table.action", "AÇÃO")}
          </Box>
        </Box>

        {/* Rows */}
        {filteredPeladas.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              {t(
                "organizations.detail.no_peladas_in_view",
                "Nenhuma pelada encontrada nesta visualização.",
              )}
            </Typography>
          </Box>
        ) : (
          filteredPeladas.map((pelada) => {
            const rawDate = pelada.scheduled_at || pelada.when;
            const pDate = rawDate ? new Date(rawDate) : new Date();
            const dateDisplay = !isNaN(pDate.getDate())
              ? `${String(pDate.getDate()).padStart(2, "0")}/${String(
                  pDate.getMonth() + 1,
                ).padStart(2, "0")}`
              : "16/09";
            const dayOfWeek = !isNaN(pDate.getDay())
              ? pDate
                  .toLocaleDateString(t("common.locale_code", "pt-BR"), {
                    weekday: "short",
                  })
                  .replace(".", "")
              : "qua";
            const timeDisplay = !isNaN(pDate.getTime())
              ? pDate.toLocaleTimeString(t("common.locale_code", "pt-BR"), {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "19:00";

            const isOpen =
              pelada.status === "attendance" || pelada.status === "open";
            const history = historyByPelada[pelada.id];
            const userLine = history?.user;

            return (
              <Box
                key={pelada.id}
                data-testid="pelada-row"
                onClick={() =>
                  navigate(
                    isOpen
                      ? `/peladas/${pelada.id}/attendance`
                      : `/peladas/${pelada.id}`,
                  )
                }
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  p: "15px 18px",
                  bgcolor: isOpen
                    ? (theme) =>
                        theme.palette.status?.paid?.bg || "action.hover"
                    : "background.paper",
                  borderBottom: "1.5px solid",
                  borderColor: "divider",
                  borderLeft: isOpen ? "4px solid" : "none",
                  borderLeftColor: "primary.main",
                  cursor: "pointer",
                  transition: "background-color 0.15s ease",
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                {/* DATA */}
                <Box sx={{ width: 86, flexShrink: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                      fontWeight: 700,
                      fontSize: "15px",
                      color: "text.primary",
                    }}
                  >
                    {dateDisplay}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "10px",
                      color: "text.secondary",
                      mt: 0.4,
                    }}
                  >
                    {dayOfWeek} · {timeDisplay}
                  </Typography>
                </Box>

                {/* SITUAÇÃO */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  {isOpen ? (
                    <>
                      <Box
                        sx={{
                          display: "inline-block",
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "9px",
                          letterSpacing: ".08em",
                          color: "primary.contrastText",
                          bgcolor: "primary.main",
                          borderRadius: "6px",
                          p: "4px 7px",
                        }}
                      >
                        {t("peladas.status.open", "LISTA ABERTA")}
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 600,
                          fontSize: "11px",
                          color: "text.secondary",
                          mt: 0.8,
                        }}
                      >
                        fecha em 2 dias · 2 na fila de espera
                      </Typography>
                    </>
                  ) : (
                    <>
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "12.5px",
                          color: "text.primary",
                        }}
                      >
                        {t("peladas.status.closed", "Encerrada")}
                        {history
                          ? ` · ${t(
                              "peladas.matches.matches_count",
                              "{{count}} partidas",
                              { count: history.matches_count },
                            )}`
                          : ""}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 600,
                          fontSize: "11px",
                          color: "text.secondary",
                          mt: 0.4,
                        }}
                      >
                        {userLine
                          ? [
                              userLine.team_position
                                ? `${userLine.team_position}º ${t("common.place", "lugar")}`
                                : null,
                              `${userLine.goals} G`,
                              `${userLine.assists} A`,
                              userLine.is_mvp ? "MVP" : null,
                              userLine.is_garcom
                                ? t("organizations.detail.garcom", "garçom")
                                : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          : history?.champion_team_name
                            ? `${t("organizations.detail.champion_prefix", "Campeão:")} ${history.champion_team_name}`
                            : t("common.no_data", "Sem dados")}
                      </Typography>
                    </>
                  )}
                </Box>

                {/* LISTA */}
                <Box sx={{ width: 190, flexShrink: 0 }}>
                  {isOpen ? (
                    <Box
                      sx={{ display: "flex", alignItems: "center", gap: 1.2 }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "12px",
                          color: "text.primary",
                        }}
                      >
                        {pelada.max_players
                          ? t(
                              "organizations.detail.up_to_players",
                              "até {{max}} jogadores",
                              { max: pelada.max_players },
                            )
                          : t("peladas.status.open", "Lista aberta")}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "11.5px",
                        color: "text.secondary",
                      }}
                    >
                      {history
                        ? t("common.players_count", "{{count}} jogadores", {
                            count: history.players_count,
                          })
                        : "—"}
                    </Typography>
                  )}
                </Box>

                {/* FINANCEIRO */}
                <Box sx={{ width: 110, flexShrink: 0 }}>
                  <Typography
                    sx={{
                      color: "text.secondary",
                      fontWeight: 600,
                      fontSize: "12px",
                    }}
                  >
                    —
                  </Typography>
                </Box>

                {/* AÇÃO */}
                <Box
                  sx={{
                    width: 250,
                    flexShrink: 0,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                  }}
                >
                  {isOpen ? (
                    <>
                      <Box
                        component="button"
                        onClick={(e) =>
                          navigateTo(e, `/peladas/${pelada.id}/attendance`)
                        }
                        data-testid={`view-list-${pelada.id}`}
                        sx={{
                          border: "1.5px solid",
                          borderColor: "divider",
                          borderRadius: "10px",
                          bgcolor: "background.paper",
                          color: "text.primary",
                          p: "9px 13px",
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "10.5px",
                          letterSpacing: ".06em",
                          cursor: "pointer",
                          "&:hover": {
                            borderColor: "text.primary",
                            bgcolor: "action.hover",
                          },
                        }}
                      >
                        {t("peladas.attendance.view_list", "VER LISTA")}
                      </Box>
                      {isAdmin && (
                        <Box
                          component="button"
                          onClick={(e) =>
                            navigateTo(e, `/peladas/${pelada.id}/attendance`)
                          }
                          sx={{
                            border: "none",
                            borderRadius: "10px",
                            bgcolor: (theme) =>
                              theme.palette.mode === "dark"
                                ? "action.hover"
                                : "text.primary",
                            color: (theme) =>
                              theme.palette.mode === "dark"
                                ? "text.primary"
                                : "background.paper",
                            p: "10px 13px",
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "10.5px",
                            letterSpacing: ".06em",
                            cursor: "pointer",
                            "&:hover": {
                              bgcolor: "primary.main",
                              color: "primary.contrastText",
                            },
                          }}
                        >
                          {t(
                            "peladas.attendance.desktop.close_and_draw",
                            "FECHAR E SORTEAR",
                          )}
                        </Box>
                      )}
                    </>
                  ) : (
                    <Box
                      component="button"
                      onClick={(e) => navigateTo(e, `/peladas/${pelada.id}`)}
                      sx={{
                        border: "1.5px solid",
                        borderColor: "divider",
                        borderRadius: "8px",
                        bgcolor: "background.paper",
                        color: "text.secondary",
                        p: "8px 11px",
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "10px",
                        letterSpacing: ".06em",
                        cursor: "pointer",
                        "&:hover": {
                          borderColor: "text.primary",
                          color: "text.primary",
                        },
                      }}
                    >
                      {t("organizations.detail.view_sumula", "VER SÚMULA")}
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })
        )}

        {/* Table Footer */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: "13px 18px",
            bgcolor: "action.hover",
          }}
        >
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 600,
              fontSize: "11.5px",
              color: "text.secondary",
            }}
          >
            {t(
              "organizations.detail.pagination_count",
              "1–{{end}} de {{total}} peladas",
              {
                end: Math.min(filteredPeladas.length, 10),
                total: totalPeladas || peladas.length,
              },
            )}
          </Typography>
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "11.5px",
              color: "primary.main",
              cursor: "pointer",
              "&:hover": { textDecoration: "underline" },
            }}
          >
            {t("organizations.detail.view_all", "Ver todas →")}
          </Typography>
        </Box>
      </Box>
    </>
  );
}
