import { useMemo } from "react";
import type { FormEvent } from "react";
import { Grid, TextField, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

export type CreatePeladaPayload = {
  organization_id: number;
  when: string;
  num_teams: number;
  players_per_team: number;
};

type Props = {
  organizationId: number;
  onCreate: (payload: CreatePeladaPayload) => Promise<void>;
};

export default function CreatePeladaForm({ organizationId, onCreate }: Props) {
  const { t } = useTranslation();
  const { defaultDate, defaultTime } = useMemo(() => {
    const now = new Date();
    const pad2 = (n: number) => String(n).padStart(2, "0");
    return {
      defaultDate: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
      defaultTime: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
    };
  }, []);

  return (
    <form
      onSubmit={async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formEl = e.currentTarget;
        const data = new FormData(formEl);
        const date = String(data.get("date") || "");
        const time = String(data.get("time") || "");
        const when = date && time ? `${date}T${time}` : "";
        const numTeams = Number(data.get("num_teams") || 2);
        const playersPerTeam = Number(data.get("players_per_team") || 5);
        if (!when) return;
        if (numTeams < 2 || playersPerTeam < 1) return;
        await onCreate({
          organization_id: organizationId,
          when,
          num_teams: numTeams,
          players_per_team: playersPerTeam,
        });
        formEl?.reset();
      }}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            name="date"
            type="date"
            label={t("common.fields.date")}
            InputLabelProps={{ shrink: true }}
            required
            defaultValue={defaultDate}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            name="time"
            type="time"
            label={t("common.fields.time")}
            InputLabelProps={{ shrink: true }}
            required
            defaultValue={defaultTime}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            name="num_teams"
            type="number"
            label={t("organizations.form.pelada.teams_count")}
            inputProps={{ min: 2 }}
            defaultValue={2}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            name="players_per_team"
            type="number"
            label={t("organizations.form.pelada.players_per_team")}
            inputProps={{ min: 1 }}
            defaultValue={5}
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
