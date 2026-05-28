import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Slider,
  CircularProgress,
  useTheme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { type Player } from "../../../shared/api/endpoints";

interface PlayerRadarDialogProps {
  open: boolean;
  onClose: () => void;
  player: Player | null;
  userName: string;
  onUpdatePlayer: (
    playerId: string,
    payload: Partial<Player>,
  ) => Promise<void> | void;
  actionLoading: boolean;
}

const CENTER = 150;
const RADIUS = 100;
const TOTAL_SIDES = 6;

const ATTRIBUTES = [
  { key: "passing", label: "common.characteristics.passing" },
  { key: "ball_control", label: "common.characteristics.ball_control" },
  { key: "carrying", label: "common.characteristics.carrying" },
  { key: "shooting", label: "common.characteristics.shooting" },
  { key: "dribbling", label: "common.characteristics.dribbling" },
  { key: "defending", label: "common.characteristics.defending" },
] as const;

const getAngle = (i: number) => {
  return i * ((2 * Math.PI) / TOTAL_SIDES) - Math.PI / 2;
};

export default function PlayerRadarDialog({
  open,
  onClose,
  player,
  userName,
  onUpdatePlayer,
  actionLoading,
}: PlayerRadarDialogProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [isSaving, setIsSaving] = useState(false);

  const [draftValues, setDraftValues] = useState({
    passing: 0,
    ball_control: 0,
    carrying: 0,
    shooting: 0,
    dribbling: 0,
    defending: 0,
  });

  useEffect(() => {
    if (player) {
      setDraftValues({
        passing: player.passing ?? 0,
        ball_control: player.ball_control ?? 0,
        carrying: player.carrying ?? 0,
        shooting: player.shooting ?? 0,
        dribbling: player.dribbling ?? 0,
        defending: player.defending ?? 0,
      });
    }
  }, [player]);

  const handleSave = async () => {
    if (!player) return;
    setIsSaving(true);
    try {
      await onUpdatePlayer(player.id, draftValues);
      onClose();
    } catch (err) {
      console.error("Failed to update characteristics", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSliderChange = (key: keyof typeof draftValues, value: number) => {
    setDraftValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Generate levels for spiderweb background (levels 1 to 5)
  const levels = [1, 2, 3, 4, 5];
  const levelHexagons = levels.map((level) => {
    const r = (level / 5) * RADIUS;
    const points = Array.from({ length: TOTAL_SIDES }).map((_, i) => {
      const angle = getAngle(i);
      const x = CENTER + r * Math.cos(angle);
      const y = CENTER + r * Math.sin(angle);
      return `${x},${y}`;
    });
    return points.join(" ");
  });

  // Generate axis lines going from center to outer level corners
  const axisLines = Array.from({ length: TOTAL_SIDES }).map((_, i) => {
    const angle = getAngle(i);
    const x = CENTER + RADIUS * Math.cos(angle);
    const y = CENTER + RADIUS * Math.sin(angle);
    return { x, y };
  });

  // Calculate coordinates for attribute text labels
  const labelOffset = 22;
  const labels = Array.from({ length: TOTAL_SIDES }).map((_, i) => {
    const angle = getAngle(i);
    const extraX = i === 1 || i === 2 ? 10 : i === 4 || i === 5 ? -10 : 0;
    const extraY = i === 0 ? -12 : i === 3 ? 12 : 0;
    const x = CENTER + (RADIUS + labelOffset) * Math.cos(angle) + extraX;
    const y = CENTER + (RADIUS + labelOffset) * Math.sin(angle) + extraY;

    let textAnchor: "middle" | "start" | "end" = "middle";
    if (i === 1 || i === 2) textAnchor = "start";
    if (i === 4 || i === 5) textAnchor = "end";

    return { x, y, textAnchor, attr: ATTRIBUTES[i] };
  });

  // Calculate data polygon path
  const dataPoints = ATTRIBUTES.map((attr, i) => {
    const val = draftValues[attr.key] || 0;
    const r = (val / 5) * RADIUS;
    const angle = getAngle(i);
    const x = CENTER + r * Math.cos(angle);
    const y = CENTER + r * Math.sin(angle);
    return { x, y };
  });
  const dataPolygonPoints = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const isLoading = actionLoading || isSaving;

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            backgroundImage: "none",
            bgcolor: "background.paper",
            p: { xs: 1, sm: 2 },
          },
        },
      }}
      data-testid="player-radar-dialog"
    >
      <DialogTitle sx={{ pb: 1, fontWeight: "bold" }}>
        <Typography variant="h5" component="span" sx={{ fontWeight: "bold" }}>
          {userName}
        </Typography>
        <Typography
          variant="subtitle2"
          component="div"
          color="text.secondary"
          sx={{ mt: 0.5 }}
        >
          {t("common.characteristics.title", "Características do Jogador")}
        </Typography>
      </DialogTitle>
      <DialogContent dividers sx={{ borderColor: "divider" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: "center",
            justifyContent: "space-around",
            gap: { xs: 4, md: 2 },
            py: 2,
          }}
        >
          {/* Left Column: Radar Chart */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: { xs: 260, sm: 300 },
              height: { xs: 260, sm: 300 },
            }}
          >
            <svg
              viewBox="0 0 300 300"
              width="100%"
              height="100%"
              style={{ overflow: "visible" }}
            >
              {/* Concentric grid hexagons */}
              {levelHexagons.map((points, idx) => (
                <polygon
                  key={idx}
                  points={points}
                  fill="none"
                  stroke={theme.palette.divider}
                  strokeWidth="1"
                />
              ))}

              {/* Axis grid lines */}
              {axisLines.map((point, idx) => (
                <line
                  key={idx}
                  x1={CENTER}
                  y1={CENTER}
                  x2={point.x}
                  y2={point.y}
                  stroke={theme.palette.divider}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Attribute text labels */}
              {labels.map((label, idx) => (
                <text
                  key={idx}
                  x={label.x}
                  y={label.y}
                  textAnchor={label.textAnchor}
                  dominantBaseline="middle"
                  fill={theme.palette.text.secondary}
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: theme.typography.fontFamily,
                  }}
                >
                  {t(label.attr.label)}
                </text>
              ))}

              {/* Player stats fill polygon */}
              <polygon
                points={dataPolygonPoints}
                fill={
                  theme.palette.mode === "light"
                    ? "rgba(37, 99, 235, 0.25)"
                    : "rgba(99, 102, 241, 0.25)"
                }
                stroke={
                  theme.palette.mode === "light"
                    ? theme.palette.primary.main
                    : theme.palette.secondary.main
                }
                strokeWidth="2.5"
                strokeLinejoin="round"
                style={{ transition: "points 0.3s ease" }}
              />

              {/* Individual vertex dots */}
              {dataPoints.map((point, idx) => (
                <circle
                  key={idx}
                  cx={point.x}
                  cy={point.y}
                  r="4.5"
                  fill={
                    theme.palette.mode === "light"
                      ? theme.palette.primary.main
                      : theme.palette.secondary.main
                  }
                  stroke={theme.palette.background.paper}
                  strokeWidth="1.5"
                />
              ))}
            </svg>
          </Box>

          {/* Right Column: Sliders */}
          <Box
            sx={{
              width: "100%",
              maxWidth: 400,
              display: "flex",
              flexDirection: "column",
              gap: 2.5,
              px: { xs: 1, sm: 2 },
            }}
          >
            {ATTRIBUTES.map((attr) => {
              const currentVal = draftValues[attr.key] || 0;
              return (
                <Box key={attr.key}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: "600" }}>
                      {t(attr.label)}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="primary"
                      sx={{ fontWeight: "bold" }}
                    >
                      {currentVal} / 5
                    </Typography>
                  </Box>
                  <Slider
                    value={currentVal}
                    min={0}
                    max={5}
                    step={1}
                    onChange={(_e, val) =>
                      handleSliderChange(attr.key, val as number)
                    }
                    disabled={isLoading}
                    marks={[
                      { value: 0, label: "0" },
                      { value: 1 },
                      { value: 2 },
                      { value: 3 },
                      { value: 4 },
                      { value: 5, label: "5" },
                    ]}
                    valueLabelDisplay="auto"
                    slotProps={{
                      markLabel: {
                        sx: {
                          fontSize: "0.75rem",
                          color: "text.secondary",
                        },
                      },
                    }}
                    sx={{
                      py: 1,
                      "& .MuiSlider-mark": {
                        backgroundColor: "divider",
                        height: 4,
                        width: 4,
                        "&.MuiSlider-markActive": {
                          backgroundColor: "currentColor",
                        },
                      },
                    }}
                    data-testid={`slider-${attr.key}`}
                  />
                </Box>
              );
            })}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          disabled={isLoading}
          variant="outlined"
          color="inherit"
        >
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isLoading}
          variant="contained"
          color="primary"
          startIcon={
            isLoading ? <CircularProgress size={16} color="inherit" /> : null
          }
          data-testid="radar-dialog-save-button"
        >
          {t("common.update", "Salvar")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
