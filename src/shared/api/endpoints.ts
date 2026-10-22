import { ApiClient } from "./client";
import type {
  AttendanceStatus,
  BatchVotePayload,
  BatchVoteResponse,
  FinanceSummary,
  GeoLocationSuggestion,
  Match,
  MatchEventType,
  MonthlyPayment,
  MonthlyPlayerSubstitution,
  MonthlyWaitlistEntry,
  MonthlyWaitlistStatus,
  Organization,
  OrganizationAdmin,
  OrganizationFeatureFlags,
  OrganizationFinance,
  OrganizationInvitation,
  OrganizationPlayerStats,
  Pelada,
  PeladaDashboardDataResponse,
  PeladaFullDetailsResponse,
  PeladaHistoryEntry,
  Player,
  Team,
  Transaction,
  User,
  UserProfileDashboard,
  VotingInfo,
  VotingResults,
  VotingStatus,
  WeeklyPresence,
} from "./types";

export * from "./types";

export function createApi(client: ApiClient) {
  return {
    // Organizations
    getOrganization: (id: string) =>
      client.get<Organization>(`/api/organizations/${id}`),
    updateOrganization: (id: string, payload: Partial<Organization>) =>
      client.put<Organization>(`/api/organizations/${id}`, payload),
    createOrganization: (name: string) =>
      client.post<Organization>("/api/organizations", { name }),
    deleteOrganization: (id: string) =>
      client.delete(`/api/organizations/${id}`),
    leaveOrganization: (id: string) =>
      client.post(`/api/organizations/${id}/leave`, {}),
    invitePlayer: (id: string, email?: string, name?: string) =>
      client.post<{
        user_id: string;
        email?: string;
        name?: string;
        token: string;
        is_new_user: boolean;
        organization_id: string;
      }>(`/api/organizations/${id}/invite`, { email, name }),
    testWaha: (id: string) =>
      client.post<{ status: string; message: string }>(
        `/api/organizations/${id}/waha/test`,
        {},
      ),
    sendNotification: (
      id: string,
      payload: {
        action: "custom" | "resend";
        message?: string;
        notification_type?: string;
        pelada_id?: string;
      },
    ) =>
      client.post<{ status: string; message: string }>(
        `/api/organizations/${id}/notifications/send`,
        payload,
      ),
    getInviteLink: (id: string) =>
      client.get<{ token: string }>(`/api/organizations/${id}/invite-link`),
    resetInviteLink: (id: string) =>
      client.post<{ token: string }>(
        `/api/organizations/${id}/invite-link/reset`,
        {},
      ),
    getOrganizationStatistics: (id: string, year: number) =>
      client.get<OrganizationPlayerStats[]>(
        `/api/organizations/${id}/statistics`,
        { year },
      ),
    getOrganizationHistory: (id: string, year?: number) =>
      client.get<PeladaHistoryEntry[]>(`/api/organizations/${id}/history`, {
        year: year ?? 0,
      }),
    getWeeklyPresence: (id: string, weeks = 12) =>
      client.get<WeeklyPresence[]>(`/api/organizations/${id}/weekly-presence`, {
        weeks,
      }),

    // Monthly Player Substitutions
    listSubstitutions: (id: string) =>
      client.get<MonthlyPlayerSubstitution[]>(
        `/api/organizations/${id}/substitutions`,
      ),
    createSubstitution: (
      id: string,
      payload: {
        permanent_player_id: string;
        temporary_player_id: string;
        start_date: string;
      },
    ) =>
      client.post<{ status: string }>(
        `/api/organizations/${id}/substitutions`,
        payload,
      ),
    endSubstitution: (id: string, subId: string, endDate?: string) =>
      client.post<{ status: string }>(
        `/api/organizations/${id}/substitutions/${subId}/end`,
        { end_date: endDate },
      ),

    // Monthly Player Waitlist
    listMonthlyWaitlist: (id: string) =>
      client.get<MonthlyWaitlistEntry[]>(
        `/api/organizations/${id}/monthly-waitlist`,
      ),
    getMonthlyWaitlistStatus: (id: string) =>
      client.get<MonthlyWaitlistStatus>(
        `/api/organizations/${id}/monthly-waitlist/me`,
      ),
    joinMonthlyWaitlist: (id: string, playerId?: string) =>
      client.post<{ id: string; status: string }>(
        `/api/organizations/${id}/monthly-waitlist`,
        { player_id: playerId },
      ),
    leaveMonthlyWaitlist: (id: string, playerId: string) =>
      client.delete<{ status: string }>(
        `/api/organizations/${id}/monthly-waitlist/${playerId}`,
      ),
    promoteMonthlyWaitlistPlayer: (id: string, playerId: string) =>
      client.post<{ status: string }>(
        `/api/organizations/${id}/monthly-waitlist/${playerId}/promote`,
      ),

    // Finance
    getOrganizationFinance: (id: string) =>
      client.get<OrganizationFinance>(`/api/organizations/${id}/finance`),
    updateOrganizationFinance: (
      id: string,
      payload: Partial<OrganizationFinance>,
    ) =>
      client.put<{ message: string }>(
        `/api/organizations/${id}/finance`,
        payload,
      ),
    getFinanceSummary: (id: string) =>
      client.get<FinanceSummary>(`/api/organizations/${id}/finance/summary`),
    listTransactions: (id: string, page?: number, per_page?: number) =>
      client
        .getPaginated<Transaction[]>(
          `/api/organizations/${id}/finance/transactions`,
          {
            page: page ?? 1,
            per_page: per_page ?? 10,
          },
        )
        .then((res) => ({
          data: res.data,
          total: res.total,
        })),
    addTransaction: (id: string, payload: Partial<Transaction>) =>
      client.post<Transaction>(
        `/api/organizations/${id}/finance/transactions`,
        payload,
      ),
    reverseTransaction: (id: string, txId: string) =>
      client.post<{ message: string }>(
        `/api/organizations/${id}/finance/transactions/${txId}/reverse`,
      ),
    getMonthlyPayments: (id: string, year: number, month: number) =>
      client.get<MonthlyPayment[]>(
        `/api/organizations/${id}/finance/monthly-payments`,
        { year, month },
      ),
    markMonthlyPayment: (
      id: string,
      payload: Partial<MonthlyPayment> & {
        amount: number;
        payment_date: string;
      },
    ) =>
      client.post<{ message: string; transaction_id?: string }>(
        `/api/organizations/${id}/finance/monthly-payments`,
        payload,
      ),

    // Manual Stats
    getManualStats: (id: string, year: number) =>
      client.get<
        {
          id: string;
          organization_id: string;
          player_id: string;
          year: number;
          goals: number;
          assists: number;
          own_goals: number;
        }[]
      >(`/api/organizations/${id}/manual-stats`, { year }),
    upsertManualStats: (
      id: string,
      stats: {
        player_id: string;
        year: number;
        goals?: number;
        assists?: number;
        own_goals?: number;
      }[],
    ) =>
      client.post<{ updated: number }>(
        `/api/organizations/${id}/manual-stats`,
        stats,
      ),

    // Peladas
    listPeladasByOrg: (
      organizationId: string,
      page: number = 1,
      perPage: number = 20,
    ) =>
      client.getPaginated<Pelada[]>(
        `/api/organizations/${organizationId}/peladas`,
        { page, per_page: perPage },
      ),
    listPeladasByUser: (
      userId: string,
      page: number = 1,
      perPage: number = 20,
    ) =>
      client.getPaginated<Pelada[]>(`/api/users/${userId}/peladas`, {
        page,
        per_page: perPage,
      }),
    getPeladaDashboardData: (id: string) =>
      client.get<PeladaDashboardDataResponse>(
        `/api/peladas/${id}/dashboard-data`,
      ),
    createPelada: (payload: Partial<Pelada>) =>
      client.post<Pelada>("/api/peladas", payload),
    deletePelada: (id: string) => client.delete(`/api/peladas/${id}`),
    beginPelada: (id: string, matchesPerTeam?: number) =>
      client.post<{ matches_created: number }>(
        `/api/peladas/${id}/begin`,
        matchesPerTeam ? { matches_per_team: matchesPerTeam } : undefined,
      ),
    closePelada: (id: string) =>
      client.post<Pelada>(`/api/peladas/${id}/close`),
    getPeladaFullDetails: (id: string) =>
      client.get<PeladaFullDetailsResponse>(`/api/peladas/${id}/full-details`),
    updateAttendance: (
      id: string,
      status: AttendanceStatus,
      playerId?: string,
    ) =>
      client.post<number>(`/api/peladas/${id}/attendance`, {
        status,
        player_id: playerId,
      }),
    batchUpdateAttendance: (
      id: string,
      playerIds: string[],
      status: AttendanceStatus,
    ) =>
      client.post<number>(`/api/peladas/${id}/attendance/batch`, {
        player_ids: playerIds,
        status,
      }),
    closeAttendance: (id: string) =>
      client.post<Pelada>(`/api/peladas/${id}/close-attendance`),
    updateVotingEnabled: (id: string, playerId: string, enabled: boolean) =>
      client.post<{ updated: number }>(
        `/api/peladas/${id}/attendance/voting-enabled`,
        {
          player_id: playerId,
          enabled,
        },
      ),

    startPeladaTimer: (id: string) =>
      client.post<Pelada>(`/api/peladas/${id}/timer/start`, {}),
    pausePeladaTimer: (id: string) =>
      client.post<Pelada>(`/api/peladas/${id}/timer/pause`, {}),
    resetPeladaTimer: (id: string) =>
      client.post<Pelada>(`/api/peladas/${id}/timer/reset`, {}),

    // Schedule
    getSchedulePreview: (id: string, matchesPerTeam: number) =>
      client.get<{
        matches: { home: string; away: string }[];
        template_matches?: { home: string; away: string }[];
        random_matches?: { home: string; away: string }[];
        is_from_format: boolean;
      }>(`/api/peladas/${id}/schedule/preview`, {
        matches_per_team: matchesPerTeam,
      }),
    saveSchedulePlan: (id: string, matches: { home: string; away: string }[]) =>
      client.post<{ status: string }>(`/api/peladas/${id}/schedule`, {
        matches,
      }),
    getSchedulePlan: (id: string) =>
      client.get<{ home: string; away: string; sequence: number }[]>(
        `/api/peladas/${id}/schedule`,
      ),

    // Teams
    createTeam: (payload: { pelada_id: string; name: string }) =>
      client.post<Team>("/api/teams", payload),
    deleteTeam: (teamId: string) => client.delete(`/api/teams/${teamId}`),
    addPlayerToTeam: (
      teamId: string,
      playerId: string,
      isGoalkeeper?: boolean,
    ) =>
      client.post(`/api/teams/${teamId}/players`, {
        player_id: playerId,
        is_goalkeeper: isGoalkeeper,
      }),
    removePlayerFromTeam: (teamId: string, playerId: string) =>
      client.delete<void>(`/api/teams/${teamId}/players`, {
        player_id: playerId,
      }),

    // Matches
    updateMatchScore: (
      id: string,
      home: number,
      away: number,
      status?: string,
    ) =>
      client.put(`/api/matches/${id}/score`, {
        home_score: home,
        away_score: away,
        status,
      }),
    startMatchTimer: (id: string) =>
      client.post<Match>(`/api/matches/${id}/timer/start`, {}),
    pauseMatchTimer: (id: string) =>
      client.post<Match>(`/api/matches/${id}/timer/pause`, {}),
    resetMatchTimer: (id: string) =>
      client.post<Match>(`/api/matches/${id}/timer/reset`, {}),

    createMatchEvent: (
      id: string,
      playerId: string,
      eventType: MatchEventType,
      sessionTimeMs?: number,
      matchTimeMs?: number,
      assistantId?: string,
      teamId?: string,
    ) =>
      client.post(`/api/matches/${id}/events`, {
        player_id: playerId,
        event_type: eventType,
        session_time_ms: sessionTimeMs,
        match_time_ms: matchTimeMs,
        assistant_id: assistantId,
        team_id: teamId,
      }),

    deleteMatchEvent: (
      id: string,
      playerId: string,
      eventType: MatchEventType,
      eventId?: string,
    ) =>
      client.delete<void>(`/api/matches/${id}/events`, {
        player_id: playerId,
        event_type: eventType,
        id: eventId,
      }),
    updateMatchEvent: (
      id: string,
      eventId: string,
      playerId: string,
      assistantId?: string | null,
    ) =>
      client.put(`/api/matches/${id}/events/${eventId}`, {
        player_id: playerId,
        assistant_id: assistantId,
      }),

    // Match lineups (per-match players)
    addMatchLineupPlayer: (matchId: string, teamId: string, playerId: string) =>
      client.post(`/api/matches/${matchId}/lineups`, {
        team_id: teamId,
        player_id: playerId,
      }),
    replaceMatchLineupPlayer: (
      matchId: string,
      teamId: string,
      outPlayerId: string,
      inPlayerId: string,
    ) =>
      client.post(`/api/matches/${matchId}/lineups/replace`, {
        team_id: teamId,
        out_player_id: outPlayerId,
        in_player_id: inPlayerId,
      }),

    // Support Lineup
    generatePeladaSupportLineup: (peladaId: string) =>
      client.post<Match[]>(
        `/api/peladas/${peladaId}/support-lineup/generate`,
        {},
      ),
    updateMatchSupportLineup: (
      matchId: string,
      data: {
        support_camera_player_id?: string | null;
        support_stats_player_id?: string | null;
      },
    ) => client.put<Match>(`/api/matches/${matchId}/support-lineup`, data),
    rerollMatchSupportLineup: (matchId: string) =>
      client.post<Match>(`/api/matches/${matchId}/support-lineup/reroll`, {}),

    // Players
    listPlayersByOrg: (organizationId: string) =>
      client.get<Player[]>(`/api/organizations/${organizationId}/players`),
    createPlayer: (payload: Partial<Player>) =>
      client.post<Player>("/api/players", payload),
    updatePlayer: (id: string, payload: Partial<Player>) =>
      client.put<Player>(`/api/players/${id}`, payload),
    deletePlayer: (id: string) => client.delete(`/api/players/${id}`),

    // Users
    listUsers: () => client.get<User[]>("/api/users"),
    getProfileDashboard: (userId: string, year?: number) =>
      client.get<UserProfileDashboard>(
        `/api/user/${userId}/profile-dashboard`,
        { year: year ?? 0 },
      ),
    searchUsers: (query: string, page: number = 1, perPage: number = 20) =>
      client.getPaginated<User[]>("/api/users/search", {
        q: query,
        page,
        per_page: perPage,
      }),

    firstAccess: (payload: {
      name: string;
      username: string;
      email: string;
      token: string;
      password?: string;
      position?: string;
      phone?: string;
    }) =>
      client.post<{ token: string; user: User }>("/auth/first-access", payload),

    // Organization Admins
    listAdminsByOrganization: (organizationId: string) =>
      client.get<OrganizationAdmin[]>(
        `/api/organizations/${organizationId}/admins`,
      ),
    listOrganizationInvitations: (organizationId: string) =>
      client.get<OrganizationInvitation[]>(
        `/api/organizations/${organizationId}/invitations`,
      ),
    revokeInvitation: (organizationId: string, invitationId: string) =>
      client.delete(
        `/api/organizations/${organizationId}/invitations/${invitationId}`,
      ),
    listUserOrganizations: (userId: string) =>
      client.get<(Organization & { role: "admin" | "player" })[]>(
        `/api/users/${userId}/organizations`,
      ),
    listPendingInvitations: () =>
      client.get<OrganizationInvitation[]>("/api/invitations/pending"),
    getInvitationInfo: (token: string) =>
      client.get<OrganizationInvitation>(`/auth/invitations/${token}`),
    acceptInvitation: (token: string) =>
      client.post<{ organization_id: string }>(
        `/api/invitations/${token}/accept`,
        {},
      ),
    addOrganizationAdmin: (organizationId: string, userId: string) =>
      client.post<OrganizationAdmin>(
        `/api/organizations/${organizationId}/admins`,
        { user_id: userId },
      ),
    removeOrganizationAdmin: (organizationId: string, userId: string) =>
      client.delete(`/api/organizations/${organizationId}/admins/${userId}`),

    // Voting
    getVotingInfo: (peladaId: string) =>
      client.get<VotingInfo>(`/api/peladas/${peladaId}/voting-info`),
    getVotingResults: (peladaId: string) =>
      client.get<VotingResults>(`/api/peladas/${peladaId}/voting-results`),
    getVotingStatus: (peladaId: string) =>
      client.get<VotingStatus>(`/api/peladas/${peladaId}/voting-status`),
    batchCastVotes: (peladaId: string, payload: BatchVotePayload) =>
      client.post<BatchVoteResponse>(
        `/api/peladas/${peladaId}/votes/batch`,
        payload,
      ),
    getOrgFeatureFlags: (id: string) =>
      client.get<OrganizationFeatureFlags>(
        `/api/organizations/${id}/feature-flags`,
      ),

    // Global Admin Actions
    listOrganizationsAdmin: (
      query: string = "",
      page: number = 1,
      perPage: number = 20,
    ) =>
      client.getPaginated<Organization[]>("/api/admin/organizations", {
        q: query,
        page,
        per_page: perPage,
      }),
    toggleBlockOrganization: (id: string) =>
      client.post<{ id: string; is_blocked: boolean }>(
        `/api/admin/organizations/${id}/toggle-block`,
        {},
      ),
    getOrganizationFeatureFlagsAdmin: (id: string) =>
      client.get<OrganizationFeatureFlags>(
        `/api/admin/organizations/${id}/feature-flags`,
      ),
    updateOrganizationFeatureFlagsAdmin: (
      id: string,
      flags: Partial<OrganizationFeatureFlags>,
    ) =>
      client.put<OrganizationFeatureFlags>(
        `/api/admin/organizations/${id}/feature-flags`,
        flags,
      ),
    toggleBlockUser: (id: string) =>
      client.post<{ id: string; is_blocked: boolean }>(
        `/api/admin/users/${id}/toggle-block`,
        {},
      ),
    toggleOrgCreation: (id: string) =>
      client.post<{ id: string; allow_org_creation: boolean }>(
        `/api/admin/users/${id}/toggle-org-creation`,
        {},
      ),
    toggleGlobalAdmin: (id: string) =>
      client.post<{ id: string; is_super_admin: boolean }>(
        `/api/admin/users/${id}/toggle-global-admin`,
        {},
      ),
    deleteUser: (id: string) => client.delete<void>(`/api/user/${id}`),
    resetUserPassword: (id: string, password: string) =>
      client.post<{ id: string; message: string }>(
        `/api/user/${id}/reset-password`,
        { password },
      ),
    listPeladasAdmin: (page: number = 1, perPage: number = 20) =>
      client.getPaginated<Pelada[]>("/api/admin/peladas", {
        page,
        per_page: perPage,
      }),
    deletePeladaAdmin: (id: string) =>
      client.delete<void>(`/api/admin/peladas/${id}`),
    searchLocations: (query: string) =>
      client.get<GeoLocationSuggestion[]>("/api/geo/search", {
        q: query.trim(),
      }),
  };
}
