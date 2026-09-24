import {
  Box,
  Typography,
  Link,
  Tooltip,
  type SxProps,
  type Theme,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import {
  formatLocationDisplay,
  getGoogleMapsUrl,
} from "../utils/locationUtils";

interface LocationDisplayProps {
  location?: string | null;
  showDot?: boolean;
  showIcon?: boolean;
  iconColor?: string;
  dotColor?: string;
  sx?: SxProps<Theme>;
  textSx?: SxProps<Theme>;
  dataTestId?: string;
}

export default function LocationDisplay({
  location,
  showDot = false,
  showIcon = false,
  iconColor = "#146b3a",
  dotColor = "#146b3a",
  sx,
  textSx,
  dataTestId = "location-display",
}: LocationDisplayProps) {
  const { t } = useTranslation();
  if (!location) return null;

  const shortName = formatLocationDisplay(location);
  const mapsUrl = getGoogleMapsUrl(location);

  return (
    <Tooltip
      title={t(
        "location.open_in_google_maps",
        `Abrir "${location}" no Google Maps`,
        {
          location,
        },
      )}
      arrow
      placement="top"
    >
      <Link
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        data-testid={dataTestId}
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.8,
          textDecoration: "none",
          color: "inherit",
          cursor: "pointer",
          borderRadius: "4px",
          transition: "opacity 0.15s ease",
          "&:hover": {
            opacity: 0.85,
            "& .location-display-text": {
              textDecoration: "underline",
            },
          },
          ...sx,
        }}
      >
        {showDot && (
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: dotColor,
              flexShrink: 0,
            }}
          />
        )}
        {showIcon && (
          <LocationOnIcon
            sx={{
              fontSize: 16,
              color: iconColor,
              flexShrink: 0,
            }}
          />
        )}
        <Typography
          className="location-display-text"
          component="span"
          sx={{
            fontFamily: "Archivo, sans-serif",
            fontWeight: 600,
            fontSize: "12.5px",
            color: "#4a4740",
            ...textSx,
          }}
        >
          {shortName}
        </Typography>
      </Link>
    </Tooltip>
  );
}
