import { Box, CircularProgress, Typography, alpha } from "@mui/material";

interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loading = ({ message, fullScreen = false }: LoadingProps) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: fullScreen ? "100vh" : "50vh",
        width: "100%",
        p: 3,
      }}
    >
      <Box
        sx={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress
          variant="determinate"
          sx={{
            color: (theme) => alpha(theme.palette.primary.main, 0.2),
          }}
          size={60}
          thickness={4}
          value={100}
        />
        <CircularProgress
          variant="indeterminate"
          disableShrink
          sx={{
            color: (theme) => theme.palette.primary.main,
            animationDuration: "550ms",
            position: "absolute",
            left: 0,
          }}
          size={60}
          thickness={4}
        />
      </Box>
      {message && (
        <Typography
          variant="body1"
          sx={{
            mt: 3,
            color: "text.secondary",
            fontWeight: 500,
            letterSpacing: 0.5,
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};
