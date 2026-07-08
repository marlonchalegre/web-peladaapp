import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Pagination,
  Stack,
  useTheme,
  alpha,
  Chip,
} from "@mui/material";
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { type Pelada } from "../../../shared/api/endpoints";

export interface PeladasTabProps {
  peladas: Pelada[];
  peladasLoading: boolean;
  peladaPage: number;
  peladaTotalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onOpenDeletePelada: (pelada: Pelada) => void;
}

export function PeladasTab({
  peladas,
  peladasLoading,
  peladaPage,
  peladaTotalPages,
  onPageChange,
  onRefresh,
  onOpenDeletePelada,
}: PeladasTabProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const glassmorphismStyle = {
    background:
      theme.palette.mode === "dark"
        ? "rgba(25, 25, 25, 0.65)"
        : "rgba(255, 255, 255, 0.75)",
    backdropFilter: "blur(20px)",
    border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
        : "0 8px 32px 0 rgba(31, 38, 135, 0.08)",
    borderRadius: "16px",
    overflow: "hidden",
    p: 3,
  };

  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case "attendance":
        return "info";
      case "running":
        return "success";
      case "closed":
        return "default";
      default:
        return "default";
    }
  };

  const formatScheduledDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Box sx={glassmorphismStyle}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography
          variant="h5"
          sx={{ fontWeight: 700, color: "text.primary" }}
        >
          {t("admin.sections.peladas.title", "Peladas no Sistema")}
        </Typography>
        <IconButton
          color="primary"
          onClick={onRefresh}
          disabled={peladasLoading}
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          {peladasLoading ? <CircularProgress size={20} /> : <RefreshIcon />}
        </IconButton>
      </Box>

      {/* Peladas Table */}
      <TableContainer
        component={Paper}
        elevation={0}
        variant="outlined"
        sx={{
          borderRadius: "12px",
          border: "1px solid",
          borderColor: "divider",
          mb: 3,
          overflowX: "auto",
        }}
      >
        <Table sx={{ minWidth: 600 }}>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                {t("admin.table.organization", "Organização")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 150 }}>
                {t("admin.table.scheduled_at", "Data Agendada")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 120 }} align="center">
                {t("admin.table.status", "Status")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 250 }}>
                {t("admin.table.pelada_id", "ID da Pelada")}
              </TableCell>
              <TableCell sx={{ fontWeight: 600, minWidth: 100 }} align="center">
                {t("admin.table.actions", "Ações")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {peladasLoading && peladas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : peladas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    {t(
                      "admin.table.no_peladas_found",
                      "Nenhuma pelada encontrada.",
                    )}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              peladas.map((pelada) => (
                <TableRow
                  key={pelada.id}
                  hover
                  sx={{ transition: "background-color 0.2s" }}
                >
                  <TableCell sx={{ fontWeight: 600, minWidth: 200 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {pelada.organization_name ||
                        t("common.unknown", "Desconhecida")}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 150 }}>
                    <Typography variant="body2" noWrap>
                      {formatScheduledDate(pelada.scheduled_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>
                    <Chip
                      label={t(
                        `pelada.status.${pelada.status}`,
                        pelada.status || "",
                      )}
                      color={getStatusColor(pelada.status)}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell sx={{ minWidth: 250 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        color: "text.secondary",
                      }}
                      noWrap
                    >
                      {pelada.id}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" sx={{ minWidth: 100 }}>
                    <IconButton
                      color="error"
                      onClick={() => onOpenDeletePelada(pelada)}
                      title={t("admin.actions.delete_pelada", "Remover Pelada")}
                      data-testid={`delete-pelada-btn-${pelada.id}`}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {peladaTotalPages > 1 && (
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <Pagination
            count={peladaTotalPages}
            page={peladaPage}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      )}
    </Box>
  );
}
