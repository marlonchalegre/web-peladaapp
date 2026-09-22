import { useState, useEffect } from "react";
import { Box, Typography, Switch } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type {
  Organization,
  Pelada,
  PeladaHistoryEntry,
} from "../../../shared/api/endpoints";
import GroupTabsBar from "./GroupTabsBar";
import LocationAutocomplete from "../../../shared/components/LocationAutocomplete";

interface OrganizationDetailDesktopViewProps {
  org: Organization;
  peladas: Pelada[];
  totalPeladas: number;
  isAdmin: boolean;
  playersCount: number;
  waitlistCount: number;
  historyByPelada?: Record<string, PeladaHistoryEntry>;
  onCreatePeladaSuccess: () => void;
  onCreatePeladaQuick?: (data: {
    date: string;
    time: string;
    maxPlayers: number;
    location: string;
  }) => Promise<void>;
}

export default function OrganizationDetailDesktopView({
  org,
  peladas,
  totalPeladas,
  isAdmin,
  playersCount,
  waitlistCount,
  historyByPelada = {},
  onCreatePeladaSuccess,
  onCreatePeladaQuick,
}: OrganizationDetailDesktopViewProps) {
  const navigate = useNavigate();

  // Filter state for agenda: TODAS | ABERTAS | PENDÊNCIA
  const [filter, setFilter] = useState<"all" | "open" | "pending">("all");
  // Clock captured after mount so the overdue filter stays render-pure.
  const [nowTs, setNowTs] = useState(0);

  useEffect(() => {
    setNowTs(Date.now());
  }, []);

  // Inline form state
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });
  const [newTime, setNewTime] = useState("19:00");
  const [newMax, setNewMax] = useState(org.default_max_players ?? 24);
  const [newLocation, setNewLocation] = useState(org.default_location ?? "");
  const [notifyMembers, setNotifyMembers] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (org.default_location !== undefined && org.default_location !== null) {
      setNewLocation(org.default_location);
    }
  }, [org.default_location]);

  const orgInitials = org.name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .substring(0, 4)
    .toUpperCase();

  const historyEntries = Object.values(historyByPelada);
  const peladasCount = historyEntries.length || totalPeladas;
  const avgPresence = historyEntries.length
    ? Math.round(
        historyEntries.reduce((acc, e) => acc + (e.players_count || 0), 0) /
          historyEntries.length,
      )
    : null;

  const handleCreate = async () => {
    if (!onCreatePeladaQuick) return;
    setCreating(true);
    try {
      await onCreatePeladaQuick({
        date: newDate,
        time: newTime,
        maxPlayers: newMax,
        location: newLocation,
      });
      onCreatePeladaSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const filteredPeladas = peladas.filter((p) => {
    if (filter === "open")
      return p.status === "attendance" || p.status === "open";
    if (filter === "pending") {
      // Peladas whose scheduled date already passed but were never closed —
      // the admin's outstanding items. (Previously this duplicated the
      // "open" predicate, making PENDÊNCIA behave exactly like ABERTAS.)
      if (p.status === "closed" || !nowTs) return false;
      const raw = p.scheduled_at || (p as { when?: string }).when || "";
      const ts = raw ? new Date(raw).getTime() : NaN;
      return !Number.isNaN(ts) && ts < nowTs;
    }
    return true;
  });

  return (
    <>
      <GroupTabsBar
        orgId={org.id}
        orgName={org.name}
        active="agenda"
        playersCount={playersCount}
      />
      <Box
        sx={{
          width: "100%",
          maxWidth: 1124,
          mx: "auto",
          px: { xs: 2, md: 4 },
          pb: 5,
        }}
      >
        {/* 2. Group header */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.8,
            mb: 3,
          }}
        >
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: "50%",
              bgcolor: "#146b3a",
              border: "2.5px solid #17181a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 800,
              fontSize: "13px",
              color: "#ffffff",
              flexShrink: 0,
            }}
          >
            {orgInitials}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "24px",
                lineHeight: 1.1,
                color: "#17181a",
              }}
            >
              {org.name}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "9.5px",
                letterSpacing: ".14em",
                color: "#6b675c",
                mt: 0.6,
                textTransform: "uppercase",
              }}
            >
              FUTEBOL · {isAdmin ? "ADMIN" : "MEMBRO"} · {playersCount || 24}{" "}
              JOGADORES · TODA QUARTA 19:00
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Box
              component="button"
              onClick={() =>
                navigate(`/organizations/${org.id}/management?tab=invitations`)
              }
              sx={{
                border: "1.5px solid #ddd8cc",
                bgcolor: "#ffffff",
                borderRadius: "11px",
                px: 1.8,
                py: 1.2,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 800,
                fontSize: "11px",
                letterSpacing: ".04em",
                color: "#17181a",
                cursor: "pointer",
                "&:hover": { borderColor: "#17181a" },
              }}
            >
              CONVIDAR
            </Box>
            <Box
              component="button"
              onClick={() => navigate(`/organizations/${org.id}/management`)}
              sx={{
                border: "1.5px solid #ddd8cc",
                bgcolor: "#ffffff",
                borderRadius: "11px",
                px: 1.5,
                py: 1.2,
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "13px",
                color: "#6b675c",
                cursor: "pointer",
                "&:hover": { borderColor: "#17181a", color: "#17181a" },
              }}
            >
              ⋯
            </Box>
          </Box>
        </Box>

        {/* 3. 4 metric cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1.4,
            mb: 3,
          }}
        >
          <Box
            sx={{
              bgcolor: "#ffffff",
              border: "1.5px solid #ddd8cc",
              borderRadius: "14px",
              p: "14px 15px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                lineHeight: 1,
                color: "#17181a",
              }}
            >
              {peladasCount}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                letterSpacing: ".1em",
                color: "#6b675c",
                mt: 0.6,
                textTransform: "uppercase",
              }}
            >
              PELADAS
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "#ffffff",
              border: "1.5px solid #ddd8cc",
              borderRadius: "14px",
              p: "14px 15px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                lineHeight: 1,
                color: "#17181a",
              }}
            >
              {avgPresence == null ? "—" : avgPresence}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                letterSpacing: ".1em",
                color: "#6b675c",
                mt: 0.6,
                textTransform: "uppercase",
              }}
            >
              MÉDIA DE PRESENÇA
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "#ffffff",
              border: "1.5px solid #ddd8cc",
              borderRadius: "14px",
              p: "14px 15px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                lineHeight: 1,
                color: "#a8452a",
              }}
            >
              —
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                letterSpacing: ".1em",
                color: "#6b675c",
                mt: 0.6,
                textTransform: "uppercase",
              }}
            >
              FINANCEIRO
            </Typography>
          </Box>

          <Box
            sx={{
              bgcolor: "#ffffff",
              border: "1.5px solid #ddd8cc",
              borderRadius: "14px",
              p: "14px 15px",
            }}
          >
            <Typography
              sx={{
                fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "28px",
                lineHeight: 1,
                color: "#17181a",
              }}
            >
              {waitlistCount}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "8.5px",
                letterSpacing: ".1em",
                color: "#6b675c",
                mt: 0.6,
                textTransform: "uppercase",
              }}
            >
              NA FILA DE ESPERA
            </Typography>
          </Box>
        </Box>

        {/* 4. NOVA PELADA Form (Inline Desktop 4b) */}
        {isAdmin && (
          <Box
            sx={{
              bgcolor: "#ffffff",
              border: "2px solid #17181a",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "6px 6px 0 #17181a",
              mb: 3.5,
            }}
          >
            <Box
              sx={{
                bgcolor: "#17181a",
                p: "12px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 800,
                  fontSize: "11.5px",
                  letterSpacing: ".1em",
                  color: "#ffffff",
                }}
              >
                NOVA PELADA
              </Typography>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontWeight: 700,
                  fontSize: "10px",
                  letterSpacing: ".06em",
                  color: "#9a958a",
                }}
              >
                AGENDAR A PRÓXIMA
              </Typography>
            </Box>
            <Box sx={{ p: "18px 20px" }}>
              <Box sx={{ display: "flex", gap: 1.4, alignItems: "stretch" }}>
                {/* DATA */}
                <Box
                  sx={{
                    flex: 1.2,
                    border: "1.5px solid #ddd8cc",
                    borderRadius: "13px",
                    p: "11px 13px",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 700,
                      fontSize: "8.5px",
                      letterSpacing: ".14em",
                      color: "#6b675c",
                    }}
                  >
                    DATA
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                      fontWeight: 700,
                      fontSize: "19px",
                      color: "#17181a",
                      mt: 1,
                    }}
                  >
                    <Box
                      component="input"
                      type="date"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      sx={{
                        border: "none",
                        outline: "none",
                        bgcolor: "transparent",
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "19px",
                        color: "#17181a",
                        mt: 1,
                        p: 0,
                        width: "100%",
                      }}
                    />
                  </Typography>
                </Box>

                {/* HORA */}
                <Box
                  sx={{
                    flex: 0.8,
                    border: "1.5px solid #ddd8cc",
                    borderRadius: "13px",
                    p: "11px 13px",
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 700,
                      fontSize: "8.5px",
                      letterSpacing: ".14em",
                      color: "#6b675c",
                    }}
                  >
                    HORA
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                      fontWeight: 700,
                      fontSize: "19px",
                      color: "#17181a",
                      mt: 1,
                    }}
                  >
                    <Box
                      component="input"
                      type="time"
                      value={newTime}
                      onChange={(e) => setNewTime(e.target.value)}
                      sx={{
                        border: "none",
                        outline: "none",
                        bgcolor: "transparent",
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "19px",
                        color: "#17181a",
                        mt: 1,
                        p: 0,
                        width: "100%",
                      }}
                    />
                  </Typography>
                </Box>

                {/* MÁXIMO with - / + buttons */}
                <Box
                  sx={{
                    flex: 1.2,
                    border: "1.5px solid #ddd8cc",
                    borderRadius: "13px",
                    p: "11px 13px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "8.5px",
                        letterSpacing: ".14em",
                        color: "#6b675c",
                      }}
                    >
                      MÁXIMO
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "19px",
                        color: "#17181a",
                        mt: 1,
                      }}
                    >
                      {newMax}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.8 }}>
                    <Box
                      component="button"
                      onClick={() => setNewMax((m) => Math.max(10, m - 2))}
                      sx={{
                        width: 30,
                        height: 30,
                        border: "1.5px solid #ddd8cc",
                        borderRadius: "9px",
                        bgcolor: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "14px",
                        color: "#6b675c",
                        cursor: "pointer",
                        "&:hover": { borderColor: "#17181a", color: "#17181a" },
                      }}
                    >
                      –
                    </Box>
                    <Box
                      component="button"
                      onClick={() => setNewMax((m) => Math.min(40, m + 2))}
                      sx={{
                        width: 30,
                        height: 30,
                        border: "1.5px solid #17181a",
                        borderRadius: "9px",
                        bgcolor: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "14px",
                        color: "#17181a",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "#f6f4ee" },
                      }}
                    >
                      +
                    </Box>
                  </Box>
                </Box>

                {/* LOCAL */}
                <Box
                  sx={{
                    flex: 1.6,
                    border: "1.5px solid #ddd8cc",
                    borderRadius: "13px",
                    p: "9px 13px",
                    minWidth: 160,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 700,
                      fontSize: "8.5px",
                      letterSpacing: ".14em",
                      color: "#6b675c",
                    }}
                  >
                    LOCAL
                  </Typography>
                  <LocationAutocomplete
                    value={newLocation}
                    onChange={(val) => setNewLocation(val)}
                    placeholder="Ex: Arena Vila Nova · Q2"
                    variant="standard"
                    fullWidth
                    dataTestId="desktop-quick-pelada-location"
                    inputSx={{
                      "& .MuiInput-root": {
                        mt: 0.5,
                        "&::before, &::after": { display: "none" },
                      },
                      "& .MuiInputBase-input": {
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "13.5px",
                        lineHeight: 1.2,
                        color: "#17181a",
                        p: 0,
                        "&::placeholder": { color: "#9a958a", opacity: 1 },
                      },
                    }}
                  />
                </Box>

                {/* CRIAR PELADA BUTTON */}
                <Box
                  component="button"
                  onClick={handleCreate}
                  disabled={creating}
                  sx={{
                    border: "none",
                    borderRadius: "13px",
                    bgcolor: "#146b3a",
                    color: "#ffffff",
                    px: 3.5,
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "14px",
                    letterSpacing: ".06em",
                    cursor: "pointer",
                    boxShadow: "0 3px 0 #0d4526",
                    "&:hover": { bgcolor: "#0e5c31" },
                  }}
                >
                  {creating ? "CRIANDO..." : "CRIAR PELADA"}
                </Box>
              </Box>

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2 }}
              >
                <Switch
                  checked={notifyMembers}
                  onChange={(e) => setNotifyMembers(e.target.checked)}
                  size="small"
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: "#146b3a",
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: "#146b3a",
                    },
                  }}
                />
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 600,
                    fontSize: "12.5px",
                    color: "#4a4740",
                  }}
                >
                  Avisar diaristas e convidados que a lista abriu
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* 5. Table AGENDA DO GRUPO */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            mb: 1.5,
          }}
        >
          <Typography
            sx={{
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "9.5px",
              letterSpacing: ".18em",
              color: "#6b675c",
            }}
          >
            AGENDA DO GRUPO
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Box
              component="button"
              onClick={() => setFilter("all")}
              sx={{
                bgcolor: filter === "all" ? "#17181a" : "#ffffff",
                color: filter === "all" ? "#ffffff" : "#17181a",
                border: filter === "all" ? "none" : "1.5px solid #ddd8cc",
                borderRadius: "8px",
                px: 1.2,
                py: 0.7,
                fontFamily: "Archivo, sans-serif",
                fontWeight: filter === "all" ? 800 : 700,
                fontSize: "10px",
                letterSpacing: ".06em",
                cursor: "pointer",
              }}
            >
              TODAS
            </Box>
            <Box
              component="button"
              onClick={() => setFilter("open")}
              sx={{
                bgcolor: filter === "open" ? "#17181a" : "#ffffff",
                color: filter === "open" ? "#ffffff" : "#17181a",
                border: filter === "open" ? "none" : "1.5px solid #ddd8cc",
                borderRadius: "8px",
                px: 1.2,
                py: 0.7,
                fontFamily: "Archivo, sans-serif",
                fontWeight: filter === "open" ? 800 : 700,
                fontSize: "10px",
                letterSpacing: ".06em",
                cursor: "pointer",
              }}
            >
              ABERTAS
            </Box>
            <Box
              component="button"
              onClick={() => setFilter("pending")}
              sx={{
                bgcolor: filter === "pending" ? "#17181a" : "#ffffff",
                color: filter === "pending" ? "#ffffff" : "#17181a",
                border: filter === "pending" ? "none" : "1.5px solid #ddd8cc",
                borderRadius: "8px",
                px: 1.2,
                py: 0.7,
                fontFamily: "Archivo, sans-serif",
                fontWeight: filter === "pending" ? 800 : 700,
                fontSize: "10px",
                letterSpacing: ".06em",
                cursor: "pointer",
              }}
            >
              PENDÊNCIA
            </Box>
          </Box>
        </Box>

        {/* Table Container */}
        <Box
          sx={{
            bgcolor: "#ffffff",
            border: "1.5px solid #eae6db",
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          {/* Table Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              p: "10px 18px",
              bgcolor: "#f6f4ee",
              borderBottom: "1.5px solid #eae6db",
              fontFamily: "Archivo, sans-serif",
              fontWeight: 700,
              fontSize: "8.5px",
              letterSpacing: ".14em",
              color: "#6b675c",
            }}
          >
            <Box sx={{ width: 86, flexShrink: 0 }}>DATA</Box>
            <Box sx={{ flex: 1 }}>SITUAÇÃO</Box>
            <Box sx={{ width: 190, flexShrink: 0 }}>LISTA</Box>
            <Box sx={{ width: 110, flexShrink: 0 }}>FINANCEIRO</Box>
            <Box sx={{ width: 170, flexShrink: 0, textAlign: "right" }}>
              AÇÃO
            </Box>
          </Box>

          {/* Rows */}
          {filteredPeladas.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center", color: "#6b675c" }}>
              <Typography
                sx={{
                  fontFamily: "Archivo, sans-serif",
                  fontSize: "13px",
                  fontWeight: 600,
                }}
              >
                Nenhuma pelada encontrada nesta visualização.
              </Typography>
            </Box>
          ) : (
            filteredPeladas.map((pelada) => {
              const rawDate = pelada.scheduled_at || pelada.when;
              const pDate = rawDate ? new Date(rawDate) : new Date();
              const dateDisplay = !isNaN(pDate.getDate())
                ? `${String(pDate.getDate()).padStart(2, "0")}/${String(
                    pDate.getMonth() + 1,
                  ).padStart(2, "0")}`
                : "16/09";
              const dayOfWeek = !isNaN(pDate.getDay())
                ? pDate
                    .toLocaleDateString("pt-BR", { weekday: "short" })
                    .replace(".", "")
                : "qua";
              const timeDisplay = !isNaN(pDate.getTime())
                ? pDate.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "19:00";

              const isOpen =
                pelada.status === "attendance" || pelada.status === "open";
              const history = historyByPelada[pelada.id];
              const userLine = history?.user;

              return (
                <Box
                  key={pelada.id}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: "15px 18px",
                    bgcolor: isOpen ? "#f4f8f5" : "#ffffff",
                    borderBottom: "1.5px solid #eae6db",
                    borderLeft: isOpen ? "4px solid #146b3a" : "none",
                  }}
                >
                  {/* DATA */}
                  <Box sx={{ width: 86, flexShrink: 0 }}>
                    <Typography
                      sx={{
                        fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "15px",
                        color: "#17181a",
                      }}
                    >
                      {dateDisplay}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 600,
                        fontSize: "10px",
                        color: "#6b675c",
                        mt: 0.4,
                      }}
                    >
                      {dayOfWeek} · {timeDisplay}
                    </Typography>
                  </Box>

                  {/* SITUAÇÃO */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {isOpen ? (
                      <>
                        <Box
                          sx={{
                            display: "inline-block",
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "9px",
                            letterSpacing: ".08em",
                            color: "#ffffff",
                            bgcolor: "#146b3a",
                            borderRadius: "6px",
                            p: "4px 7px",
                          }}
                        >
                          LISTA ABERTA
                        </Box>
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 600,
                            fontSize: "11px",
                            color: "#6b675c",
                            mt: 0.8,
                          }}
                        >
                          fecha em 2 dias · 2 na fila de espera
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "12.5px",
                            color: "#17181a",
                          }}
                        >
                          Encerrada
                          {history
                            ? ` · ${history.matches_count} partidas`
                            : ""}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 600,
                            fontSize: "11px",
                            color: "#6b675c",
                            mt: 0.4,
                          }}
                        >
                          {userLine
                            ? [
                                userLine.team_position
                                  ? `${userLine.team_position}º lugar`
                                  : null,
                                `${userLine.goals} G`,
                                `${userLine.assists} A`,
                                userLine.is_mvp ? "MVP" : null,
                                userLine.is_garcom ? "garçom" : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")
                            : history?.champion_team_name
                              ? `Campeão: ${history.champion_team_name}`
                              : "Sem dados"}
                        </Typography>
                      </>
                    )}
                  </Box>

                  {/* LISTA */}
                  <Box sx={{ width: 190, flexShrink: 0 }}>
                    {isOpen ? (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.2 }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "12px",
                            color: "#17181a",
                          }}
                        >
                          {pelada.max_players
                            ? `até ${pelada.max_players} jogadores`
                            : "Lista aberta"}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 600,
                          fontSize: "11.5px",
                          color: "#6b675c",
                        }}
                      >
                        {history ? `${history.players_count} jogadores` : "—"}
                      </Typography>
                    )}
                  </Box>

                  {/* FINANCEIRO */}
                  <Box sx={{ width: 110, flexShrink: 0 }}>
                    <Typography
                      sx={{
                        color: "#6b675c",
                        fontWeight: 600,
                        fontSize: "12px",
                      }}
                    >
                      —
                    </Typography>
                  </Box>

                  {/* AÇÃO */}
                  <Box
                    sx={{
                      width: 170,
                      flexShrink: 0,
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 1,
                    }}
                  >
                    {isOpen ? (
                      <Box
                        component="button"
                        onClick={() =>
                          navigate(`/peladas/${pelada.id}/attendance`)
                        }
                        sx={{
                          border: "none",
                          borderRadius: "10px",
                          bgcolor: "#17181a",
                          color: "#ffffff",
                          p: "10px 13px",
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 800,
                          fontSize: "10.5px",
                          letterSpacing: ".06em",
                          cursor: "pointer",
                          "&:hover": { bgcolor: "#000000" },
                        }}
                      >
                        FECHAR E SORTEAR
                      </Box>
                    ) : (
                      <Box
                        component="button"
                        onClick={() => navigate(`/peladas/${pelada.id}`)}
                        sx={{
                          border: "1.5px solid #ddd8cc",
                          borderRadius: "8px",
                          bgcolor: "#ffffff",
                          color: "#6b675c",
                          p: "8px 11px",
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "10px",
                          letterSpacing: ".06em",
                          cursor: "pointer",
                          "&:hover": {
                            borderColor: "#17181a",
                            color: "#17181a",
                          },
                        }}
                      >
                        VER SÚMULA
                      </Box>
                    )}
                  </Box>
                </Box>
              );
            })
          )}

          {/* Table Footer */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              p: "13px 18px",
              bgcolor: "#f6f4ee",
            }}
          >
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 600,
                fontSize: "11.5px",
                color: "#6b675c",
              }}
            >
              1–{Math.min(filteredPeladas.length, 10)} de{" "}
              {totalPeladas || peladas.length} peladas
            </Typography>
            <Typography
              sx={{
                fontFamily: "Archivo, sans-serif",
                fontWeight: 700,
                fontSize: "11.5px",
                color: "#146b3a",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Ver todas →
            </Typography>
          </Box>
        </Box>
      </Box>
    </>
  );
}
