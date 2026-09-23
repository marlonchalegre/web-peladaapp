import { useState, useEffect, useRef, useMemo } from "react";
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";

export interface LocationSuggestion {
  place_id: number | string;
  display_name: string;
  name?: string;
  lat?: string;
  lon?: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: "small" | "medium";
  variant?: "standard" | "outlined" | "filled";
  sx?: SxProps<Theme>;
  inputSx?: SxProps<Theme>;
  dataTestId?: string;
  debounceMs?: number;
}

export default function LocationAutocomplete({
  value,
  onChange,
  label,
  placeholder = "Ex: Arena Vila Nova · Q2",
  helperText,
  error,
  disabled,
  fullWidth = true,
  size = "medium",
  variant = "outlined",
  sx,
  inputSx,
  dataTestId = "location-autocomplete",
  debounceMs = 350,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  useEffect(() => {
    if (!inputValue || inputValue.trim().length < 3) {
      setOptions([]);
      setLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const url = `/api/geo/search?q=${encodeURIComponent(
          inputValue.trim(),
        )}`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
          },
        });

        if (!res.ok) throw new Error("Failed to fetch locations");
        const data: LocationSuggestion[] = await res.json();
        const suggestions = data.map((item) => item.display_name);
        setOptions(suggestions);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [inputValue, debounceMs]);

  const uniqueOptions = useMemo(() => {
    const list = [...options];
    if (inputValue && !list.includes(inputValue)) {
      list.unshift(inputValue);
    }
    return Array.from(new Set(list));
  }, [options, inputValue]);

  return (
    <Autocomplete
      freeSolo
      disableClearable={false}
      options={uniqueOptions}
      value={value}
      inputValue={inputValue}
      loading={loading}
      disabled={disabled}
      fullWidth={fullWidth}
      onInputChange={(_event, newInputValue, reason) => {
        setInputValue(newInputValue);
        if (reason === "input" || reason === "clear") {
          onChange(newInputValue);
        }
      }}
      onChange={(_event, newValue) => {
        const val = typeof newValue === "string" ? newValue : newValue || "";
        setInputValue(val);
        onChange(val);
      }}
      renderOption={(props, option) => {
        const { key, ...optionProps } = props;
        return (
          <Box
            key={key}
            component="li"
            {...optionProps}
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1.2,
              py: 1,
              px: 1.5,
              fontSize: "13px",
              fontFamily: "Archivo, sans-serif",
            }}
          >
            <LocationOnIcon
              fontSize="small"
              sx={{ color: "#146b3a", mt: 0.3, flexShrink: 0 }}
            />
            <Typography
              variant="body2"
              sx={{
                fontSize: "13px",
                fontFamily: "Archivo, sans-serif",
                color: "text.primary",
                lineHeight: 1.3,
                wordBreak: "break-word",
              }}
            >
              {option}
            </Typography>
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          variant={variant}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          error={error}
          size={size}
          data-testid={dataTestId}
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps?.input,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress
                      color="inherit"
                      size={18}
                      sx={{ mr: 1 }}
                    />
                  ) : null}
                  {params.slotProps?.input?.endAdornment}
                </>
              ),
            },
            htmlInput: {
              ...params.slotProps?.htmlInput,
              "data-testid": `${dataTestId}-input`,
            },
          }}
          sx={inputSx}
        />
      )}
      sx={sx}
    />
  );
}
