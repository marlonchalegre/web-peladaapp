import { Stack, TextField, Button, Alert } from "@mui/material";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  onCreate: (name: string) => Promise<void>;
  allowOrgCreation: boolean;
};

export default function CreateOrganizationForm({
  onCreate,
  allowOrgCreation,
}: Props) {
  const { t } = useTranslation();

  if (!allowOrgCreation) {
    return (
      <Alert severity="warning" sx={{ mt: 1 }}>
        {t(
          "organizations.create.permission_denied",
          "Você não tem permissão para criar organizações. Entre em contato com o administrador do sistema para criar uma nova organização.",
        )}
      </Alert>
    );
  }

  return (
    <form
      onSubmit={async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        const name = String(data.get("name") || "");
        if (!name) return;
        await onCreate(name);
        form.reset();
      }}
    >
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField
          name="name"
          label={t("common.fields.name")}
          required
          size="small"
          slotProps={{
            htmlInput: { "data-testid": "org-name-input" },
          }}
        />
        <Button
          type="submit"
          variant="contained"
          data-testid="org-submit-button"
        >
          {t("common.create")}
        </Button>
      </Stack>
    </form>
  );
}
