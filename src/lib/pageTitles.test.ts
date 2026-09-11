import { describe, it, expect } from "vitest";
import { getPageTitle } from "./pageTitles";

describe("getPageTitle", () => {
  it("returns default title for root", () => {
    expect(getPageTitle("/")).toBe("Minha Pelada");
    expect(getPageTitle("")).toBe("Minha Pelada");
  });

  it("returns correct title for auth pages", () => {
    expect(getPageTitle("/login")).toBe("Entrar | Minha Pelada");
    expect(getPageTitle("/register")).toBe("Cadastro | Minha Pelada");
    expect(getPageTitle("/first-access")).toBe(
      "Primeiro Acesso | Minha Pelada",
    );
    expect(getPageTitle("/forgot-password")).toBe(
      "Recuperar Senha | Minha Pelada",
    );
    expect(getPageTitle("/reset-password")).toBe(
      "Redefinir Senha | Minha Pelada",
    );
  });

  it("returns correct title for home, profile, and admin", () => {
    expect(getPageTitle("/home")).toBe("Início | Minha Pelada");
    expect(getPageTitle("/profile")).toBe("Meu Perfil | Minha Pelada");
    expect(getPageTitle("/admin")).toBe(
      "Painel de Administração | Minha Pelada",
    );
  });

  it("returns correct title for parameterized organization routes", () => {
    const orgId = "d8c96d3c-494c-4654-8fe8-5bf2b9e6df7b";
    expect(getPageTitle(`/organizations/${orgId}`)).toBe(
      "Detalhes da Organização | Minha Pelada",
    );
    expect(getPageTitle(`/organizations/${orgId}/statistics`)).toBe(
      "Estatísticas da Organização | Minha Pelada",
    );
    expect(getPageTitle(`/organizations/${orgId}/management`)).toBe(
      "Gestão da Organização | Minha Pelada",
    );
  });

  it("returns correct title for parameterized pelada routes", () => {
    const peladaId = "12345";
    expect(getPageTitle(`/peladas/${peladaId}`)).toBe(
      "Detalhes da Pelada | Minha Pelada",
    );
    expect(getPageTitle(`/peladas/${peladaId}/build-schedule`)).toBe(
      "Montar Times | Minha Pelada",
    );
    expect(getPageTitle(`/peladas/${peladaId}/attendance`)).toBe(
      "Lista de Presença | Minha Pelada",
    );
    expect(getPageTitle(`/peladas/${peladaId}/matches`)).toBe(
      "Partidas da Pelada | Minha Pelada",
    );
    expect(getPageTitle(`/peladas/${peladaId}/voting`)).toBe(
      "Votação da Pelada | Minha Pelada",
    );
    expect(getPageTitle(`/peladas/${peladaId}/results`)).toBe(
      "Resultados da Pelada | Minha Pelada",
    );
  });

  it("returns fallback formatted title for unknown routes", () => {
    expect(getPageTitle("/unknown/section")).toBe(
      "Unknown - Section | Minha Pelada",
    );
  });
});
