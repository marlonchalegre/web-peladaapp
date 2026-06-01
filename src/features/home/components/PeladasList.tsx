import {
  Paper,
  Typography,
  Box,
  Pagination,
  Link,
  Chip,
} from "@mui/material";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Pelada } from "../../../shared/api/endpoints";

interface PeladasListProps {
  peladas: Pelada[];
  page: number;
  totalPages: number;
  onPageChange: (event: React.ChangeEvent<unknown>, value: number) => void;
}

export default function PeladasList({
  peladas,
  page,
  totalPages,
  onPageChange,
}: PeladasListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 5 }} data-testid="peladas-list">
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <SportsSoccerIcon sx={{ mr: 1.5, color: "primary.main" }} />
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "text.primary" }}
        >
          {t("home.sections.peladas.title", "Minhas Peladas")}
        </Typography>
      </Box>

      {peladas.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            border: 1,
            borderColor: "divider",
            borderRadius: 3,
            p: 4,
            textAlign: "center",
          }}
        >
          <Typography sx={{ color: "text.secondary" }}>
            {t("home.sections.peladas.empty", "Nenhuma pelada encontrada.")}
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {peladas.map((pelada) => {
            let peladaLink = `/peladas/${pelada.id}/matches`;
            if (pelada.status === "attendance") {
              peladaLink = `/peladas/${pelada.id}/attendance`;
            } else if (pelada.status === "voting") {
              peladaLink = `/peladas/${pelada.id}/voting`;
            } else if (pelada.status === "closed") {
              peladaLink = `/peladas/${pelada.id}/results`;
            } else if (pelada.status === "open") {
              peladaLink = `/peladas/${pelada.id}`;
            }

            const isNext = pelada.status === "attendance" || pelada.status === "open";
            const dateObj = pelada.scheduled_at ? new Date(pelada.scheduled_at) : null;

            return (
              <Paper
                key={`pelada-${pelada.id}`}
                elevation={0}
                onClick={() => navigate(peladaLink)}
                data-testid={`pelada-row-${pelada.id}`}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 3,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  overflow: "hidden",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: "0 4px 12px rgba(37, 99, 235, 0.08)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                <Box
                  sx={{
                    p: { xs: 2, sm: 2.5 },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  {/* Left: Date Representation */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        display: { xs: "none", sm: "flex" },
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: isNext ? "primary.light" : "grey.100",
                        color: isNext ? "primary.main" : "text.secondary",
                        borderRadius: 2.5,
                        width: 52,
                        height: 52,
                      }}
                    >
                      <CalendarTodayIcon sx={{ fontSize: 20 }} />
                    </Box>

                    <Box>
                      <Link
                        component={RouterLink}
                        to={peladaLink}
                        underline="hover"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`pelada-link-${pelada.id}`}
                        data-analytics-id="view-pelada-details-link"
                        sx={{
                          display: "block",
                          textDecoration: "none",
                          fontWeight: 600,
                          color: "primary.main",
                          fontSize: "0.95rem",
                          mb: 0.25,
                        }}
                      >
                        {dateObj
                          ? dateObj.toLocaleDateString(t("common.locale_code", "pt-BR"))
                          : t("common.date.tbd", "TBD")}
                      </Link>

                      <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                        {pelada.organization_name || pelada.organization_id}
                      </Typography>

                      {pelada.status === "attendance" && pelada.user_attendance_status && (
                        <Typography variant="caption" sx={{ display: "block", color: pelada.user_attendance_status === "declined" ? "error.main" : "success.main", fontWeight: 600, mt: 0.25 }}>
                          {pelada.user_attendance_status === "confirmed" && `✓ ${t("pelada.attendance.status.confirmed", "Presença Confirmada")}`}
                          {pelada.user_attendance_status === "waitlist" && `⌛ ${t("pelada.attendance.status.waitlist", "Na Lista de Espera")}`}
                          {pelada.user_attendance_status === "declined" && `✗ ${t("pelada.attendance.status.declined", "Presença Recusada")}`}
                        </Typography>
                      )}

                      <Typography variant="caption" sx={{ color: "text.secondary", display: "block", mt: 0.25 }}>
                        {dateObj
                          ? dateObj.toLocaleTimeString(t("common.locale_code", "pt-BR"), {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Right: Status & Navigation */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
                    <Chip
                      label={t(`pelada.status.${pelada.status}`, pelada.status || "")}
                      size="small"
                      color={
                        pelada.status === "attendance"
                          ? "warning"
                          : pelada.status === "voting"
                            ? "secondary"
                            : pelada.status === "running"
                              ? "info"
                              : pelada.status === "open"
                                ? "success"
                                : "default"
                      }
                      sx={{
                        fontWeight: 600,
                        borderRadius: 2,
                        fontSize: { xs: "0.72rem", sm: "0.8rem" },
                      }}
                    />
                    <ChevronRightIcon sx={{ color: "grey.300", display: { xs: "none", sm: "block" } }} />
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}

      {totalPages > 1 && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 3,
          }}
        >
          <Pagination
            count={totalPages}
            page={page}
            onChange={onPageChange}
            color="primary"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
}
