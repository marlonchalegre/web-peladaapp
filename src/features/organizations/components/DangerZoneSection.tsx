import { Paper, Typography, Divider, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

interface DangerZoneSectionProps {
  orgName: string;
  onDeleteClick: () => void;
  actionLoading: boolean;
}

export default function DangerZoneSection({
  orgName,
  onDeleteClick,
  actionLoading,
}: DangerZoneSectionProps) {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ p: 3, borderColor: "error.main" }}>
      <Typography variant="h5" color="error" gutterBottom>
        {t("organizations.management.sections.danger_zone")}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="body2" sx={{ mb: 2 }}>
        {t("organizations.management.delete_description")}
      </Typography>
      <Button
        variant="contained"
        color="error"
        onClick={onDeleteClick}
        disabled={actionLoading}
      >
        {t("organizations.table.aria.delete", { name: orgName })}
      </Button>
    </Paper>
  );
}
