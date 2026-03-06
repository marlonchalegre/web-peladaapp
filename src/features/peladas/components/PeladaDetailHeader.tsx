import {
  Box,
  Stack,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  FormControlLabel,
  Switch,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
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
    <Box
      sx={{
        mb: 4,
        pt: 2,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <IconButton
          component={RouterLink}
          to={`/organizations/${pelada.organization_id}`}
          sx={{ mr: 2 }}
          aria-label={t("common.back_to_org")}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography
            variant="overline"
            display="block"
            color="text.secondary"
            sx={{ lineHeight: 1 }}
          >
            {t("common.organization")}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: "bold" }}>
            {t("peladas.detail.title", { id: pelada.id })}
          </Typography>
        </Box>
      </Box>

      <Stack direction="row" spacing={2} alignItems="center">
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleOpenExport}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          {t("common.actions.export", "Export")}
        </Button>

        <Button
          component={RouterLink}
          to={`/peladas/${pelada.id}/matches`}
          variant="outlined"
          startIcon={<HistoryIcon />}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          {t("peladas.detail.button.view_matches")}
        </Button>

        {pelada.status === "open" && isAdminOverride && (
          <>
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
              label={t("organizations.form.pelada.fixed_goalkeepers")}
              sx={{ ml: 1 }}
            />
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={onStartClick}
              disabled={changingStatus || processing}
              data-testid="start-pelada-button"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                bgcolor: "primary.dark",
                fontWeight: "bold",
              }}
            >
              {t("peladas.detail.button.start_pelada")}
            </Button>
          </>
        )}

        {votingInfo?.can_vote && (
          <Button
            component={RouterLink}
            to={`/peladas/${pelada.id}/voting`}
            variant="contained"
            color={votingInfo.has_voted ? "success" : "secondary"}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {votingInfo.has_voted
              ? t("peladas.detail.button.change_votes")
              : t("peladas.detail.button.vote")}
          </Button>
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
