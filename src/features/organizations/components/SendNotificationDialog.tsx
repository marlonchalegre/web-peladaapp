import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Send as SendIcon,
  WhatsApp as WhatsAppIcon,
  Loop as LoopIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type Pelada,
  type Organization,
} from "../../../shared/api/endpoints";

const endpoints = createApi(api);

interface SendNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  organization: Organization | null;
  showToast: (message: string, severity: "success" | "error" | "info") => void;
}

export default function SendNotificationDialog({
  open,
  onClose,
  organization,
  showToast,
}: SendNotificationDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  // Mode state: 0 = Custom Message, 1 = Resend Notification
  const [mode, setMode] = useState(0);

  // Custom Message state
  const [customMessage, setCustomMessage] = useState("");

  // Resend Notification states
  const [notificationType, setNotificationType] = useState("");
  const [selectedPeladaId, setSelectedPeladaId] = useState("");
  const [peladas, setPeladas] = useState<Pelada[]>([]);
  const [loadingPeladas, setLoadingPeladas] = useState(false);
  const [peladasError, setPeladasError] = useState<string | null>(null);

  // Action states
  const [sending, setSending] = useState(false);

  // Fetch Peladas for dropdown
  const fetchPeladas = useCallback(async () => {
    if (!organization?.id || !open) return;
    setLoadingPeladas(true);
    setPeladasError(null);
    try {
      // Fetch up to 100 recent peladas to select from
      const response = await endpoints.listPeladasByOrg(
        organization.id,
        1,
        100,
      );
      const allPeladas = response.data || [];
      const activePeladas = allPeladas.filter((p) => p.status !== "closed");
      const mostRecentClosed = allPeladas.find((p) => p.status === "closed");

      const filtered = [...activePeladas];
      if (mostRecentClosed) {
        filtered.push(mostRecentClosed);
      }

      // Sort them descending by scheduled_at to preserve order
      filtered.sort(
        (a, b) =>
          new Date(b.scheduled_at || "").getTime() -
          new Date(a.scheduled_at || "").getTime(),
      );
      setPeladas(filtered);
    } catch (err: unknown) {
      console.error("Failed to load peladas for notifications", err);
      setPeladasError(
        t(
          "organizations.management.notifications.load_peladas_error",
          "Erro ao carregar peladas",
        ),
      );
    } finally {
      setLoadingPeladas(false);
    }
  }, [organization?.id, open, t]);

  useEffect(() => {
    if (open) {
      fetchPeladas();
      // Reset state
      setMode(0);
      setCustomMessage("");
      setNotificationType("");
      setSelectedPeladaId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSend = async () => {
    if (!organization?.id) return;
    setSending(true);

    try {
      if (mode === 0) {
        // Send custom message
        const response = await endpoints.sendNotification(organization.id, {
          action: "custom",
          message: customMessage,
        });
        showToast(
          response.message ||
            t(
              "organizations.management.notifications.custom_success",
              "Mensagem enviada com sucesso!",
            ),
          "success",
        );
      } else {
        // Resend notification
        const response = await endpoints.sendNotification(organization.id, {
          action: "resend",
          notification_type: notificationType,
          pelada_id: selectedPeladaId,
        });
        showToast(
          response.message ||
            t(
              "organizations.management.notifications.resend_success",
              "Notificação reenviada com sucesso!",
            ),
          "success",
        );
      }
      onClose();
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : t(
              "organizations.management.notifications.send_error",
              "Erro ao enviar notificação",
            );
      showToast(errorMsg, "error");
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
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

  const isFormValid = () => {
    if (mode === 0) {
      return customMessage.trim().length > 0;
    } else {
      return notificationType.length > 0 && selectedPeladaId.length > 0;
    }
  };

  const wahaEnabled = organization?.waha_enabled;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            boxShadow:
              theme.palette.mode === "dark"
                ? "0 8px 32px 0 rgba(0, 0, 0, 0.4)"
                : "0 8px 32px 0 rgba(31, 38, 135, 0.08)",
            border: `1px solid ${theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          fontWeight: 700,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 2.5,
        }}
      >
        <WhatsAppIcon color="success" sx={{ fontSize: 28 }} />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {t(
              "organizations.management.notifications.title",
              "Comunicações WhatsApp",
            )}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {organization?.name}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ py: 3, px: 3 }}>
        {!wahaEnabled && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: "10px" }}>
            {t(
              "organizations.management.notifications.waha_disabled_warning",
              "Atenção: A integração com o WhatsApp (WAHA) não está habilitada nas configurações desta organização. As mensagens não serão entregues até que as comunicações WAHA estejam configuradas e ativas.",
            )}
          </Alert>
        )}

        <Tabs
          value={mode}
          onChange={(_, val) => setMode(val)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{
            mb: 3,
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": { fontWeight: 600, py: 1.5 },
          }}
        >
          <Tab
            label={t(
              "organizations.management.notifications.tab_custom",
              "Mensagem Personalizada",
            )}
            icon={<SendIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
          />
          <Tab
            label={t(
              "organizations.management.notifications.tab_resend",
              "Reenviar Notificação",
            )}
            icon={<LoopIcon sx={{ fontSize: 18 }} />}
            iconPosition="start"
          />
        </Tabs>

        {mode === 0 ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t(
                "organizations.management.notifications.custom_instruction",
                "Escreva uma mensagem personalizada para ser enviada diretamente para o grupo do WhatsApp da organização.",
              )}
            </Typography>
            <TextField
              fullWidth
              multiline
              minRows={5}
              maxRows={10}
              variant="outlined"
              placeholder={t(
                "organizations.management.notifications.custom_placeholder",
                "Escreva sua mensagem aqui...",
              )}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value.slice(0, 2000))}
              disabled={sending}
              helperText={
                <Box
                  component="span"
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <span>{customMessage.length}/2000</span>
                  <span>
                    Dica: Use <b>*negrito*</b>, <i>_itálico_</i>, ~tachado~ ou
                    ```mono```
                  </span>
                </Box>
              }
              slotProps={{
                input: {
                  sx: { borderRadius: "10px" },
                },
              }}
            />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {t(
                "organizations.management.notifications.resend_instruction",
                "Selecione um tipo de notificação e uma pelada específica para reenviar o alerta formatado para o grupo.",
              )}
            </Typography>

            {peladasError && (
              <Alert severity="error" sx={{ borderRadius: "8px" }}>
                {peladasError}
              </Alert>
            )}

            <FormControl fullWidth variant="outlined">
              <InputLabel id="notification-type-label">
                {t(
                  "organizations.management.notifications.type_label",
                  "Tipo de Notificação",
                )}
              </InputLabel>
              <Select
                labelId="notification-type-label"
                id="notification-type"
                value={notificationType}
                onChange={(e) => setNotificationType(e.target.value)}
                label={t(
                  "organizations.management.notifications.type_label",
                  "Tipo de Notificação",
                )}
                disabled={sending}
                sx={{ borderRadius: "10px" }}
                data-testid="notification-type-select"
              >
                <MenuItem value="new-pelada">
                  {t(
                    "organizations.management.notifications.types.new_pelada",
                    "Nova Pelada Confirmada / Convocação",
                  )}
                </MenuItem>
                <MenuItem value="attendance-reminder">
                  {t(
                    "organizations.management.notifications.types.attendance_reminder",
                    "Lembrete de Presença",
                  )}
                </MenuItem>
                <MenuItem value="start">
                  {t(
                    "organizations.management.notifications.types.start",
                    "Escalação / Pelada Iniciada",
                  )}
                </MenuItem>
                <MenuItem value="end">
                  {t(
                    "organizations.management.notifications.types.end",
                    "Fim da Pelada / Resultados",
                  )}
                </MenuItem>
                <MenuItem value="vote-reminder">
                  {t(
                    "organizations.management.notifications.types.vote_reminder",
                    "Lembrete de Votação",
                  )}
                </MenuItem>
                <MenuItem value="vote-ended">
                  {t(
                    "organizations.management.notifications.types.vote_ended",
                    "Resultado da Votação",
                  )}
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <InputLabel id="pelada-select-label">
                {t(
                  "organizations.management.notifications.pelada_label",
                  "Selecione a Pelada",
                )}
              </InputLabel>
              <Select
                labelId="pelada-select-label"
                id="pelada-select"
                value={selectedPeladaId}
                onChange={(e) => setSelectedPeladaId(e.target.value)}
                label={t(
                  "organizations.management.notifications.pelada_label",
                  "Selecione a Pelada",
                )}
                disabled={sending || loadingPeladas || peladas.length === 0}
                sx={{ borderRadius: "10px" }}
                data-testid="pelada-select"
                renderValue={(selected) => {
                  const p = peladas.find((item) => item.id === selected);
                  return p
                    ? `${formatDate(p.scheduled_at)} (${p.status})`
                    : selected;
                }}
              >
                {loadingPeladas ? (
                  <MenuItem disabled value="">
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        py: 1,
                      }}
                    >
                      <CircularProgress size={16} />
                      <Typography variant="body2">
                        {t("common.loading", "Carregando...")}
                      </Typography>
                    </Box>
                  </MenuItem>
                ) : peladas.length === 0 ? (
                  <MenuItem disabled value="">
                    {t(
                      "organizations.management.notifications.no_peladas",
                      "Nenhuma pelada encontrada",
                    )}
                  </MenuItem>
                ) : (
                  peladas.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {formatDate(p.scheduled_at)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Status: {p.status}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
        <Button
          onClick={onClose}
          disabled={sending}
          variant="outlined"
          sx={{ borderRadius: "10px", textTransform: "none", px: 3 }}
        >
          {t("common.cancel", "Cancelar")}
        </Button>
        <Button
          onClick={handleSend}
          disabled={sending || !isFormValid()}
          variant="contained"
          color="primary"
          startIcon={
            sending ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SendIcon />
            )
          }
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            px: 3,
            boxShadow: `0 4px 14px 0 ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
          data-testid="send-notification-confirm-btn"
        >
          {sending
            ? t("common.sending", "Enviando...")
            : t("common.send", "Enviar")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
