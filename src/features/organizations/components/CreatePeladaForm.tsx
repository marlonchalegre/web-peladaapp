import { useState } from "react";
import type { FormEvent } from "react";
import {
  Grid,
  Button,
  FormControlLabel,
  Switch,
  TextField,
} from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

export type CreatePeladaPayload = {
  organization_id: string;
  when: string;
  max_players?: number;
  notify_casual_players?: boolean;
};

type Props = {
  organizationId: string;
  defaultMaxPlayers?: number | null;
  onCreate: (payload: CreatePeladaPayload) => Promise<void>;
};

export default function CreatePeladaForm({
  organizationId,
  defaultMaxPlayers,
  onCreate,
}: Props) {
  const { t } = useTranslation();
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [time, setTime] = useState<Dayjs | null>(dayjs());
  const [maxPlayers, setMaxPlayers] = useState<string>(
    defaultMaxPlayers != null ? String(defaultMaxPlayers) : "",
  );
  const [notifyCasualPlayers, setNotifyCasualPlayers] = useState(true);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!date || !time) return;

    const when = date
      .hour(time.hour())
      .minute(time.minute())
      .second(0)
      .toISOString();

    const parsedMax = maxPlayers ? parseInt(maxPlayers, 10) : undefined;

    await onCreate({
      organization_id: organizationId,
      when,
      max_players: parsedMax && !isNaN(parsedMax) ? parsedMax : undefined,
      notify_casual_players: notifyCasualPlayers,
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
          <TextField
            fullWidth
            type="number"
            label={t(
              "organizations.form.pelada.max_players",
              "Máximo de Jogadores",
            )}
            value={maxPlayers}
            onChange={(e) => setMaxPlayers(e.target.value)}
            slotProps={{
              htmlInput: { min: 1, step: 1 },
            }}
            placeholder="Ex: 14"
            helperText={t(
              "organizations.form.pelada.max_players_help",
              "Limite de jogadores para essa pelada (opcional)",
            )}
            data-testid="create-pelada-max-players"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={notifyCasualPlayers}
                onChange={(e) => setNotifyCasualPlayers(e.target.checked)}
                name="notifyCasualPlayers"
              />
            }
            label={t(
              "organizations.form.pelada.notify_casual_players",
              "Avisar convidados e diaristas que a lista está aberta?",
            )}
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button
            fullWidth
            type="submit"
            variant="contained"
            size="large"
            data-testid="create-pelada-submit"
            data-analytics-id="create-pelada-submit-btn"
          >
            {t("organizations.form.pelada.submit")}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
