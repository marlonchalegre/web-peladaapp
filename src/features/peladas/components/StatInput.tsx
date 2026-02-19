import {
  Box,
  IconButton,
  CircularProgress,
  Typography,
  alpha,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

interface StatInputProps {
  value: number;
  onChange: (diff: number) => void;
  disabled: boolean;
  loading?: boolean;
  testIdPrefix?: string;
}

export default function StatInput({
  value,
  onChange,
  disabled,
  loading = false,
  testIdPrefix,
}: StatInputProps) {
  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        bgcolor: alpha(theme.palette.action.active, 0.04),
        width: "fit-content",
        overflow: "hidden",
        position: "relative",
      })}
    >
      <IconButton
        size="small"
        onClick={() => onChange(-1)}
        disabled={disabled || value <= 0 || loading}
        data-testid={testIdPrefix ? `${testIdPrefix}-decrement` : undefined}
        sx={{
          borderRadius: 0,
          p: 0.5,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <RemoveIcon fontSize="small" />
      </IconButton>

      <Box
        sx={{
          width: 32,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.paper",
          borderLeft: 1,
          borderRight: 1,
          borderColor: "divider",
        }}
      >
        {loading ? (
          <CircularProgress size={16} />
        ) : (
          <Typography
            variant="body2"
            fontWeight="bold"
            data-testid={testIdPrefix ? `${testIdPrefix}-value` : undefined}
          >
            {value}
          </Typography>
        )}
      </Box>

      <IconButton
        size="small"
        onClick={() => onChange(1)}
        disabled={disabled || loading}
        data-testid={testIdPrefix ? `${testIdPrefix}-increment` : undefined}
        sx={{
          borderRadius: 0,
          p: 0.5,
          "&:hover": { bgcolor: "action.hover" },
        }}
      >
        <AddIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
