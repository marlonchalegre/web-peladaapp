import { Stack, TextField, Button } from "@mui/material";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  onCreate: (name: string) => Promise<void>;
};

export default function CreateOrganizationForm({ onCreate }: Props) {
  const { t } = useTranslation();

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
          inputProps={{ "data-testid": "org-name-input" }}
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
