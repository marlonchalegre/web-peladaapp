import {
  Box,
  Stack,
  Typography,
  IconButton,
  Button,
  Paper,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
  Tooltip,
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DownloadIcon from "@mui/icons-material/Download";
import RateReviewIcon from "@mui/icons-material/RateReview";

import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import type { MouseEvent } from "react";
import { type Pelada, type VotingInfo } from "../../../shared/api/endpoints";

interface PeladaDetailHeaderProps {
  pelada: Pelada;
  votingInfo: VotingInfo | null;
  onStartClick: () => void;
  onCopyClipboard: () => void;

  onCopyAnnouncement: () => void;
  onToggleFixedGk: (enabled: boolean) => void;

  changingStatus: boolean;
  processing: boolean;
  isAdminOverride?: boolean;
}

export default function PeladaDetailHeader({
  pelada,
  votingInfo,
  onStartClick,
  onCopyClipboard,
  onCopyAnnouncement,
  onToggleFixedGk,

  changingStatus,
  processing,
  isAdminOverride = false,
}: PeladaDetailHeaderProps) {
  const { t } = useTranslation();
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

  const handleOpenExport = (event: MouseEvent<HTMLElement>) => {
    setExportAnchor(event.currentTarget);
  };

  const handleCloseExport = () => {
    setExportAnchor(null);
  };

  return (
    <Box sx={{ mb: 4, pt: 2 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
      >
        <Box>
          <Typography
            variant="overline"
            display="block"
            color="text.secondary"
            sx={{ lineHeight: 1, fontWeight: "bold" }}
          >
            {t("common.organization")}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: -1 }}>
            {t("peladas.detail.title", { id: pelada.id })}
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems="center"
        >
          {pelada.status === "open" && isAdminOverride && (
            <Paper
              variant="outlined"
              sx={{
                px: 2,
                py: 0.5,
                borderRadius: 3,
                display: "flex",
                alignItems: "center",
                bgcolor: pelada.fixed_goalkeepers
                  ? "primary.lighter"
                  : "transparent",
                borderColor: pelada.fixed_goalkeepers
                  ? "primary.main"
                  : "divider",
                transition: "all 0.2s",
              }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={!!pelada.fixed_goalkeepers}
                    onChange={(e) => onToggleFixedGk(e.target.checked)}
                    disabled={processing}
                    color="primary"
                    data-testid="fixed-gk-toggle"
                  />
                }
                label={
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: "bold",
                      color: pelada.fixed_goalkeepers
                        ? "primary.main"
                        : "text.secondary",
                    }}
                  >
                    {t("organizations.form.pelada.fixed_goalkeepers")}
                  </Typography>
                }
                sx={{ mr: 0 }}
              />
            </Paper>
          )}

          <Stack direction="row" spacing={1}>
            <Tooltip title={t("common.actions.export")}>
              <IconButton
                onClick={handleOpenExport}
                sx={{ border: "1px solid", borderColor: "divider" }}
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>

            <Button
              component={RouterLink}
              to={`/peladas/${pelada.id}/matches`}
              variant="outlined"
              startIcon={<HistoryIcon />}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontWeight: "bold",
              }}
            >
              {t("peladas.detail.button.view_matches")}
            </Button>
          </Stack>

          {pelada.status === "open" && isAdminOverride && (
            <Stack direction="row" spacing={1}>
              <Button
                component={RouterLink}
                to={`/peladas/${pelada.id}/build-schedule`}
                variant="outlined"
                startIcon={<CalendarTodayIcon />}
                data-testid="build-schedule-button"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  fontWeight: "bold",
                }}
              >
                {t("peladas.detail.button.build_schedule")}
              </Button>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={onStartClick}
                disabled={
                  changingStatus || processing || !pelada.has_schedule_plan
                }
                data-testid="start-pelada-button"
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  bgcolor: "primary.main",
                  fontWeight: 800,
                  px: 3,
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                {t("peladas.detail.button.start_pelada")}
              </Button>
            </Stack>
          )}

          {votingInfo?.can_vote && (
            <Button
              component={RouterLink}
              to={`/peladas/${pelada.id}/voting`}
              variant="contained"
              color={votingInfo.has_voted ? "success" : "secondary"}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                fontWeight: "bold",
                px: 3,
              }}
            >
              {votingInfo.has_voted
                ? t("peladas.detail.button.change_votes")
                : t("peladas.detail.button.vote")}
            </Button>
          )}
        </Stack>
      </Stack>

      <Menu
        anchorEl={exportAnchor}
        open={Boolean(exportAnchor)}
        onClose={handleCloseExport}
      >
        <MenuItem
          onClick={() => {
            onCopyAnnouncement();
            handleCloseExport();
          }}
        >
          <ListItemIcon>
            <WhatsAppIcon fontSize="small" color="success" />
          </ListItemIcon>

          <ListItemText>
            {t("common.actions.export_announcement", "Announcement Version")}
          </ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            onCopyClipboard();
            handleCloseExport();
          }}
        >
          <ListItemIcon>
            <RateReviewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t("common.actions.export_evaluation", "Evaluation Version")}
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
}
