import { useState, useEffect } from "react";
import {
  Container,
  Box,
  Typography,
  Alert,
  Grid,
  Button,
  Menu,
  MenuItem,
  IconButton,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthContext";
import { Loading } from "../../../shared/components/Loading";
import { useHomeDashboard } from "../hooks/useHomeDashboard";
import PeladasList from "../components/PeladasList";
import ActiveMatchesCarousel from "../components/ActiveMatchesCarousel";
import ConsolidatedOrganizationsList from "../components/ConsolidatedOrganizationsList";
import CreateOrganizationDialog from "../components/CreateOrganizationDialog";
import PendingInvitations from "../components/PendingInvitations";

export default function HomePage() {
  const { user, refreshUser, signOut } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    signOut();
    navigate("/");
  };

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    loading,
    error,
    adminOrgs,
    memberOrgs,
    pendingInvitations,
    peladas,
    peladasPage,
    peladasTotalPages,
    handlePeladaPageChange,
    acceptInvitation,
    createOrganization,
    updateAttendance,
  } = useHomeDashboard();

  if (!user) {
    return (
      <Container
        maxWidth="lg"
        sx={{ py: 3, px: { xs: 1, sm: 2 } }}
        disableGutters
      >
        <Loading message={t("common.loading")} />
      </Container>
    );
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 2 } }}
      disableGutters
    >
      {user.is_blocked && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {t(
            "home.blocked_message",
            "Sua conta está bloqueada. Você não pode participar de peladas ou ver estatísticas, mas pode acessar seu perfil.",
          )}
        </Alert>
      )}

      {error && !user.is_blocked && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Loading message={t("common.loading")} />
      ) : user.is_blocked ? null : (
        <>
          {/* Main Grid: Responsive 2-column on desktop (4a), 1-column on mobile (2a) */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 322px" },
              gap: { xs: 2.5, md: 3 },
              alignItems: "start",
            }}
          >
            {/* Left column: greeting, invitations, upcoming match and pelada
                list. A self-contained flex stack on desktop so its layout never
                stretches to match the taller right sidebar, which would leave a
                blank gap under the greeting. On mobile it dissolves into the
                single-column grid (display: contents) so the order props below
                keep interleaving both columns. */}
            <Box
              sx={{
                display: { xs: "contents", md: "flex" },
                flexDirection: "column",
                gap: { md: 3 },
                gridColumn: { md: "1" },
                minWidth: 0,
              }}
            >
              {/* Column 1, Item 1: Greeting and Group Filter Chips */}
              <Box sx={{ gridColumn: { xs: "1", md: "1" }, order: 1, mb: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: { xs: "center", md: "flex-end" },
                    mb: 1.5,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "9.5px",
                        letterSpacing: "0.18em",
                        color: "#6b675c",
                        textTransform: "uppercase",
                      }}
                    >
                      {new Date()
                        .toLocaleDateString(t("common.locale_code", "pt-BR"), {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                        })
                        .toUpperCase()}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: { xs: "22px", sm: "26px", md: "28px" },
                        lineHeight: 1.15,
                        color: "#17181a",
                        mt: 0.5,
                      }}
                    >
                      {t("home.welcome.prefix", "Fala, ")}
                      {user.name.split(" ")[0]}
                    </Typography>
                  </Box>

                  {/* Mobile Right Controls: PT/EN toggle & Avatar */}
                  <Box
                    sx={{
                      display: { xs: "flex", md: "none" },
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Box
                      onClick={() => {
                        const newLang =
                          i18n.language === "pt-BR" ? "en" : "pt-BR";
                        i18n.changeLanguage(newLang);
                      }}
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: "10px",
                        border: "1.5px solid #ddd8cc",
                        bgcolor: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 700,
                        fontSize: "12px",
                        color: "#6b675c",
                        cursor: "pointer",
                        "&:hover": { borderColor: "#17181a" },
                      }}
                    >
                      {i18n.language?.startsWith("pt") ? "PT" : "EN"}
                    </Box>

                    <IconButton
                      onClick={handleOpenUserMenu}
                      data-testid="user-settings-button"
                      sx={{
                        p: 0,
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        bgcolor: "#d8d2c4",
                        border: "1.5px solid #ddd8cc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "11px",
                        color: "#17181a",
                      }}
                    >
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </IconButton>

                    <Menu
                      sx={{ mt: "45px" }}
                      id="menu-homepage"
                      anchorEl={anchorElUser}
                      anchorOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      keepMounted
                      transformOrigin={{
                        vertical: "top",
                        horizontal: "right",
                      }}
                      open={Boolean(anchorElUser)}
                      onClose={handleCloseUserMenu}
                    >
                      <MenuItem
                        component={RouterLink}
                        to="/profile"
                        onClick={handleCloseUserMenu}
                        data-testid="profile-menu-item"
                      >
                        <Typography align="center">
                          {t("navigation.profile", "Meu Perfil")}
                        </Typography>
                      </MenuItem>

                      {user?.is_super_admin && (
                        <MenuItem
                          component={RouterLink}
                          to="/admin"
                          onClick={handleCloseUserMenu}
                          data-testid="admin-menu-item"
                        >
                          <Typography align="center">
                            {t(
                              "navigation.adminPanel",
                              "Painel de Administração",
                            )}
                          </Typography>
                        </MenuItem>
                      )}

                      <MenuItem
                        onClick={handleLogout}
                        data-testid="logout-menu-item"
                      >
                        <Typography align="center">
                          {t("auth.logout", "Sair")}
                        </Typography>
                      </MenuItem>
                    </Menu>
                  </Box>

                  {/* Desktop: Group Filter Chips inline on right (4a) */}
                  <Box
                    sx={{
                      display: { xs: "none", md: "flex" },
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Box
                      sx={{
                        bgcolor: "#17181a",
                        color: "#ffffff",
                        borderRadius: "9px",
                        px: 1.5,
                        py: 0.8,
                        fontFamily: "Archivo, sans-serif",
                        fontWeight: 800,
                        fontSize: "10.5px",
                        letterSpacing: "0.06em",
                        cursor: "pointer",
                      }}
                    >
                      TODOS · {adminOrgs.length + memberOrgs.length}
                    </Box>
                    {[...adminOrgs, ...memberOrgs].map((org, i) => (
                      <Box
                        key={`desktop-chip-${org.id}`}
                        sx={{
                          bgcolor: "#ffffff",
                          border: "1.5px solid #ddd8cc",
                          borderRadius: "9px",
                          px: 1.2,
                          py: 0.7,
                          display: "flex",
                          alignItems: "center",
                          gap: 0.8,
                          cursor: "pointer",
                          "&:hover": { borderColor: "#17181a" },
                        }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "2px",
                            bgcolor: i % 2 === 0 ? "#146b3a" : "#a8452a",
                          }}
                        />
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "10.5px",
                            color: "#17181a",
                          }}
                        >
                          • {org.name}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Mobile: Group Filter Chips below greeting */}
                <Box
                  sx={{
                    display: { xs: "flex", md: "none" },
                    gap: 1,
                    flexWrap: "wrap",
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: "#17181a",
                      color: "#ffffff",
                      borderRadius: "9px",
                      px: 1.5,
                      py: 0.8,
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 800,
                      fontSize: "10.5px",
                      letterSpacing: "0.06em",
                      cursor: "pointer",
                    }}
                  >
                    TODOS · {adminOrgs.length + memberOrgs.length}
                  </Box>
                  {[...adminOrgs, ...memberOrgs].map((org, i) => (
                    <Box
                      key={org.id}
                      sx={{
                        bgcolor: "#ffffff",
                        border: "1.5px solid #ddd8cc",
                        borderRadius: "9px",
                        px: 1.2,
                        py: 0.7,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.8,
                        cursor: "pointer",
                        "&:hover": { borderColor: "#17181a" },
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: "2px",
                          bgcolor: i % 2 === 0 ? "#146b3a" : "#a8452a",
                        }}
                      />
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "10.5px",
                          color: "#17181a",
                        }}
                      >
                        • {org.name}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Column 1, Item 2: Pending invitations */}
              {pendingInvitations.length > 0 && (
                <Box
                  sx={{
                    gridColumn: { xs: "1", md: "1" },
                    order: 2,
                    width: "100%",
                  }}
                >
                  <PendingInvitations
                    invitations={pendingInvitations}
                    onAccept={acceptInvitation}
                  />
                </Box>
              )}

              {/* Column 1, Item 3: Active Matches Carousel (SUA SEMANA) */}
              <Box
                sx={{
                  gridColumn: { xs: "1", md: "1" },
                  order: 3,
                  width: "100%",
                }}
              >
                <ActiveMatchesCarousel
                  peladas={peladas}
                  onUpdateAttendance={updateAttendance}
                />
              </Box>

              {/* Column 1, Item 4: PeladasList (Desktop: under carousel; Mobile: order 7) */}
              <Box
                sx={{
                  gridColumn: { xs: "1", md: "1" },
                  order: { xs: 7, md: 4 },
                  width: "100%",
                  mt: { xs: 2, md: 3 },
                }}
              >
                <PeladasList
                  peladas={peladas}
                  page={peladasPage}
                  totalPages={peladasTotalPages}
                  onPageChange={handlePeladaPageChange}
                />
              </Box>
            </Box>

            {/* Right column: season stats, groups and alerts. Same flex-stack
                treatment as the left column on desktop. */}
            <Box
              sx={{
                display: { xs: "contents", md: "flex" },
                flexDirection: "column",
                gap: { md: 3 },
                gridColumn: { md: "2" },
                minWidth: 0,
              }}
            >
              {/* Column 2, Item 1: TEMPORADA 2026 (Season Stats) */}
              <Box
                sx={{
                  gridColumn: { xs: "1", md: "2" },
                  order: { xs: 4, md: 1 },
                  bgcolor: "#ffffff",
                  border: "1.5px solid #eae6db",
                  borderRadius: "18px",
                  p: { xs: 2, sm: 2.5 },
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 700,
                      fontSize: "9.5px",
                      letterSpacing: "0.18em",
                      color: "#6b675c",
                      textTransform: "uppercase",
                      mb: 0.5,
                    }}
                  >
                    TEMPORADA {currentYear}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "Archivo, sans-serif",
                      fontWeight: 600,
                      fontSize: "12px",
                      color: "#6b675c",
                    }}
                  >
                    {user.stats?.matches ?? 0} jogos em{" "}
                    {adminOrgs.length + memberOrgs.length} grupos · cada esporte
                    conta o seu
                  </Typography>
                </Box>

                {/* Stats Cards Grid */}
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Box
                      sx={{
                        border: "1.5px solid #eae6db",
                        borderRadius: "16px",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          p: "10px 14px",
                          bgcolor: "#f4f8f5",
                          borderBottom: "1.5px solid #eae6db",
                        }}
                      >
                        <Box
                          sx={{
                            width: 9,
                            height: 9,
                            borderRadius: "2px",
                            bgcolor: "#146b3a",
                          }}
                        />
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 800,
                            fontSize: "11px",
                            color: "#17181a",
                          }}
                        >
                          {t(
                            "home.stats.season_group_title",
                            "Temporada do Grupo",
                          )}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "9.5px",
                            letterSpacing: "0.1em",
                            color: "#6b675c",
                          }}
                        >
                          FUTEBOL · MENSALISTA
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: "1px",
                          bgcolor: "#eae6db",
                        }}
                      >
                        <Box
                          sx={{
                            bgcolor: "#ffffff",
                            p: "12px 10px",
                            textAlign: "center",
                          }}
                        >
                          <span style={{ display: "none" }}>
                            {t(
                              "home.stats.peladas_played",
                              `Peladas Jogadas (${currentYear})`,
                              { year: currentYear },
                            )}
                          </span>
                          <Typography
                            data-testid="home-stats-matches"
                            sx={{
                              fontFamily:
                                "'Archivo Narrow', Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "26px",
                              lineHeight: 1,
                              color: "#17181a",
                            }}
                          >
                            {user.stats?.matches ?? 0}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "8.5px",
                              letterSpacing: "0.1em",
                              color: "#6b675c",
                              mt: 0.5,
                            }}
                          >
                            JOGOS
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            bgcolor: "#ffffff",
                            p: "12px 10px",
                            textAlign: "center",
                          }}
                        >
                          <span style={{ display: "none" }}>
                            {t(
                              "home.stats.goals_assists",
                              `Gols & Assistências (${currentYear})`,
                              { year: currentYear },
                            )}
                          </span>
                          <span style={{ display: "none" }}>
                            {user.stats?.assists ?? 0}
                          </span>
                          <Typography
                            sx={{
                              fontFamily:
                                "'Archivo Narrow', Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "26px",
                              lineHeight: 1,
                              color: "#17181a",
                            }}
                          >
                            {user.stats?.goals ?? 0}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "8.5px",
                              letterSpacing: "0.1em",
                              color: "#6b675c",
                              mt: 0.5,
                            }}
                          >
                            GOLS
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            bgcolor: "#ffffff",
                            p: "12px 10px",
                            textAlign: "center",
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily:
                                "'Archivo Narrow', Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "26px",
                              lineHeight: 1,
                              color: "#146b3a",
                            }}
                          >
                            {user.stats?.assists ?? 0}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "Archivo, sans-serif",
                              fontWeight: 700,
                              fontSize: "8.5px",
                              letterSpacing: "0.1em",
                              color: "#6b675c",
                              mt: 0.5,
                            }}
                          >
                            ASSIST.
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Grid>

                  {/* Summary Stats for Test assertions */}
                  <Grid size={{ xs: 12 }}>
                    <Box
                      sx={{
                        p: 2,
                        border: "1.5px solid #eae6db",
                        borderRadius: "16px",
                        bgcolor: "#fbfaf7",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "9.5px",
                            letterSpacing: "0.14em",
                            color: "#6b675c",
                            textTransform: "uppercase",
                          }}
                        >
                          Resumo da Conta
                        </Typography>
                        <Box
                          component="span"
                          data-testid="home-stats-groups"
                          sx={{
                            fontFamily: "'Archivo Narrow', Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "18px",
                            color: "#17181a",
                          }}
                        >
                          {adminOrgs.length + memberOrgs.length}
                        </Box>
                      </Box>

                      <Box sx={{ mt: 1 }}>
                        <Typography
                          data-testid="home-stats-goals-assists"
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "13px",
                            color: "#17181a",
                          }}
                        >
                          {user.stats?.goals ?? 0} {t("common.goals", "Gols")} |{" "}
                          {user.stats?.assists ?? 0}{" "}
                          {t("common.assists", "Assistências")}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          mt: 1.5,
                          pt: 1.5,
                          borderTop: "1.5px dashed #ddd8cc",
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 600,
                            fontSize: "12px",
                            color: "#6b675c",
                          }}
                        >
                          Presença:{" "}
                          <strong style={{ color: "#17181a" }}>
                            {user.stats?.attendance_rate == null
                              ? "—"
                              : `${Math.round(user.stats.attendance_rate)}%`}
                          </strong>
                          {(user.stats?.current_streak ?? 0) > 0
                            ? ` · sequência de ${user.stats?.current_streak} jogos`
                            : ""}
                        </Typography>
                        <Button
                          href="/profile"
                          sx={{
                            fontFamily: "Archivo, sans-serif",
                            fontWeight: 700,
                            fontSize: "11.5px",
                            color: "#146b3a",
                            p: 0,
                            minWidth: 0,
                            textTransform: "none",
                            "&:hover": {
                              bgcolor: "transparent",
                              textDecoration: "underline",
                            },
                          }}
                        >
                          Minha ficha →
                        </Button>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Column 2, Item 2: MEUS GRUPOS */}
              <Box
                id="meus-grupos"
                sx={{
                  gridColumn: { xs: "1", md: "2" },
                  order: { xs: 5, md: 2 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  width: "100%",
                }}
              >
                <ConsolidatedOrganizationsList
                  adminOrgs={adminOrgs}
                  memberOrgs={memberOrgs}
                />

                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  onClick={() => setCreateDialogOpen(true)}
                  data-testid="create-org-open-dialog"
                  data-analytics-id="create-org-open-btn"
                  sx={{
                    py: 1.6,
                    borderRadius: "14px",
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 800,
                    fontSize: "13px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    bgcolor: "transparent",
                    color: "#17181a",
                    border: "1.5px dashed #c9c4b6",
                    "&:hover": {
                      bgcolor: "#ffffff",
                      borderColor: "#17181a",
                    },
                  }}
                >
                  + {t("home.actions.create_organization", "Criar Organização")}
                </Button>
              </Box>

              {/* Column 2, Item 3: PRECISA DE VOCÊ (Desktop Alert Card) */}
              <Box
                sx={{
                  gridColumn: { xs: "1", md: "2" },
                  order: { xs: 6, md: 3 },
                  bgcolor: "#ffffff",
                  border: "1.5px solid #eae6db",
                  borderRadius: "18px",
                  p: { xs: 2, sm: 2.5 },
                  width: "100%",
                  boxSizing: "border-box",
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "Archivo, sans-serif",
                    fontWeight: 700,
                    fontSize: "9.5px",
                    letterSpacing: "0.18em",
                    color: "#6b675c",
                    textTransform: "uppercase",
                    mb: 1.5,
                  }}
                >
                  PRECISA DE VOCÊ
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      border: "1.5px solid #eae6db",
                      borderRadius: "14px",
                      p: "12px 13px",
                      bgcolor: "#fbfaf7",
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#f2a100",
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "12px",
                          lineHeight: 1.25,
                          color: "#17181a",
                        }}
                      >
                        {peladas.some((p) => p.status === "attendance")
                          ? "Confirmar presença na pelada"
                          : "Próximos jogos em breve"}
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 600,
                          fontSize: "10.5px",
                          color: "#6b675c",
                          mt: 0.25,
                        }}
                      >
                        fique atento aos prazos da lista
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.25,
                      border: "1.5px solid #eae6db",
                      borderRadius: "14px",
                      p: "12px 13px",
                      bgcolor: "#fbfaf7",
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        bgcolor: "#146b3a",
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 700,
                          fontSize: "12px",
                          lineHeight: 1.25,
                          color: "#17181a",
                        }}
                      >
                        Votação no MVP
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Archivo, sans-serif",
                          fontWeight: 600,
                          fontSize: "10.5px",
                          color: "#6b675c",
                          mt: 0.25,
                        }}
                      >
                        participe ao fim de cada pelada
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </>
      )}

      <CreateOrganizationDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={createOrganization}
        allowOrgCreation={user.allow_org_creation === true}
      />
    </Container>
  );
}
