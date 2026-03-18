import { useState } from "react";
import type { FormEvent } from "react";
import { Grid, Button } from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

export type CreatePeladaPayload = {
  organization_id: number;
  when: string;
};

type Props = {
  organizationId: number;
  onCreate: (payload: CreatePeladaPayload) => Promise<void>;
};

export default function CreatePeladaForm({ organizationId, onCreate }: Props) {
  const { t } = useTranslation();
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [time, setTime] = useState<Dayjs | null>(dayjs());

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !time) return;

    const when = date
      .hour(time.hour())
      .minute(time.minute())
      .second(0)
      .format("YYYY-MM-DDTHH:mm:ss");

    await onCreate({
      organization_id: organizationId,
      when,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DatePicker
            label={t("common.fields.date")}
            value={date}
            onChange={(newValue) => setDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TimePicker
            label={t("common.fields.time")}
            value={time}
            onChange={(newValue) => setTime(newValue)}
            ampm={false}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            data-testid="create-pelada-submit"
          >
            {t("organizations.form.pelada.submit")}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
