import { Box, Typography, Paper, Chip } from "@mui/material";
import Grid from "@mui/material/Grid";
import GroupIcon from "@mui/icons-material/Group";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import { useTranslation } from "react-i18next";

interface Voter {
  player_id: string;
  name: string;
  has_voted: boolean;
}

interface VoterTransparencyProps {
  voters: Voter[];
}

export default function VoterTransparency({ voters }: VoterTransparencyProps) {
  const { t } = useTranslation();

  return (
    <Grid size={{ xs: 12 }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
          <GroupIcon color="action" />
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
            }}
          >
            {t("peladas.voting.results.voter_transparency")}
          </Typography>
        </Box>
        <Grid container spacing={2}>
          {voters.map((v) => (
            <Grid size={{ xs: 6, sm: 4, md: 3 }} key={v.player_id}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {v.has_voted ? (
                  <Chip
                    label={v.name}
                    color="success"
                    size="small"
                    icon={<SportsSoccerIcon />}
                    sx={{ width: "100%", justifyContent: "flex-start" }}
                  />
                ) : (
                  <Chip
                    label={v.name}
                    variant="outlined"
                    size="small"
                    sx={{
                      width: "100%",
                      justifyContent: "flex-start",
                      color: "text.secondary",
                      borderStyle: "dashed",
                    }}
                  />
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Grid>
  );
}
