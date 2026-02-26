import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Link,
  Chip,
  Typography,
  Box,
  Stack,
  Tooltip,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { Pelada } from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";

export type PeladasTableProps = {
  peladas: Pelada[];
  onDelete?: (peladaId: number) => Promise<void>;
};

export default function PeladasTable({ peladas, onDelete }: PeladasTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!peladas.length) {
    return (
      <Box sx={{ p: 4, textAlign: "center" }}>
        <Typography color="text.secondary">
          {t("organizations.peladas.empty")}
        </Typography>
      </Box>
    );
  }

  const getPeladaLink = (pelada: Pelada) => {
    return pelada.status === "attendance"
      ? `/peladas/${pelada.id}/attendance`
      : pelada.status === "voting"
        ? `/peladas/${pelada.id}/voting`
        : `/peladas/${pelada.id}/matches`;
  };

  return (
    <Box sx={{ width: "100%", overflowX: "auto" }}>
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
              }}
            >
              {t("common.fields.date", "DATA")}
            </TableCell>
            <TableCell
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {t("common.fields.name", "NOME")}
            </TableCell>
            <TableCell
              sx={{
                color: "text.secondary",
                fontWeight: 600,
                fontSize: "0.75rem",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {t("home.table.headers.status", "STATUS")}
            </TableCell>
            <TableCell align="right" sx={{ pr: 3 }}>
              {t("common.actions", "AÇÕES")}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {peladas.map((p) => {
            const peladaLink = getPeladaLink(p);
            return (
              <TableRow
                key={`pelada-${p.id}`}
                hover
                onClick={() => navigate(peladaLink)}
                data-testid="pelada-row"
                sx={{
                  cursor: "pointer",
                  "&:last-child td, &:last-child th": { border: 0 },
                }}
              >
                <TableCell sx={{ py: 2 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {p.scheduled_at
                      ? new Date(p.scheduled_at).toLocaleDateString()
                      : t("common.date.tbd", "TBD")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {p.scheduled_at
                      ? new Date(p.scheduled_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : ""}
                  </Typography>
                </TableCell>
                <TableCell sx={{ py: 2 }}>
                  <Link
                    component={RouterLink}
                    to={peladaLink}
                    underline="hover"
                    color="primary"
                    fontWeight={600}
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`pelada-link-${p.id}`}
                  >
                    {t("organizations.peladas.item_name", { id: p.id })}
                  </Link>
                </TableCell>
                <TableCell sx={{ py: 2 }}>
                  <Chip
                    label={t(`pelada.status.${p.status}`, p.status || "")}
                    size="small"
                    color={
                      p.status === "closed"
                        ? "default"
                        : p.status === "running"
                          ? "primary"
                          : "success"
                    }
                    variant={p.status === "closed" ? "outlined" : "filled"}
                    sx={{ fontWeight: 500, borderRadius: 1 }}
                  />
                </TableCell>
                <TableCell align="right" sx={{ py: 2, pr: 2 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="flex-end"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Tooltip title={t("common.actions.view", "Visualizar")}>
                      <IconButton
                        component={RouterLink}
                        to={peladaLink}
                        size="small"
                        color="primary"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {onDelete && (
                      <Tooltip title={t("common.delete", "Excluir")}>
                        <IconButton
                          aria-label={t("organizations.peladas.aria.delete", {
                            id: p.id,
                          })}
                          onClick={() => onDelete(p.id)}
                          size="small"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    <ChevronRightIcon sx={{ color: "grey.300", ml: 1 }} />
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}
