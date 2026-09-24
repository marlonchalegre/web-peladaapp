const stateAbbreviations = new Set([
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
]);

const brazilianStates = new Set([
  "acre",
  "alagoas",
  "amapá",
  "amapa",
  "amazonas",
  "bahia",
  "ceará",
  "ceara",
  "distrito federal",
  "espírito santo",
  "espirito santo",
  "goiás",
  "goias",
  "maranhão",
  "maranhao",
  "mato grosso",
  "mato grosso do sul",
  "minas gerais",
  "pará",
  "para",
  "paraíba",
  "paraiba",
  "paraná",
  "parana",
  "pernambuco",
  "piauí",
  "piaui",
  "rio de janeiro",
  "rio grande do norte",
  "rio grande do sul",
  "rondônia",
  "rondonia",
  "roraima",
  "santa catarina",
  "são paulo",
  "sao paulo",
  "sergipe",
  "tocantins",
]);

export function formatLocationDisplay(location?: string | null): string {
  if (!location) return "";
  const raw = location.trim();
  if (!raw) return "";

  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length <= 1) {
    return parts[0] || raw;
  }

  if (parts.length === 2) {
    return `${parts[0]}, ${parts[1]}`;
  }

  const isPostalCode = (s: string) =>
    /^\d{4,5}-?\d{3,4}$/.test(s) || /^\d+$/.test(s);
  const isCountry = (s: string) =>
    /^(brasil|brazil|argentina|portugal|united states|usa)$/i.test(s);
  const isRegionNoise = (s: string) =>
    /^regi[aã]o\b/i.test(s) ||
    /^zona\s+(norte|sul|leste|oeste|central)\b/i.test(s);

  const cleaned: string[] = [];
  for (const part of parts) {
    if (isPostalCode(part) || isCountry(part) || isRegionNoise(part)) {
      continue;
    }
    cleaned.push(part);
  }

  if (cleaned.length === 0) return parts[0] || raw;
  if (cleaned.length === 1) return cleaned[0];
  if (cleaned.length === 2) return `${cleaned[0]}, ${cleaned[1]}`;

  let cityIndex = cleaned.length - 1;
  const lastItemLower = cleaned[cityIndex].toLowerCase();
  if (
    stateAbbreviations.has(cleaned[cityIndex].toUpperCase()) ||
    brazilianStates.has(lastItemLower)
  ) {
    if (cityIndex > 1) {
      cityIndex -= 1;
    }
  }

  const venue = cleaned[0];
  const city = cleaned[cityIndex];

  if (venue.toLowerCase() === city.toLowerCase()) {
    return venue;
  }

  return `${venue}, ${city}`;
}

export function getGoogleMapsUrl(location: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    location.trim(),
  )}`;
}
