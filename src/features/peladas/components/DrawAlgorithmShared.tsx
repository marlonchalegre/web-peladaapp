import { Box, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

export function DrawSecondaryActions({
  processing,
  onOpenArrivalOrder,
  onOpenCaptainDraft,
  borderRadius = "12px",
}: {
  processing: boolean;
  onOpenArrivalOrder?: () => void;
  onOpenCaptainDraft?: () => void;
  borderRadius?: string;
}) {
  const { t } = useTranslation();
  if (!onOpenArrivalOrder && !onOpenCaptainDraft) return null;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1.25 }}>
      {onOpenArrivalOrder && (
        <Button
          fullWidth
          variant="outlined"
          size="small"
          disabled={processing}
          onClick={onOpenArrivalOrder}
          data-testid="open-arrival-order-button"
          sx={{ borderRadius, fontWeight: 700, py: 1 }}
        >
          {t("peladas.teams.arrival_order_btn", "Check-in / Ordem de Chegada")}
        </Button>
      )}
      {onOpenCaptainDraft && (
        <Button
          fullWidth
          variant="outlined"
          size="small"
          disabled={processing}
          onClick={onOpenCaptainDraft}
          data-testid="open-captain-draft-button"
          sx={{ borderRadius, fontWeight: 700, py: 1 }}
        >
          {t("peladas.teams.captain_draft_btn", "Tira-Time (Capitães)")}
        </Button>
      )}
    </Box>
  );
}
