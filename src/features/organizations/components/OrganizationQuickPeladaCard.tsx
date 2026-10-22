import { useState, useEffect } from "react";
import { Box, Typography, Switch } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { Organization } from "../../../shared/api/endpoints";
import LocationAutocomplete from "../../../shared/components/LocationAutocomplete";

interface OrganizationQuickPeladaCardProps {
  org: Organization;
  onCreatePeladaSuccess: () => void;
  onCreatePeladaQuick?: (data: {
    date: string;
    time: string;
    maxPlayers: number;
    location: string;
  }) => Promise<void>;
}

export default function OrganizationQuickPeladaCard({
  org,
  onCreatePeladaSuccess,
  onCreatePeladaQuick,
}: OrganizationQuickPeladaCardProps) {
  const { t } = useTranslation();

  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [newTime, setNewTime] = useState("19:00");
  const [newMax, setNewMax] = useState(org.default_max_players ?? 24);
  const [newLocation, setNewLocation] = useState(org.default_location ?? "");
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (org.default_location !== undefined && org.default_location !== null) {
      setNewLocation(org.default_location);
    }
  }, [org.default_location]);

  useEffect(() => {
    if (
      org.default_max_players !== undefined &&
      org.default_max_players !== null
    ) {
      setNewMax(org.default_max_players);
    }
  }, [org.default_max_players]);

  const handleCreate = async () => {
    if (!onCreatePeladaQuick) return;
    setCreating(true);
    try {
      await onCreatePeladaQuick({
        date: newDate,
        time: newTime,
        maxPlayers: newMax,
        location: newLocation,
      });
      onCreatePeladaSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: (theme) =>
          theme.palette.mode === "dark"
            ? `1px solid ${theme.palette.divider}`
            : theme.palette.brutalist?.border ||
              `2px solid ${theme.palette.divider}`,
        borderRadius: "20px",
        overflow: "hidden",
        boxShadow: (theme) =>
          theme.palette.mode === "dark"
            ? "0 4px 20px rgba(0,0,0,0.5)"
            : theme.palette.brutalist?.shadow ||
              `6px 6px 0 ${theme.palette.divider}`,
        mb: 3.5,
      }}
    >
      <Box
        sx={{
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "action.hover" : "text.primary",
          p: "12px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 800,
            fontSize: "11.5px",
            letterSpacing: ".1em",
            color: (theme) =>
              theme.palette.mode === "dark"
                ? "text.primary"
                : "background.paper",
          }}
        >
          {t("organizations.detail.new_pelada", "NOVA PELADA")}
        </Typography>
        <Typography
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 700,
            fontSize: "10px",
            letterSpacing: ".06em",
            color: "text.secondary",
          }}
        >
          {t("organizations.detail.schedule_next", "AGENDAR A PRÓXIMA")}
        </Typography>
      </Box>
      <Box sx={{ p: "18px 20px" }}>
        <Box sx={{ display: "flex", gap: 1.4, alignItems: "stretch" }}>
          {/* DATA */}
          <Box
            sx={{
              flex: 1.2,
              border: "1.5px solid",
              borderColor: "divider",
              borderRadius: "13px",
              p: "11px 13px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                letterSpacing: ".14em",
                color: "text.secondary",
              }}
            >
              {t("organizations.detail.date_label", "DATA")}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "19px",
                color: "text.primary",
                mt: 1,
              }}
            >
              <Box
                component="input"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                sx={{
                  border: "none",
                  outline: "none",
                  bgcolor: "transparent",
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "19px",
                  color: "text.primary",
                  colorScheme: (theme) => theme.palette.mode,
                  mt: 1,
                  p: 0,
                  width: "100%",
                }}
              />
            </Typography>
          </Box>

          {/* HORA */}
          <Box
            sx={{
              flex: 0.8,
              border: "1.5px solid",
              borderColor: "divider",
              borderRadius: "13px",
              p: "11px 13px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                letterSpacing: ".14em",
                color: "text.secondary",
              }}
            >
              {t("organizations.detail.time_label", "HORA")}
            </Typography>
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "19px",
                color: "text.primary",
                mt: 1,
              }}
            >
              <Box
                component="input"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                sx={{
                  border: "none",
                  outline: "none",
                  bgcolor: "transparent",
                  fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "19px",
                  color: "text.primary",
                  colorScheme: (theme) => theme.palette.mode,
                  mt: 1,
                  p: 0,
                  width: "100%",
                }}
              />
            </Typography>
          </Box>

          {/* MÁXIMO with - / + buttons */}
          <Box
            sx={{
              flex: 1.2,
              border: "1.5px solid",
              borderColor: "divider",
              borderRadius: "13px",
              p: "11px 13px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "8.5px",
                  letterSpacing: ".14em",
                  color: "text.secondary",
                }}
              >
                {t("organizations.detail.max_label", "MÁXIMO")}
              </Typography>
              <Box
                data-testid="create-pelada-max-players"
                sx={{ display: "inline-block", mt: 1 }}
              >
                <Box
                  component="input"
                  type="number"
                  value={newMax}
                  onChange={(e) => setNewMax(parseInt(e.target.value, 10) || 0)}
                  sx={{
                    border: "none",
                    outline: "none",
                    bgcolor: "transparent",
                    fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "19px",
                    color: "text.primary",
                    width: "48px",
                    p: 0,
                    m: 0,
                  }}
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 0.8 }}>
              <Box
                component="button"
                onClick={() => setNewMax((m) => Math.max(10, m - 2))}
                sx={{
                  width: 30,
                  height: 30,
                  border: "1.5px solid",
                  borderColor: "divider",
                  borderRadius: "9px",
                  bgcolor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "14px",
                  color: "text.secondary",
                  cursor: "pointer",
                  "&:hover": {
                    borderColor: "text.primary",
                    color: "text.primary",
                  },
                }}
              >
                –
              </Box>
              <Box
                component="button"
                onClick={() => setNewMax((m) => Math.min(40, m + 2))}
                sx={{
                  width: 30,
                  height: 30,
                  border: "1.5px solid",
                  borderColor: "divider",
                  borderRadius: "9px",
                  bgcolor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "14px",
                  color: "text.primary",
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                +
              </Box>
            </Box>
          </Box>

          {/* LOCAL */}
          <Box
            sx={{
              flex: 1.6,
              border: "1.5px solid",
              borderColor: "divider",
              borderRadius: "13px",
              p: "9px 13px",
              minWidth: 160,
            }}
          >
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                letterSpacing: ".14em",
                color: "text.secondary",
              }}
            >
              {t("organizations.detail.location_label", "LOCAL")}
            </Typography>
            <LocationAutocomplete
              value={newLocation}
              onChange={(val) => setNewLocation(val)}
              placeholder="Ex: Arena Vila Nova · Q2"
              variant="standard"
              fullWidth
              dataTestId="desktop-quick-pelada-location"
              inputSx={{
                "& .MuiInput-root": {
                  mt: 0.5,
                  "&::before, &::after": { display: "none" },
                },
                "& .MuiInputBase-input": {
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 600,
                  fontSize: "13.5px",
                  lineHeight: 1.2,
                  color: "text.primary",
                  p: 0,
                  "&::placeholder": {
                    color: "text.secondary",
                    opacity: 1,
                  },
                },
              }}
            />
          </Box>

          {/* CRIAR PELADA BUTTON */}
          <Box
            component="button"
            data-testid="create-pelada-submit"
            onClick={handleCreate}
            disabled={creating}
            sx={{
              border: "none",
              borderRadius: "13px",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              px: 3.5,
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "14px",
              letterSpacing: ".06em",
              cursor: "pointer",
              boxShadow: (theme) => `0 3px 0 ${theme.palette.primary.dark}`,
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            {creating
              ? t("organizations.detail.creating", "CRIANDO...")
              : t("organizations.detail.create_pelada", "CRIAR PELADA")}
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2 }}>
          <Switch
            checked={notifyMembers}
            onChange={(e) => setNotifyMembers(e.target.checked)}
            size="small"
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": {
                color: "primary.main",
              },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: "primary.main",
              },
            }}
          />
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 600,
              fontSize: "12.5px",
              color: "text.secondary",
            }}
          >
            {t(
              "organizations.detail.notify_casual",
              "Avisar diaristas e convidados que a lista abriu",
            )}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
