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
} from "@mui/material";
import HistoryIcon from "@mui/icons-material/History";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import RateReviewIcon from "@mui/icons-material/RateReview";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import Divider from "@mui/material/Divider";

import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AssessmentIcon from "@mui/icons-material/Assessment";
import PrettyConfirmDialog from "../../../shared/components/PrettyConfirmDialog";
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
  onUpdatePlayersPerTeam: (count: number) => void;
  onRandomizeTeams: () => void;
  playersPerTeam: number;
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
  onUpdatePlayersPerTeam,
  onRandomizeTeams,
  playersPerTeam,
  changingStatus,
  processing,
  isAdminOverride = false,
}: PeladaDetailHeaderProps) {
  const { t } = useTranslation();
  const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);
  const [randomizeDialogOpen, setRandomizeDialogOpen] = useState(false);

  const handleOpenExport = (event: MouseEvent<HTMLElement>) => {
    setExportAnchor(event.currentTarget);
  };

  const handleCloseExport = () => {
    setExportAnchor(null);
  };

  return (
    <Box sx={{ mb: 4, pt: 1 }}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "stretch", lg: "center" },
        }}
      >
        {pelada.status === "open" && isAdminOverride ? (
          <Paper
            elevation={0}
            sx={{
              p: 1,
              borderRadius: 10,
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              flexDirection: "row",
              flexWrap: "nowrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: { xs: 1, sm: 2, md: 3 },
              px: { xs: 1.5, sm: 2, md: 3 },
              boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
              width: "100%",
              overflowX: "auto",
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
            }}
          >
            {/* Players Per Team Stepper */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <IconButton
                size="small"
                onClick={() => onUpdatePlayersPerTeam(playersPerTeam - 1)}
                disabled={playersPerTeam <= 1}
                data-testid="players-per-team-decrement"
                sx={{ bgcolor: "action.hover" }}
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Box sx={{ textAlign: "center", minWidth: { xs: 50, sm: 80 } }}>
                <Typography
                  variant="caption"
                  sx={{
                    display: "block",
                    fontWeight: 900,
                    fontSize: "0.6rem",
                    color: "text.secondary",
                    lineHeight: 1,
                  }}
                >
                  {t("peladas.detail.per_team")}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 900, lineHeight: 1 }}
                >
                  {playersPerTeam}
                </Typography>
              </Box>
              <IconButton
                size="small"
                onClick={() => onUpdatePlayersPerTeam(playersPerTeam + 1)}
                data-testid="players-per-team-increment"
                sx={{ bgcolor: "action.hover" }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Stack>

            <Divider orientation="vertical" flexItem />

            {/* Fixed Keepers Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={!!pelada.fixed_goalkeepers}
                  onChange={(e) => onToggleFixedGk(e.target.checked)}
                  disabled={processing}
                  color="primary"
                  data-testid="fixed-gk-toggle"
                  size="small"
                />
              }
              label={
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 900,
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                    color: pelada.fixed_goalkeepers
                      ? "primary.main"
                      : "text.secondary",
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                  }}
                >
                  {t("organizations.form.pelada.fixed_goalkeepers")}
                </Typography>
              }
              sx={{ mr: 0, ml: 0, flexShrink: 0 }}
            />

            <Divider orientation="vertical" flexItem />

            {/* Export/Copy Menu */}
            <Button
              variant="outlined"
              onClick={handleOpenExport}
              data-testid="export-menu-button"
              sx={{
                borderRadius: 10,
                textTransform: "none",
                fontWeight: 900,
                fontSize: "0.85rem",
                px: { xs: 1.5, sm: 2, md: 3 },
                minWidth: { xs: "44px", md: "auto" },
                flexShrink: 0,
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "primary.lighter",
                },
              }}
            >
              <ContentCopyIcon
                sx={{ mr: { xs: 0, md: 1 }, fontSize: "1.2rem" }}
              />
              <Box
                component="span"
                sx={{ display: { xs: "none", md: "inline" } }}
              >
                {t("common.actions.export")}
              </Box>
            </Button>

            <Divider orientation="vertical" flexItem />

            {/* Randomize Button */}
            <Button
              variant="outlined"
              onClick={() => setRandomizeDialogOpen(true)}
              disabled={processing}
              data-testid="randomize-teams-button"
              sx={{
                borderRadius: 10,
                textTransform: "none",
                fontWeight: 900,
                fontSize: "0.85rem",
                px: { xs: 1.5, sm: 2, md: 3 },
                minWidth: { xs: "44px", md: "auto" },
                flexShrink: 0,
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "primary.lighter",
                },
              }}
            >
              <ShuffleIcon sx={{ mr: { xs: 0, md: 1 } }} />
              <Box
                component="span"
                sx={{ display: { xs: "none", md: "inline" } }}
              >
                {t("peladas.detail.button.randomize")}
              </Box>
            </Button>

            {/* Main Session Action (Build Schedule / Start) */}
            {!pelada.has_schedule_plan ? (
              <Button
                component={RouterLink}
                to={`/peladas/${pelada.id}/build-schedule`}
                variant="contained"
                data-testid="build-schedule-button"
                sx={{
                  borderRadius: 10,
                  textTransform: "none",
                  fontWeight: 900,
                  fontSize: "0.85rem",
                  px: { xs: 2, sm: 3, md: 4 },
                  minWidth: { xs: "44px", md: "auto" },
                  flexShrink: 0,
                  boxShadow: "0 4px 14px rgba(25, 118, 210, 0.3)",
                }}
              >
                <CalendarTodayIcon sx={{ mr: { xs: 0, md: 1 } }} />
                <Box
                  component="span"
                  sx={{ display: { xs: "none", md: "inline" } }}
                >
                  {t("peladas.detail.button.build_schedule")}
                </Box>
              </Button>
            ) : (
              <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                <Button
                  component={RouterLink}
                  to={`/peladas/${pelada.id}/build-schedule`}
                  variant="outlined"
                  data-testid="build-schedule-button-edit"
                  sx={{
                    borderRadius: 10,
                    textTransform: "none",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    px: { xs: 1.5, sm: 2, md: 3 },
                    minWidth: { xs: "44px", md: "auto" },
                    borderColor: "divider",
                    color: "text.primary",
                  }}
                >
                  <CalendarTodayIcon sx={{ mr: { xs: 0, md: 1 } }} />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", md: "inline" } }}
                  >
                    {t("peladas.detail.button.build_schedule")}
                  </Box>
                </Button>
                <Button
                  variant="contained"
                  onClick={onStartClick}
                  disabled={changingStatus || processing}
                  data-testid="start-pelada-button"
                  sx={{
                    borderRadius: 10,
                    textTransform: "none",
                    fontWeight: 900,
                    fontSize: "0.85rem",
                    px: { xs: 2, sm: 3, md: 4 },
                    minWidth: { xs: "44px", md: "auto" },
                    boxShadow: "0 4px 14px rgba(25, 118, 210, 0.3)",
                  }}
                >
                  <PlayArrowIcon sx={{ mr: { xs: 0, md: 1 } }} />
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", md: "inline" } }}
                  >
                    {t("peladas.detail.button.start_pelada")}
                  </Box>
                </Button>
              </Stack>
            )}
          </Paper>
        ) : (
          /* Non-admin or non-open status view */
          <Stack
            direction="row"
            spacing={1.5}
            sx={{ width: "100%", justifyContent: "flex-end" }}
          >
            {/* Show "View Matches" only if pelada is not open/attendance */}
            {!["open", "attendance"].includes(pelada.status || "") && (
              <Button
                component={RouterLink}
                to={`/peladas/${pelada.id}/matches`}
                variant="outlined"
                startIcon={<HistoryIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: 10,
                  fontWeight: 900,
                  px: 3,
                }}
              >
                {t("peladas.detail.button.view_matches")}
              </Button>
            )}
            {(votingInfo?.can_vote || pelada.is_admin) &&
              pelada.status !== "open" &&
              pelada.status !== "attendance" && (
                <Button
                  component={RouterLink}
                  to={`/peladas/${pelada.id}/voting`}
                  variant="contained"
                  color={votingInfo?.has_voted ? "success" : "secondary"}
                  startIcon={<RateReviewIcon />}
                  sx={{
                    textTransform: "none",
                    borderRadius: 10,
                    fontWeight: 900,
                    px: 3,
                  }}
                >
                  {!votingInfo?.can_vote
                    ? t("peladas.detail.button.manage_voting")
                    : votingInfo.has_voted
                      ? t("peladas.detail.button.change_votes")
                      : t("peladas.detail.button.vote")}
                </Button>
              )}
            {pelada.status === "closed" && !votingInfo?.can_vote && (
              <Button
                component={RouterLink}
                to={`/peladas/${pelada.id}/results`}
                variant="outlined"
                color="primary"
                startIcon={<AssessmentIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: 10,
                  fontWeight: 900,
                  px: 3,
                }}
              >
                {t("peladas.detail.button.view_results")}
              </Button>
            )}
          </Stack>
        )}
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
          data-testid="copy-announcement-button"
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
          data-testid="copy-clipboard-button"
        >
          <ListItemIcon>
            <RateReviewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>
            {t("common.actions.export_evaluation", "Evaluation Version")}
          </ListItemText>
        </MenuItem>
      </Menu>

      <PrettyConfirmDialog
        open={randomizeDialogOpen}
        onClose={() => setRandomizeDialogOpen(false)}
        onConfirm={onRandomizeTeams}
        title={t("peladas.detail.randomize_dialog.title")}
        description={t("peladas.detail.randomize_dialog.description")}
        confirmLabel={t("peladas.detail.randomize_dialog.confirm")}
        cancelLabel={t("peladas.detail.randomize_dialog.cancel")}
        severity="primary"
      />
    </Box>
  );
}
