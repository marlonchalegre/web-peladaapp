/* eslint-disable @typescript-eslint/no-explicit-any */
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

  const mockResponse = (
    data: any,
    ok = true,
    status = 200,
    headers: any = {},
  ) => {
    mockFetch.mockResolvedValueOnce({
      ok,
      status,
      json: async () => data,
      headers: {
        get: (name: string) => headers[name] || null,
      },
    });
  };

  describe("Organizations", () => {
    it("getOrganization calls correct endpoint", async () => {
      mockResponse({ id: "1", name: "Org 1" });
      const result = await api.getOrganization("1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1"),
        expect.anything(),
      );
      expect(result.name).toBe("Org 1");
    });

    it("updateOrganization calls correct endpoint", async () => {
      mockResponse({ id: "1" });
      await api.updateOrganization("1", { name: "New Name" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1"),
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("createOrganization calls correct endpoint", async () => {
      mockResponse({ id: "1" });
      await api.createOrganization("New Org");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("deleteOrganization calls correct endpoint", async () => {
      mockResponse({});
      await api.deleteOrganization("1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("leaveOrganization calls correct endpoint", async () => {
      mockResponse({});
      await api.leaveOrganization("1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1/leave"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("listPlayersByOrg calls correct endpoint", async () => {
      mockResponse([{ id: "p1" }]);
      const result = await api.listPlayersByOrg("1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1/players"),
        expect.anything(),
      );
      expect(result).toHaveLength(1);
    });

    it("listAdminsByOrganization calls correct endpoint", async () => {
      mockResponse([{ user_id: "u1" }]);
      const result = await api.listAdminsByOrganization("1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1/admins"),
        expect.anything(),
      );
      expect(result).toHaveLength(1);
    });

    it("invitePlayer calls correct endpoint", async () => {
      mockResponse({});
      await api.invitePlayer("1", "test@test.com", "Test");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1/invite"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("testWaha calls correct endpoint", async () => {
      mockResponse({ status: "ok" });
      await api.testWaha("1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1/waha/test"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("getInviteLink calls correct endpoint", async () => {
      mockResponse({ token: "abc" });
      await api.getInviteLink("1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1/invite-link"),
        expect.anything(),
      );
    });

    it("resetInviteLink calls correct endpoint", async () => {
      mockResponse({ token: "def" });
      await api.resetInviteLink("1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1/invite-link/reset"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("getOrganizationStatistics calls correct endpoint", async () => {
      mockResponse([]);
      await api.getOrganizationStatistics("1", 2024);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1/statistics?year=2024"),
        expect.anything(),
      );
    });
  });

  describe("Manual Stats", () => {
    it("getManualStats calls correct endpoint", async () => {
      mockResponse([]);
      await api.getManualStats("1", 2024);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1/manual-stats?year=2024"),
        expect.anything(),
      );
    });

    it("upsertManualStats calls correct endpoint", async () => {
      mockResponse({ updated: 1 });
      await api.upsertManualStats("1", [{ player_id: "p1", year: 2024 }]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1/manual-stats"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("Peladas", () => {
    it("getPeladaDashboardData calls correct endpoint", async () => {
      mockResponse({ pelada: { id: "p1" } });
      const result = await api.getPeladaDashboardData("p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/dashboard-data"),
        expect.anything(),
      );
      expect(result.pelada.id).toBe("p1");
    });

    it("listPeladasByOrg calls correct endpoint with defaults", async () => {
      mockResponse([], true, 200, { "X-Page": "1", "X-Total": "0" });
      await api.listPeladasByOrg("1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/organizations/1/peladas?page=1&per_page=20",
        ),
        expect.anything(),
      );
    });

    it("listPeladasByUser calls correct endpoint with defaults", async () => {
      mockResponse([], true, 200, { "X-Page": "1", "X-Total": "0" });
      await api.listPeladasByUser("u1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/u1/peladas?page=1&per_page=20"),
        expect.anything(),
      );
    });

    it("createPelada calls correct endpoint", async () => {
      mockResponse({ id: "p1" });
      await api.createPelada({ organization_id: "org1" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("deletePelada calls correct endpoint", async () => {
      mockResponse({});
      await api.deletePelada("p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("beginPelada calls correct endpoint", async () => {
      mockResponse({});
      await api.beginPelada("p1", 2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/begin"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ matches_per_team: 2 }),
        }),
      );

      mockResponse({});
      await api.beginPelada("p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/begin"),
        expect.objectContaining({ method: "POST", body: undefined }),
      );
    });

    it("closePelada calls correct endpoint", async () => {
      mockResponse({});
      await api.closePelada("p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/close"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("updateAttendance calls correct endpoint", async () => {
      mockResponse({ status: "confirmed" });
      await api.updateAttendance("p1", "confirmed", "pl1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/attendance"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("confirmed"),
        }),
      );
    });

    it("batchUpdateAttendance calls correct endpoint", async () => {
      mockResponse({});
      await api.batchUpdateAttendance("p1", ["pl1"], "confirmed");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/attendance/batch"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("closeAttendance calls correct endpoint", async () => {
      mockResponse({});
      await api.closeAttendance("p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/close-attendance"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("updateVotingEnabled calls correct endpoint", async () => {
      mockResponse({ updated: 1 });
      await api.updateVotingEnabled("p1", "pl1", true);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/attendance/voting-enabled"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("timers call correct endpoints", async () => {
      mockResponse({});
      await api.startPeladaTimer("p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/timer/start"),
        expect.anything(),
      );

      mockResponse({});
      await api.pausePeladaTimer("p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/timer/pause"),
        expect.anything(),
      );

      mockResponse({});
      await api.resetPeladaTimer("p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/timer/reset"),
        expect.anything(),
      );
    });
  });

  describe("Schedule", () => {
    it("getSchedulePreview calls correct endpoint", async () => {
      mockResponse({ matches: [] });
      await api.getSchedulePreview("p1", 2);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/peladas/p1/schedule/preview?matches_per_team=2",
        ),
        expect.anything(),
      );
    });

    it("saveSchedulePlan and getSchedulePlan call correct endpoints", async () => {
      mockResponse({});
      await api.saveSchedulePlan("p1", [{ home: "t1", away: "t2" }]);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/schedule"),
        expect.objectContaining({ method: "POST" }),
      );

      mockResponse([]);
      await api.getSchedulePlan("p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/schedule"),
        expect.anything(),
      );
    });
  });

  describe("Teams", () => {
    it("createTeam calls correct endpoint", async () => {
      mockResponse({ id: "t1" });
      await api.createTeam({ pelada_id: "p1", name: "Team 1" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/teams"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("deleteTeam calls correct endpoint", async () => {
      mockResponse({});
      await api.deleteTeam("t1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/teams/t1"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("addPlayerToTeam calls correct endpoint", async () => {
      mockResponse({});
      await api.addPlayerToTeam("t1", "p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/teams/t1/players"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("removePlayerFromTeam calls correct endpoint", async () => {
      mockResponse({});
      await api.removePlayerFromTeam("t1", "p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/teams/t1/players"),
        expect.objectContaining({
          method: "DELETE",
          body: expect.stringContaining("p1"),
        }),
      );
    });
  });

  describe("Matches", () => {
    it("updateMatchScore calls correct endpoint", async () => {
      mockResponse({ success: true });
      await api.updateMatchScore("m1", 2, 1, "finished");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/matches/m1/score"),
        expect.objectContaining({
          method: "PUT",
          body: expect.stringContaining('"home_score":2'),
        }),
      );
    });

    it("match timers call correct endpoints", async () => {
      mockResponse({});
      await api.startMatchTimer("m1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/matches/m1/timer/start"),
        expect.anything(),
      );

      mockResponse({});
      await api.pauseMatchTimer("m1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/matches/m1/timer/pause"),
        expect.anything(),
      );

      mockResponse({});
      await api.resetMatchTimer("m1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/matches/m1/timer/reset"),
        expect.anything(),
      );
    });

    it("lineup actions call correct endpoints", async () => {
      mockResponse({});
      await api.addMatchLineupPlayer("m1", "t1", "p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/matches/m1/lineups"),
        expect.objectContaining({ method: "POST" }),
      );

      mockResponse({});
      await api.replaceMatchLineupPlayer("m1", "t1", "p1", "p2");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/matches/m1/lineups/replace"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("Players and Users", () => {
    it("player CRUD calls correct endpoints", async () => {
      mockResponse({ id: "p1" });
      await api.createPlayer({ organization_id: "org1" });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/players"),
        expect.objectContaining({ method: "POST" }),
      );

      mockResponse({ id: "p1" });
      await api.updatePlayer("p1", { grade: 5 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/players/p1"),
        expect.objectContaining({ method: "PUT" }),
      );

      mockResponse({});
      await api.deletePlayer("p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/players/p1"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });

    it("user actions call correct endpoints", async () => {
      mockResponse([]);
      await api.listUsers();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users"),
        expect.anything(),
      );

      mockResponse([], true, 200, { "X-Total": "0" });
      await api.searchUsers("query");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/search?q=query&page=1&per_page=20"),
        expect.anything(),
      );

      mockResponse({ token: "tk" });
      await api.firstAccess({
        name: "n",
        username: "u",
        email: "e",
        token: "t",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/first-access"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("Substitutions", () => {
    it("listSubstitutions calls correct endpoint", async () => {
      mockResponse([]);
      await api.listSubstitutions("org1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/org1/substitutions"),
        expect.anything(),
      );
    });

    it("createSubstitution calls correct endpoint", async () => {
      mockResponse({ status: "ok" });
      await api.createSubstitution("org1", {
        permanent_player_id: "p1",
        temporary_player_id: "p2",
        start_date: "2024-01-01",
      });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/org1/substitutions"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("endSubstitution calls correct endpoint", async () => {
      mockResponse({});
      await api.endSubstitution("org1", "s1", "2024-01-01");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/org1/substitutions/s1/end"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("Finances", () => {
    it("finance settings and summary call correct endpoints", async () => {
      mockResponse({ base_price: 10 });
      await api.getOrganizationFinance("org1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/org1/finance"),
        expect.anything(),
      );

      mockResponse({ message: "ok" });
      await api.updateOrganizationFinance("org1", { diarista_price: 20 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/org1/finance"),
        expect.objectContaining({ method: "PUT" }),
      );

      mockResponse({ total_balance: 0 });
      await api.getFinanceSummary("org1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/org1/finance/summary"),
        expect.anything(),
      );
    });

    it("listTransactions, addTransaction and reverseTransaction call correct endpoints", async () => {
      mockResponse([], true, 200, { "X-Total": "0" });
      await api.listTransactions("1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/organizations/1/finance/transactions?page=1&per_page=10",
        ),
        expect.anything(),
      );

      mockResponse([], true, 200, { "X-Total": "0" });
      await api.listTransactions("1", 2, 20);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/organizations/1/finance/transactions?page=2&per_page=20",
        ),
        expect.anything(),
      );

      mockResponse({});
      await api.addTransaction("1", { amount: 10 });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1/finance/transactions"),
        expect.objectContaining({ method: "POST" }),
      );

      mockResponse({});
      await api.reverseTransaction("1", "tx1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/organizations/1/finance/transactions/tx1/reverse",
        ),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("monthly payments call correct endpoints", async () => {
      mockResponse([]);
      await api.getMonthlyPayments("1", 2024, 5);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/organizations/1/finance/monthly-payments?year=2024&month=5",
        ),
        expect.anything(),
      );

      mockResponse({ message: "ok" });
      await api.markMonthlyPayment("1", {
        player_id: "p1",
        amount: 50,
        payment_date: "2024-05-01",
      } as any);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/1/finance/monthly-payments"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("Admins and Invitations", () => {
    it("invitation actions call correct endpoints", async () => {
      mockResponse([]);
      await api.listOrganizationInvitations("org1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/org1/invitations"),
        expect.anything(),
      );

      mockResponse({});
      await api.revokeInvitation("org1", "inv1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/org1/invitations/inv1"),
        expect.objectContaining({ method: "DELETE" }),
      );

      mockResponse([]);
      await api.listPendingInvitations();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/invitations/pending"),
        expect.anything(),
      );

      mockResponse({ id: "inv1" });
      await api.getInvitationInfo("token");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/auth/invitations/token"),
        expect.anything(),
      );

      mockResponse({ organization_id: "org1" });
      await api.acceptInvitation("token");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/invitations/token/accept"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("admin management calls correct endpoints", async () => {
      mockResponse({ user_id: "u1" });
      await api.addOrganizationAdmin("org1", "u1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/org1/admins"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ user_id: "u1" }),
        }),
      );

      mockResponse({});
      await api.removeOrganizationAdmin("org1", "u1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/organizations/org1/admins/u1"),
        expect.objectContaining({ method: "DELETE" }),
      );

      mockResponse([]);
      await api.listUserOrganizations("u1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/u1/organizations"),
        expect.anything(),
      );
    });
  });

  describe("Voting", () => {
    it("voting status and batch cast call correct endpoints", async () => {
      mockResponse({ total_voted: 5 });
      await api.getVotingStatus("p1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/voting-status"),
        expect.anything(),
      );

      mockResponse({ votes_cast: 10 });
      await api.batchCastVotes("p1", { voter_id: "v1", votes: [] });
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/peladas/p1/votes/batch"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("Super Admin", () => {
    it("listOrganizationsAdmin calls correct endpoint with defaults", async () => {
      mockResponse([], true, 200, { "X-Page": "1", "X-Total": "0" });
      await api.listOrganizationsAdmin();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/admin/organizations?q=&page=1&per_page=20",
        ),
        expect.anything(),
      );

      mockResponse([], true, 200, { "X-Page": "1", "X-Total": "0" });
      await api.listOrganizationsAdmin("test", 2, 10);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/admin/organizations?q=test&page=2&per_page=10",
        ),
        expect.anything(),
      );
    });

    it("toggleBlockOrganization calls correct endpoint", async () => {
      mockResponse({ id: "org1", is_blocked: true });
      await api.toggleBlockOrganization("org1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/organizations/org1/toggle-block"),
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("user toggle actions call correct endpoints", async () => {
      mockResponse({ is_blocked: true });
      await api.toggleBlockUser("u1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/u1/toggle-block"),
        expect.objectContaining({ method: "POST" }),
      );

      mockResponse({ allow_org_creation: true });
      await api.toggleOrgCreation("u1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/u1/toggle-org-creation"),
        expect.objectContaining({ method: "POST" }),
      );

      mockResponse({ is_super_admin: true });
      await api.toggleSuperAdmin("u1");
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/admin/users/u1/toggle-super-admin"),
        expect.objectContaining({ method: "POST" }),
      );
    });
  });
});
