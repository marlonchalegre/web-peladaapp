import { Box, Typography, Paper, useTheme, alpha } from "@mui/material";
import {
  LockOutlined as LockIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";

export interface PremiumFeatureLockProps {
  title: string;
  description: string;
  benefits?: string[];
}

export function PremiumFeatureLock({
  title,
  description,
  benefits = [],
}: PremiumFeatureLockProps) {
  const { t } = useTranslation();
  const theme = useTheme();

  const containerStyle = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "350px",
    p: { xs: 3, md: 5 },
    textAlign: "center",
    borderRadius: "16px",
    background:
      theme.palette.mode === "dark"
        ? "linear-gradient(135deg, rgba(25, 25, 25, 0.8) 0%, rgba(35, 35, 35, 0.8) 100%)"
        : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(245, 247, 250, 0.9) 100%)",
    backdropFilter: "blur(10px)",
    border: `1px solid ${
      theme.palette.mode === "dark"
        ? "rgba(255, 255, 255, 0.08)"
        : "rgba(0, 0, 0, 0.06)"
    }`,
    boxShadow:
      theme.palette.mode === "dark"
        ? "0 8px 32px 0 rgba(0, 0, 0, 0.3)"
        : "0 8px 32px 0 rgba(31, 38, 135, 0.05)",
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2 } }}>
      <Paper sx={containerStyle} elevation={0}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 72,
            height: 72,
            borderRadius: "50%",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: "primary.main",
            mb: 3,
            animation: "pulse 2s infinite ease-in-out",
            "@keyframes pulse": {
              "0%": {
                transform: "scale(1)",
                boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0.4)}`,
              },
              "70%": {
                transform: "scale(1.05)",
                boxShadow: `0 0 0 12px ${alpha(theme.palette.primary.main, 0)}`,
              },
              "100%": {
                transform: "scale(1)",
                boxShadow: `0 0 0 0 ${alpha(theme.palette.primary.main, 0)}`,
              },
            },
          }}
        >
          <LockIcon sx={{ fontSize: 36 }} />
        </Box>

        <Typography
          variant="h5"
          sx={{ fontWeight: 800, mb: 1, color: "text.primary" }}
        >
          {title}
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 500, mb: 4, mx: "auto", lineHeight: 1.6 }}
        >
          {description}
        </Typography>

        {benefits.length > 0 && (
          <Box
            sx={{
              mb: 4,
              width: "100%",
              maxWidth: 450,
              textAlign: "left",
              mx: "auto",
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 2,
                textTransform: "uppercase",
                letterSpacing: 1,
                color: "text.secondary",
              }}
            >
              {t("common.premium.benefits_title", "Vantagens Inclusas:")}
            </Typography>
            {benefits.map((benefit, idx) => (
              <Box
                key={idx}
                sx={{ display: "flex", alignItems: "flex-start", mb: 1.5 }}
              >
                <ChevronRightIcon color="primary" sx={{ mr: 1, mt: 0.2 }} />
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontWeight: 500 }}
                >
                  {benefit}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", fontStyle: "italic" }}
        >
          {t(
            "common.premium.activation_notice",
            "Contate o Administrador Global do PeladaApp para liberar este recurso.",
          )}
        </Typography>
      </Paper>
    </Box>
  );
}
