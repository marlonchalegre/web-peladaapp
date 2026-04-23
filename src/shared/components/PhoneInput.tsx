import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  TextField,
  MenuItem,
  Select,
  InputAdornment,
  type SelectChangeEvent,
  Typography,
} from "@mui/material";

interface Country {
  code: string;
  name: string;
  prefix: string;
  flag: string;
  mask: string;
}

const COUNTRIES: Country[] = [
  {
    code: "BR",
    name: "Brasil",
    prefix: "+55",
    flag: "🇧🇷",
    mask: "(##) #####-####",
  },
  {
    code: "US",
    name: "United States",
    prefix: "+1",
    flag: "🇺🇸",
    mask: "(###) ###-####",
  },
  {
    code: "PT",
    name: "Portugal",
    prefix: "+351",
    flag: "🇵🇹",
    mask: "### ### ###",
  },
  {
    code: "AR",
    name: "Argentina",
    prefix: "+54",
    flag: "🇦🇷",
    mask: "(###) ###-####",
  },
  {
    code: "UY",
    name: "Uruguay",
    prefix: "+598",
    flag: "🇺🇾",
    mask: "# ### ## ##",
  },
  { code: "CL", name: "Chile", prefix: "+56", flag: "🇨🇱", mask: "# #### ####" },
  {
    code: "ES",
    name: "España",
    prefix: "+34",
    flag: "🇪🇸",
    mask: "### ### ###",
  },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  required?: boolean;
  disabled?: boolean;
  id?: string;
  "data-testid"?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  label,
  error,
  helperText,
  fullWidth = true,
  required = false,
  disabled = false,
  id = "phone-input",
  "data-testid": dataTestId,
}) => {
  // Use a local state for the country if the user explicitly changes it,
  // but also try to infer it from the value prop.
  const [userSelectedCountryCode, setUserSelectedCountryCode] = useState<
    string | null
  >(null);

  const applyMask = useCallback((val: string, mask: string) => {
    const digits = val.replace(/\D/g, "");
    let masked = "";
    let digitIdx = 0;

    for (let i = 0; i < mask.length && digitIdx < digits.length; i++) {
      if (mask[i] === "#") {
        masked += digits[digitIdx++];
      } else {
        masked += mask[i];
      }
    }
    return masked;
  }, []);

  // Derive country and display value from the value prop
  const { selectedCountry, displayValue } = useMemo(() => {
    if (!value) {
      const defaultCountry =
        COUNTRIES.find((c) => c.code === userSelectedCountryCode) ||
        COUNTRIES[0];
      return { selectedCountry: defaultCountry, displayValue: "" };
    }

    // 1. Try to find matching country prefix from the current value
    const inferredCountry =
      COUNTRIES.find((c) => value.startsWith(c.prefix)) ||
      COUNTRIES.find((c) => value.startsWith(c.prefix.replace("+", "")));

    // 2. Use user-selected country if it matches the prefix, or if no country was inferred
    const finalCountry =
      userSelectedCountryCode &&
      inferredCountry &&
      inferredCountry.code === userSelectedCountryCode
        ? inferredCountry
        : inferredCountry ||
          COUNTRIES.find((c) => c.code === userSelectedCountryCode) ||
          COUNTRIES[0];

    const prefix = finalCountry.prefix.startsWith("+")
      ? finalCountry.prefix
      : `+${finalCountry.prefix}`;
    const prefixNoPlus = prefix.replace("+", "");

    let rawNumber = value;
    if (value.startsWith(prefix)) {
      rawNumber = value.slice(prefix.length);
    } else if (value.startsWith(prefixNoPlus)) {
      rawNumber = value.slice(prefixNoPlus.length);
    }

    return {
      selectedCountry: finalCountry,
      displayValue: applyMask(rawNumber, finalCountry.mask),
    };
  }, [value, userSelectedCountryCode, applyMask]);

  const handleCountryChange = (event: SelectChangeEvent) => {
    const countryCode = event.target.value;
    setUserSelectedCountryCode(countryCode);

    const country =
      COUNTRIES.find((c) => c.code === countryCode) || COUNTRIES[0];
    const currentDigits = displayValue.replace(/\D/g, "");
    onChange(`${country.prefix}${currentDigits}`);
  };

  const handleNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    const digits = val.replace(/\D/g, "");
    onChange(`${selectedCountry.prefix}${digits}`);
  };

  return (
    <TextField
      id={id}
      label={label}
      value={displayValue}
      onChange={handleNumberChange}
      error={error}
      helperText={helperText}
      fullWidth={fullWidth}
      required={required}
      disabled={disabled}
      type="tel"
      placeholder={selectedCountry.mask.replace(/#/g, "0")}
      slotProps={{
        input: {
          inputProps: { "data-testid": dataTestId },
          startAdornment: (
            <InputAdornment position="start" sx={{ mr: 1 }}>
              <Select
                value={selectedCountry.code}
                onChange={handleCountryChange}
                variant="standard"
                disableUnderline
                disabled={disabled}
                sx={{
                  "& .MuiSelect-select": {
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    py: 0,
                    pr: "24px !important",
                  },
                }}
                renderValue={(value) => {
                  const country = COUNTRIES.find((c) => c.code === value);
                  return (
                    <Box
                      component="span"
                      sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                    >
                      <Typography component="span" sx={{ fontSize: "1.2rem" }}>
                        {country?.flag}
                      </Typography>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.secondary"
                      >
                        {country?.prefix}
                      </Typography>
                    </Box>
                  );
                }}
              >
                {COUNTRIES.map((country) => (
                  <MenuItem key={country.code} value={country.code}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        width: "100%",
                      }}
                    >
                      <Typography sx={{ fontSize: "1.2rem" }}>
                        {country.flag}
                      </Typography>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {country.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {country.prefix}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              <Box
                sx={{
                  height: 24,
                  width: "1px",
                  bgcolor: "divider",
                  ml: 1,
                }}
              />
            </InputAdornment>
          ),
        },
      }}
    />
  );
};
