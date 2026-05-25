import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
  Pagination,
  Link,
  Chip,
} from "@mui/material";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
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
      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "background.default" }}>
            <TableRow>
              <TableCell
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  py: 2,
                }}
              >
                {t("home.table.headers.date", "DATA")}
              </TableCell>
              <TableCell
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  py: 2,
                }}
              >
                {t("home.table.headers.org_name", "NOME DA ORGANIZAÇÃO")}
              </TableCell>
              <TableCell
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  py: 2,
                }}
              >
                {t("home.table.headers.status", "STATUS")}
              </TableCell>
              <TableCell padding="checkbox" />
            </TableRow>
          </TableHead>
          <TableBody>
            {peladas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography
                    sx={{
                      color: "text.secondary",
                    }}
                  >
                    {t(
                      "home.sections.peladas.empty",
                      "Nenhuma pelada encontrada.",
                    )}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              peladas.map((pelada) => {
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

                return (
                  <TableRow
                    key={`pelada-${pelada.id}`}
                    hover
                    onClick={() => navigate(peladaLink)}
                    data-testid={`pelada-row-${pelada.id}`}
                    sx={{
                      cursor: "pointer",
                      "&:last-child td, &:last-child th": { border: 0 },
                    }}
                  >
                    <TableCell sx={{ py: 2.5 }}>
                      <Link
                        component={RouterLink}
                        to={peladaLink}
                        underline="hover"
                        sx={{ display: "block", textDecoration: "none" }}
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`pelada-link-${pelada.id}`}
                        data-analytics-id="view-pelada-details-link"
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color: "primary.main",
                            fontWeight: 500,
                          }}
                        >
                          {pelada.scheduled_at
                            ? new Date(pelada.scheduled_at).toLocaleDateString(
                                t("common.locale_code", "pt-BR"),
                              )
                            : t("common.date.tbd", "TBD")}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary" }}
                        >
                          {pelada.scheduled_at
                            ? new Date(pelada.scheduled_at).toLocaleTimeString(
                                t("common.locale_code", "pt-BR"),
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                },
                              )
                            : ""}
                        </Typography>
                      </Link>
                    </TableCell>
                    <TableCell sx={{ py: 2.5 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: "text.primary",
                        }}
                      >
                        {pelada.organization_name || pelada.organization_id}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 2.5,
                        width: { xs: "120px", sm: "160px" },
                        px: { xs: 2, sm: 3 },
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <Chip
                        label={t(
                          `pelada.status.${pelada.status}`,
                          pelada.status || "",
                        )}
                        size="small"
                        sx={{
                          bgcolor: "success.light",
                          color: "success.main",
                          fontWeight: 500,
                          borderRadius: 1,
                          height: "auto",
                          maxWidth: { xs: 80, sm: 140 },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "inline-block",
                          mx: "auto",
                          "& .MuiChip-label": {
                            display: "block",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            textAlign: "center",
                            py: 0.5,
                            px: 1,
                            fontSize: { xs: "0.72rem", sm: "0.875rem" },
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 2.5,
                        width: { xs: "24px", sm: "40px" },
                        textAlign: "center",
                      }}
                    >
                      <ChevronRightIcon sx={{ color: "grey.300" }} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              p: 2,
              borderTop: 1,
              borderColor: "divider",
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
      </Paper>
    </Box>
  );
}
