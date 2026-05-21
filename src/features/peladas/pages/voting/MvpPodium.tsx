import { Box, Typography, Grid, Paper } from "@mui/material";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import { useTranslation } from "react-i18next";
import { SecureAvatar } from "../../../../shared/components/SecureAvatar";

interface MvpPlayer {
  player_id: string;
  user_id?: string | null;
  name: string;
  average_stars: number;
  avatar_filename?: string | null;
}

interface MvpPodiumProps {
  mvp: MvpPlayer[];
}

export default function MvpPodium({ mvp }: MvpPodiumProps) {
  const { t } = useTranslation();

  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <EmojiEventsIcon color="primary" fontSize="large" />
        <Typography
          variant="h5"
          sx={{
            fontWeight: "bold",
          }}
        >
          {t("peladas.voting.results.mvp_title")}
        </Typography>
      </Box>

      <Grid
        container
        spacing={2}
        sx={{
          alignItems: "flex-end",
        }}
      >
        {/* 2nd Place */}
        <Grid size={{ xs: 4 }}>
          {mvp[1] && (
            <Box sx={{ textAlign: "center" }}>
              <SecureAvatar
                userId={mvp[1].user_id || "0"}
                filename={mvp[1].avatar_filename}
                sx={{
                  bgcolor: "grey.400",
                  width: 56,
                  height: 56,
                  mx: "auto",
                  mb: 1,
                }}
                fallbackText={mvp[1].name.charAt(0)}
              />
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: "bold",
                }}
              >
                {mvp[1].name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                {mvp[1].average_stars.toFixed(1)} ★
              </Typography>
              <Box
                sx={{
                  bgcolor: "grey.100",
                  height: 60,
                  mt: 1,
                  borderRadius: "8px 8px 0 0",
                }}
              />
            </Box>
          )}
        </Grid>

        {/* 1st Place */}
        <Grid size={{ xs: 4 }}>
          {mvp[0] && (
            <Box sx={{ textAlign: "center" }}>
              <EmojiEventsIcon sx={{ color: "gold", fontSize: 40, mb: 1 }} />
              <SecureAvatar
                userId={mvp[0].user_id || "0"}
                filename={mvp[0].avatar_filename}
                sx={{
                  bgcolor: "gold",
                  width: 80,
                  height: 80,
                  mx: "auto",
                  mb: 1,
                  border: "4px solid gold",
                }}
                fallbackText={mvp[0].name.charAt(0)}
              />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: "bold",
                }}
              >
                {mvp[0].name}
              </Typography>
              <Typography
                variant="subtitle1"
                color="primary"
                sx={{
                  fontWeight: "bold",
                }}
              >
                {mvp[0].average_stars.toFixed(1)} ★
              </Typography>
              <Box
                sx={{
                  bgcolor: "gold",
                  height: 100,
                  mt: 1,
                  borderRadius: "8px 8px 0 0",
                  opacity: 0.8,
                }}
              />
            </Box>
          )}
        </Grid>

        {/* 3rd Place */}
        <Grid size={{ xs: 4 }}>
          {mvp[2] && (
            <Box sx={{ textAlign: "center" }}>
              <SecureAvatar
                userId={mvp[2].user_id || "0"}
                filename={mvp[2].avatar_filename}
                sx={{
                  bgcolor: "brown",
                  width: 56,
                  height: 56,
                  mx: "auto",
                  mb: 1,
                }}
                fallbackText={mvp[2].name.charAt(0)}
              />
              <Typography
                variant="subtitle2"
                noWrap
                sx={{
                  fontWeight: "bold",
                }}
              >
                {mvp[2].name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                }}
              >
                {mvp[2].average_stars.toFixed(1)} ★
              </Typography>
              <Box
                sx={{
                  bgcolor: "grey.100",
                  height: 40,
                  mt: 1,
                  borderRadius: "8px 8px 0 0",
                }}
              />
            </Box>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
