import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { createApi } from "./endpoints";
import { ApiClient } from "./client";

describe("endpoints", () => {
  let client: ApiClient;
  let api: ReturnType<typeof createApi>;
  let mockFetch: Mock;

  beforeEach(() => {
    client = new ApiClient();
    api = createApi(client);
    mockFetch = vi.fn();
    global.fetch = mockFetch as unknown as typeof fetch;
  });

  const mockResponse = (data: any, ok = true, status = 200, headers: any = {}) => {
    mockFetch.mockResolvedValueOnce({
      ok,
      status,
      json: async () => data,
      headers: {
        get: (name: string) => headers[name] || null,
      }
    });
  };

  describe("Organizations", () => {
    it("getOrganization calls correct endpoint", async () => {
      mockResponse({ id: "1", name: "Org 1" });
      const result = await api.getOrganization("1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/1"), expect.anything());
      expect(result.name).toBe("Org 1");
    });

    it("updateOrganization calls correct endpoint", async () => {
      mockResponse({ id: "1" });
      await api.updateOrganization("1", { name: "New Name" });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/1"), expect.objectContaining({ method: "PUT" }));
    });

    it("createOrganization calls correct endpoint", async () => {
      mockResponse({ id: "1" });
      await api.createOrganization("New Org");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations"), expect.objectContaining({ method: "POST" }));
    });

    it("deleteOrganization calls correct endpoint", async () => {
      mockResponse({});
      await api.deleteOrganization("1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/1"), expect.objectContaining({ method: "DELETE" }));
    });

    it("leaveOrganization calls correct endpoint", async () => {
      mockResponse({});
      await api.leaveOrganization("1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/1/leave"), expect.objectContaining({ method: "POST" }));
    });

    it("invitePlayer calls correct endpoint", async () => {
      mockResponse({});
      await api.invitePlayer("1", "test@test.com", "Test");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/1/invite"), expect.objectContaining({ method: "POST" }));
    });

    it("testWaha calls correct endpoint", async () => {
      mockResponse({ status: "ok" });
      await api.testWaha("1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/1/waha/test"), expect.objectContaining({ method: "POST" }));
    });

    it("getInviteLink calls correct endpoint", async () => {
      mockResponse({ token: "abc" });
      await api.getInviteLink("1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/1/invite-link"), expect.anything());
    });

    it("resetInviteLink calls correct endpoint", async () => {
      mockResponse({ token: "def" });
      await api.resetInviteLink("1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/1/invite-link/reset"), expect.objectContaining({ method: "POST" }));
    });
  });

  describe("Peladas", () => {
    it("getPeladaDashboardData calls correct endpoint", async () => {
      mockResponse({ pelada: { id: "p1" } });
      const result = await api.getPeladaDashboardData("p1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/peladas/p1/dashboard-data"), expect.anything());
      expect(result.pelada.id).toBe("p1");
    });

    it("listPeladasByUser calls correct endpoint", async () => {
      mockResponse([], true, 200, { "X-Page": "1", "X-Total": "0" });
      const result = await api.listPeladasByUser("u1", 1, 10);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/users/u1/peladas?page=1&per_page=10"), expect.anything());
      expect(result.page).toBe(1);
    });

    it("createPelada calls correct endpoint", async () => {
      mockResponse({ id: "p1" });
      await api.createPelada({ organization_id: "org1" });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/peladas"), expect.objectContaining({ method: "POST" }));
    });

    it("deletePelada calls correct endpoint", async () => {
      mockResponse({});
      await api.deletePelada("p1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/peladas/p1"), expect.objectContaining({ method: "DELETE" }));
    });

    it("beginPelada calls correct endpoint", async () => {
      mockResponse({});
      await api.beginPelada("p1", 2);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/peladas/p1/begin"), expect.objectContaining({ method: "POST" }));
    });

    it("closePelada calls correct endpoint", async () => {
      mockResponse({});
      await api.closePelada("p1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/peladas/p1/close"), expect.objectContaining({ method: "POST" }));
    });

    it("updateAttendance calls correct endpoint", async () => {
      mockResponse({ status: "confirmed" });
      await api.updateAttendance("p1", "confirmed", "pl1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/attendance"),
        expect.objectContaining({ method: "POST", body: expect.stringContaining("confirmed") })
      );
    });

    it("batchUpdateAttendance calls correct endpoint", async () => {
      mockResponse({});
      await api.batchUpdateAttendance("p1", [{ player_id: "pl1", status: "confirmed" }]);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/peladas/p1/attendance/batch"), expect.objectContaining({ method: "POST" }));
    });

    it("closeAttendance calls correct endpoint", async () => {
      mockResponse({});
      await api.closeAttendance("p1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/peladas/p1/close-attendance"), expect.objectContaining({ method: "POST" }));
    });
  });

  describe("Teams", () => {
    it("createTeam calls correct endpoint", async () => {
      mockResponse({ id: "t1" });
      await api.createTeam({ pelada_id: "p1", name: "Team 1" });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/teams"), expect.objectContaining({ method: "POST" }));
    });

    it("deleteTeam calls correct endpoint", async () => {
      mockResponse({});
      await api.deleteTeam("t1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/teams/t1"), expect.objectContaining({ method: "DELETE" }));
    });

    it("addPlayerToTeam calls correct endpoint", async () => {
      mockResponse({});
      await api.addPlayerToTeam("t1", "p1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/teams/t1/players"), expect.objectContaining({ method: "POST" }));
    });

    it("removePlayerFromTeam calls correct endpoint", async () => {
      mockResponse({});
      await api.removePlayerFromTeam("t1", "p1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/teams/t1/players"), expect.objectContaining({ method: "DELETE", body: expect.stringContaining("p1") }));
    });
  });

  describe("Matches", () => {
    it("updateMatchScore calls correct endpoint", async () => {
      mockResponse({ success: true });
      await api.updateMatchScore("m1", 2, 1, "finished");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/matches/m1/score"),
        expect.objectContaining({ method: "PUT", body: expect.stringContaining('"home_score":2') })
      );
    });

    it("createMatchEvent calls correct endpoint", async () => {
      mockResponse({ id: "e1" });
      await api.createMatchEvent("m1", { event_type: "goal", player_id: "p1" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/matches/m1/events"),
        expect.objectContaining({ method: "POST" })
      );
    });

    it("deleteMatchEvent calls correct endpoint", async () => {
      mockResponse({});
      await api.deleteMatchEvent("m1", "e1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/matches/m1/events"), expect.objectContaining({ method: "DELETE", body: expect.stringContaining("e1") }));
    });
  });

  describe("Substitutions", () => {
    it("listSubstitutions calls correct endpoint", async () => {
      mockResponse([]);
      await api.listSubstitutions("org1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/org1/substitutions"), expect.anything());
    });

    it("createSubstitution calls correct endpoint", async () => {
      mockResponse({});
      await api.createSubstitution("org1", "p1", "p2", "2024-01-01");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/org1/substitutions"), expect.objectContaining({ method: "POST" }));
    });
  });

  describe("Users", () => {
    it("listUsers calls correct endpoint", async () => {
      mockResponse([{ id: "u1" }]);
      const result = await api.listUsers();
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/users"), expect.anything());
      expect(result).toHaveLength(1);
    });

    it("searchUsers calls correct endpoint", async () => {
      mockResponse([], true, 200, { "X-Page": "1", "X-Total": "0" });
      await api.searchUsers("test", 1, 20);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/users/search?q=test&page=1&per_page=20"), expect.anything());
    });
  });

  describe("Voting", () => {
    it("getVotingInfo calls correct endpoint", async () => {
      mockResponse({ pelada_id: "p1" });
      await api.getVotingInfo("p1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/peladas/p1/voting-info"), expect.anything());
    });

    it("getVotingResults calls correct endpoint", async () => {
      mockResponse({ results: [] });
      await api.getVotingResults("p1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/peladas/p1/voting-results"), expect.anything());
    });

    it("batchCastVotes calls correct endpoint", async () => {
      mockResponse({ success: true });
      await api.batchCastVotes("p1", { votes: [] });
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/peladas/p1/votes/batch"), expect.objectContaining({ method: "POST" }));
    });
  });

  describe("Super Admin", () => {
    it("listOrganizationsAdmin calls correct endpoint", async () => {
      mockResponse([], true, 200, { "X-Page": "1", "X-Total": "0" });
      await api.listOrganizationsAdmin("test", 1, 10);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/admin/organizations?q=test&page=1&per_page=10"), expect.anything());
    });

    it("toggleBlockOrganization calls correct endpoint", async () => {
      mockResponse({ id: "org1", is_blocked: true });
      await api.toggleBlockOrganization("org1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/admin/organizations/org1/toggle-block"), expect.objectContaining({ method: "POST" }));
    });
  });

  describe("Organization Admins", () => {
    it("addOrganizationAdmin calls correct endpoint", async () => {
      mockResponse({ id: "a1" });
      await api.addOrganizationAdmin("org1", "u1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/org1/admins"), expect.objectContaining({ method: "POST", body: expect.stringContaining("u1") }));
    });

    it("removeOrganizationAdmin calls correct endpoint", async () => {
      mockResponse({});
      await api.removeOrganizationAdmin("org1", "u1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/org1/admins/u1"), expect.objectContaining({ method: "DELETE" }));
    });
  });

  describe("Finances", () => {
    it("getOrganizationFinance calls correct endpoint", async () => {
      mockResponse({ base_price: 10 });
      await api.getOrganizationFinance("org1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/org1/finance"), expect.anything());
    });

    it("listTransactions calls correct endpoint", async () => {
      mockResponse([], true, 200, { "X-Page": "1", "X-Total": "0" });
      await api.listTransactions("org1");
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/organizations/org1/finance/transactions"), expect.anything());
    });
  });
});
