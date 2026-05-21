import { Card, CardContent, Box, Typography, Stack, Chip } from "@mui/material";
import Grid from "@mui/material/Grid";
import SportsSoccerIcon from "@mui/icons-material/SportsSoccer";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { useTranslation } from "react-i18next";

interface AwardPlayer {
  player_id: string;
  user_id?: string;
  name: string;
  goals: number;
  assists: number;
  average_stars: number;
  avatar_filename?: string | null;
}

interface SpecialAwardsProps {
  striker: AwardPlayer[];
  garcom: AwardPlayer[];
}

export default function SpecialAwards({ striker, garcom }: SpecialAwardsProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Special Awards - Striker */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <SportsSoccerIcon color="error" />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                }}
              >
                {t("peladas.voting.results.top_scorer")}
              </Typography>
            </Box>
            <Stack spacing={2}>
              {striker.slice(0, 3).map((s, i) => (
                <Box
                  key={s.player_id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        color: "text.secondary",
                      }}
                    >
                      {i + 1}º
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: "medium",
                      }}
                    >
                      {s.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${s.goals} Gols`}
                    size="small"
                    color="error"
                    variant="outlined"
                  />
                </Box>
              ))}
              {striker.length === 0 && (
                <Typography
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  {t("peladas.voting.results.no_awards")}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Special Awards - Assists */}
      <Grid size={{ xs: 12, md: 6 }}>
        <Card variant="outlined" sx={{ borderRadius: 4 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <RestaurantIcon color="info" />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                }}
              >
                {t("peladas.voting.results.top_assists")}
              </Typography>
            </Box>
            <Stack spacing={2}>
              {garcom.slice(0, 3).map((g, i) => (
                <Box
                  key={g.player_id}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        color: "text.secondary",
                      }}
                    >
                      {i + 1}º
                    </Typography>
                    <Typography
                      sx={{
                        fontWeight: "medium",
                      }}
                    >
                      {g.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${g.assists} Assis.`}
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                </Box>
              ))}
              {garcom.length === 0 && (
                <Typography
                  sx={{
                    color: "text.secondary",
                  }}
                >
                  {t("peladas.voting.results.no_awards")}
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </>
  );
}
