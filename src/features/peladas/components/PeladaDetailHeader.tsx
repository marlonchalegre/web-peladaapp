import { Box, Stack, Typography, IconButton, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type Pelada, type VotingInfo } from "../../../shared/api/endpoints";

interface PeladaDetailHeaderProps {
  pelada: Pelada;
  votingInfo: VotingInfo | null;
  onStartClick: () => void;
  changingStatus: boolean;
  processing: boolean;
  isAdminOverride?: boolean;
}

export default function PeladaDetailHeader({
  pelada,
  votingInfo,
  onStartClick,
  changingStatus,
  processing,
  isAdminOverride = false,
}: PeladaDetailHeaderProps) {
  const { t } = useTranslation();

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
          component={RouterLink}
          to={`/peladas/${pelada.id}/matches`}
          variant="outlined"
          startIcon={<HistoryIcon />}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          {t("peladas.detail.button.view_matches")}
        </Button>

        {(pelada.status === "open" ||
          (pelada.status !== "closed" && isAdminOverride)) && (
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
    </Box>
  );
}
