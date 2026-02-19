import { Box, Typography, Paper, Button, Stack, Divider } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { useTranslation } from "react-i18next";
import { type OrganizationInvitation } from "../../../shared/api/endpoints";

type Props = {
  invitations: OrganizationInvitation[];
  onAccept: (token: string) => Promise<void>;
};

export default function PendingInvitations({ invitations, onAccept }: Props) {
  const { t } = useTranslation();

  if (invitations.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
        {t("home.sections.pending_invitations.title", "Convites Pendentes")}
      </Typography>
      <Paper variant="outlined" sx={{ p: 0, overflow: "hidden" }}>
        <Stack divider={<Divider />}>
          {invitations.map((inv) => (
            <Box
              key={inv.id}
              sx={{
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                bgcolor: "action.hover",
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight="bold">
                  {inv.organization_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t(
                    "home.sections.pending_invitations.invited_to_join",
                    "Você foi convidado para participar desta organização.",
                  )}
                </Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<CheckIcon />}
                onClick={() => onAccept(inv.token)}
                size="small"
              >
                {t("common.accept", "Aceitar")}
              </Button>
            </Box>
          ))}
        </Stack>
      </Paper>
    </Box>
  );
}
