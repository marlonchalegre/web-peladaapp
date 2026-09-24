import { useState } from "react";
import type { FormEvent } from "react";
import {
  Grid,
  Button,
  FormControlLabel,
  Switch,
  TextField,
  Box,
} from "@mui/material";
import { DatePicker, TimePicker } from "@mui/x-date-pickers";
import { useTranslation } from "react-i18next";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import LocationAutocomplete from "../../../shared/components/LocationAutocomplete";

export type CreatePeladaPayload = {
  organization_id: string;
  when: string;
  max_players?: number;
  location?: string;
  notify_casual_players?: boolean;
};

type Props = {
  organizationId: string;
  defaultMaxPlayers?: number | null;
  defaultLocation?: string | null;
  onCreate: (payload: CreatePeladaPayload) => Promise<void>;
};

export default function CreatePeladaForm({
  organizationId,
  defaultMaxPlayers,
  defaultLocation,
  onCreate,
}: Props) {
  const { t } = useTranslation();
  const [date, setDate] = useState<Dayjs | null>(dayjs());
  const [time, setTime] = useState<Dayjs | null>(dayjs());
  const [maxPlayers, setMaxPlayers] = useState<string>(
    defaultMaxPlayers != null ? String(defaultMaxPlayers) : "",
  );
  const [location, setLocation] = useState(defaultLocation ?? "");
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
      location: location.trim() || undefined,
      notify_casual_players: notifyCasualPlayers,
    });
  };

  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "13px",
      bgcolor: "#ffffff",
      fontFamily: "'Archivo Narrow', Archivo, sans-serif",
      fontWeight: 700,
      "& fieldset": { borderColor: "#ddd8cc", borderWidth: "1.5px" },
      "&:hover fieldset": { borderColor: "#c9c4b6" },
      "&.Mui-focused fieldset": {
        borderColor: "#17181a",
        borderWidth: "1.5px",
      },
    },
    "& .MuiInputBase-input": {
      fontFamily: "'Archivo Narrow', Archivo, sans-serif",
      fontWeight: 700,
      fontSize: "19px",
      color: "#17181a",
    },
    "& .MuiInputLabel-root": {
      fontFamily: "Archivo, sans-serif",
      fontWeight: 700,
      fontSize: "10px",
      letterSpacing: ".14em",
      textTransform: "uppercase",
      color: "#6b675c",
    },
    "& .MuiInputLabel-root.Mui-focused": { color: "#17181a" },
    "& .MuiFormHelperText-root": {
      fontFamily: "Archivo, sans-serif",
      fontWeight: 600,
      color: "#6b675c",
    },
  } as const;

  return (
    <form onSubmit={handleSubmit}>
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 6 }}>
          <DatePicker
            label={t("common.fields.date")}
            value={date}
            onChange={(newValue) => setDate(newValue)}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                sx: fieldSx,
              },
            }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <TimePicker
            label={t("common.fields.time")}
            value={time}
            onChange={(newValue) => setTime(newValue)}
            ampm={false}
            slotProps={{
              textField: {
                fullWidth: true,
                required: true,
                sx: fieldSx,
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
            sx={fieldSx}
            placeholder="Ex: 14"
            helperText={t(
              "organizations.form.pelada.max_players_help",
              "Limite de jogadores para essa pelada (opcional)",
            )}
            data-testid="create-pelada-max-players"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <LocationAutocomplete
            label={t("organizations.form.pelada.location", "Local")}
            value={location}
            onChange={(val) => setLocation(val)}
            placeholder={t(
              "organizations.form.pelada.location_placeholder",
              "Ex: Arena Vila Nova · Q2",
            )}
            inputSx={fieldSx}
            dataTestId="create-pelada-location"
          />
        </Grid>
        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={
              <Switch
                checked={notifyCasualPlayers}
                onChange={(e) => setNotifyCasualPlayers(e.target.checked)}
                name="notifyCasualPlayers"
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": { color: "#146b3a" },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: "#146b3a",
                  },
                }}
              />
            }
            label={
              <Box
                component="span"
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "12.5px",
                  lineHeight: 1.35,
                  color: "#4a4740",
                }}
              >
                {t(
                  "organizations.form.pelada.notify_casual_players",
                  "Avisar convidados e diaristas que a lista está aberta?",
                )}
              </Box>
            }
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
            sx={{
              bgcolor: "#146b3a",
              color: "#ffffff",
              borderRadius: "13px",
              py: 1.5,
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "15px",
              letterSpacing: ".06em",
              boxShadow: "0 3px 0 #0d4526",
              "&:hover": { bgcolor: "#0e5c31" },
            }}
          >
            {t("organizations.form.pelada.submit")}
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
