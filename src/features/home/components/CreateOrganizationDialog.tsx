import { Dialog, DialogTitle, DialogContent, Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import CreateOrganizationForm from "../../organizations/components/CreateOrganizationForm";

interface CreateOrganizationDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export default function CreateOrganizationDialog({
  open,
  onClose,
  onCreate,
}: CreateOrganizationDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{t("home.actions.create_organization")}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <CreateOrganizationForm
            onCreate={async (name) => {
              await onCreate(name);
              onClose();
            }}
          />
        </Box>
      </DialogContent>
    </Dialog>
  );
}
