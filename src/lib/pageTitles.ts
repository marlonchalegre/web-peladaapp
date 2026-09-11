const APP_NAME = "Minha Pelada";

const JOIN_REGEX = /^\/join\/[^/]+$/;
const ORG_STATS_REGEX = /^\/organizations\/[^/]+\/statistics$/;
const ORG_MGMT_REGEX = /^\/organizations\/[^/]+\/management$/;
const ORG_DETAIL_REGEX = /^\/organizations\/[^/]+$/;

const PELADA_SCHEDULE_REGEX = /^\/peladas\/[^/]+\/build-schedule$/;
const PELADA_ATTENDANCE_REGEX = /^\/peladas\/[^/]+\/attendance$/;
const PELADA_MATCHES_REGEX = /^\/peladas\/[^/]+\/matches$/;
const PELADA_VOTING_REGEX = /^\/peladas\/[^/]+\/voting$/;
const PELADA_RESULTS_REGEX = /^\/peladas\/[^/]+\/results$/;
const PELADA_DETAIL_REGEX = /^\/peladas\/[^/]+$/;

const STATIC_ROUTES: Record<string, string> = {
  "/": APP_NAME,
  "": APP_NAME,
  "/login": `Entrar | ${APP_NAME}`,
  "/register": `Cadastro | ${APP_NAME}`,
  "/first-access": `Primeiro Acesso | ${APP_NAME}`,
  "/forgot-password": `Recuperar Senha | ${APP_NAME}`,
  "/reset-password": `Redefinir Senha | ${APP_NAME}`,
  "/home": `Início | ${APP_NAME}`,
  "/profile": `Meu Perfil | ${APP_NAME}`,
  "/admin": `Painel de Administração | ${APP_NAME}`,
};

const formatTitle = (title: string): string => `${title} | ${APP_NAME}`;

export const getPageTitle = (pathname: string): string => {
  const staticTitle = STATIC_ROUTES[pathname];
  if (staticTitle) return staticTitle;

  if (pathname.startsWith("/join/") && JOIN_REGEX.test(pathname)) {
    return formatTitle("Convite de Organização");
  }

  if (pathname.startsWith("/organizations/")) {
    if (ORG_STATS_REGEX.test(pathname)) {
      return formatTitle("Estatísticas da Organização");
    }
    if (ORG_MGMT_REGEX.test(pathname)) {
      return formatTitle("Gestão da Organização");
    }
    if (ORG_DETAIL_REGEX.test(pathname)) {
      return formatTitle("Detalhes da Organização");
    }
  }

  if (pathname.startsWith("/peladas/")) {
    if (PELADA_SCHEDULE_REGEX.test(pathname)) {
      return formatTitle("Montar Times");
    }
    if (PELADA_ATTENDANCE_REGEX.test(pathname)) {
      return formatTitle("Lista de Presença");
    }
    if (PELADA_MATCHES_REGEX.test(pathname)) {
      return formatTitle("Partidas da Pelada");
    }
    if (PELADA_VOTING_REGEX.test(pathname)) {
      return formatTitle("Votação da Pelada");
    }
    if (PELADA_RESULTS_REGEX.test(pathname)) {
      return formatTitle("Resultados da Pelada");
    }
    if (PELADA_DETAIL_REGEX.test(pathname)) {
      return formatTitle("Detalhes da Pelada");
    }
  }

  const cleanParts = pathname
    .split("/")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" - ");

  return cleanParts ? formatTitle(cleanParts) : APP_NAME;
};
