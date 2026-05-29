import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  Typography,
  Box,
  CircularProgress,
  Switch,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Button,
  DialogActions,
  Divider,
  useTheme,
} from "@mui/material";
import {
  AttachMoney as AttachMoneyIcon,
  WhatsApp as WhatsAppIcon,
  Star as StarIcon,
  SwapHoriz as SwapHorizIcon,
  Assessment as AssessmentIcon,
  RateReview as RateReviewIcon,
  People as PeopleIcon,
  SportsSoccer as SportsSoccerIcon,
} from "@mui/icons-material";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  createApi,
  type Organization,
  type OrganizationFeatureFlags,
} from "../../../shared/api/endpoints";
import { api } from "../../../shared/api/client";

const endpoints = createApi(api);

export interface ManageFeatureFlagsDialogProps {
  open: boolean;
  onClose: () => void;
  organization: Organization | null;
  showToast: (message: string, severity?: "success" | "error" | "info") => void;
}

export function ManageFeatureFlagsDialog({
  open,
  onClose,
  organization,
  showToast,
}: ManageFeatureFlagsDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [flags, setFlags] = useState<OrganizationFeatureFlags | null>(null);

  useEffect(() => {
    if (!open || !organization) {
      setFlags(null);
      return;
    }

    const fetchFlags = async () => {
      setLoading(true);
      try {
        const response = await endpoints.getOrganizationFeatureFlagsAdmin(
          organization.id,
        );
        setFlags(response);
      } catch (err: unknown) {
        showToast(
          err instanceof Error
            ? err.message
            : t(
                "admin.dialogs.feature_flags.load_error",
                "Erro ao carregar as flags da organização",
              ),
          "error",
        );
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchFlags();
  }, [open, organization, showToast, onClose, t]);

  const handleToggle = (
    key: keyof Omit<OrganizationFeatureFlags, "organization_id">,
  ) => {
    if (!flags) return;
    setFlags({
      ...flags,
      [key]: !flags[key],
    });
  };

  const handleSave = async () => {
    if (!organization || !flags) return;
    setSaving(true);
    try {
      await endpoints.updateOrganizationFeatureFlagsAdmin(
        organization.id,
        flags,
      );
      showToast(
        t(
          "admin.dialogs.feature_flags.save_success",
          "Premium feature flags salvas com sucesso!",
        ),
        "success",
      );
      onClose();
    } catch (err: unknown) {
      showToast(
        err instanceof Error
          ? err.message
          : t(
              "admin.dialogs.feature_flags.save_error",
              "Erro ao salvar as flags",
            ),
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  const flagConfigs = [
    {
      key: "finance_control" as const,
      label: t("admin.dialogs.feature_flags.finance", "Controle Financeiro"),
      description: t(
        "admin.dialogs.feature_flags.finance_desc",
        "Acesso à aba de finanças, lançamentos e mensalidades.",
      ),
      icon: <AttachMoneyIcon color="primary" />,
    },
    {
      key: "waha_communications" as const,
      label: t(
        "admin.dialogs.feature_flags.waha",
        "Notificações do WhatsApp (WAHA)",
      ),
      description: t(
        "admin.dialogs.feature_flags.waha_desc",
        "Integração automatizada para enviar convocações, equipes e resultados.",
      ),
      icon: <WhatsAppIcon color="success" />,
    },
    {
      key: "player_characteristics" as const,
      label: t(
        "admin.dialogs.feature_flags.characteristics",
        "Ficha de Atributos do Jogador",
      ),
      description: t(
        "admin.dialogs.feature_flags.characteristics_desc",
        "Visualização do Gráfico de Radar de 6 eixos para os jogadores.",
      ),
      icon: <StarIcon color="warning" />,
    },
    {
      key: "monthly_substitutions" as const,
      label: t(
        "admin.dialogs.feature_flags.substitutions",
        "Mensalistas Substitutos",
      ),
      description: t(
        "admin.dialogs.feature_flags.substitutions_desc",
        "Gerenciar substitutos temporários e permanentes no cadastro.",
      ),
      icon: <SwapHorizIcon color="info" />,
    },
    {
      key: "org_statistics" as const,
      label: t(
        "admin.dialogs.feature_flags.statistics",
        "Estatísticas & Analytics",
      ),
      description: t(
        "admin.dialogs.feature_flags.statistics_desc",
        "Painel de histórico de gols, artilharia, MVP e desempenho anual.",
      ),
      icon: <AssessmentIcon sx={{ color: theme.palette.secondary.main }} />,
    },
    {
      key: "peer_voting" as const,
      label: t("admin.dialogs.feature_flags.voting", "Votação Pós-Jogo"),
      description: t(
        "admin.dialogs.feature_flags.voting_desc",
        "Permitir votação de notas/estrelas entre membros após a pelada.",
      ),
      icon: <RateReviewIcon sx={{ color: "#9c27b0" }} />,
    },
    {
      key: "unlimited_members" as const,
      label: t(
        "admin.dialogs.feature_flags.unlimited_members",
        "Membros Ilimitados",
      ),
      description: t(
        "admin.dialogs.feature_flags.unlimited_members_desc",
        "Ignorar o limite de 15 membros para a organização.",
      ),
      icon: <PeopleIcon color="action" />,
    },
    {
      key: "unlimited_peladas" as const,
      label: t(
        "admin.dialogs.feature_flags.unlimited_peladas",
        "Peladas Ilimitadas",
      ),
      description: t(
        "admin.dialogs.feature_flags.unlimited_peladas_desc",
        "Burlar o limite de criação de no máximo 2 peladas por mês.",
      ),
      icon: <SportsSoccerIcon color="action" />,
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold" }}>
        {t("admin.dialogs.feature_flags.title", "Premium Feature Flags")}
      </DialogTitle>
      <DialogContent dividers>
        <DialogContentText sx={{ mb: 2 }}>
          {t(
            "admin.dialogs.feature_flags.description",
            "Ative ou desative os recursos Premium para a organização {{name}}.",
            { name: organization?.name },
          )}
        </DialogContentText>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <List dense disablePadding>
            {flagConfigs.map((cfg, idx) => (
              <Box key={cfg.key}>
                {idx > 0 && (
                  <Divider variant="inset" component="li" sx={{ my: 1 }} />
                )}
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>{cfg.icon}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {cfg.label}
                      </Typography>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary">
                        {cfg.description}
                      </Typography>
                    }
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      edge="end"
                      checked={flags ? !!flags[cfg.key] : false}
                      onChange={() => handleToggle(cfg.key)}
                      disabled={saving}
                      color="primary"
                      data-testid={`switch-${cfg.key}`}
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={saving} variant="outlined">
          {t("common.actions.cancel", "Cancelar")}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !flags}
          variant="contained"
          color="primary"
          sx={{ minWidth: 100 }}
        >
          {saving ? (
            <CircularProgress size={24} />
          ) : (
            t("common.actions.save", "Salvar")
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
