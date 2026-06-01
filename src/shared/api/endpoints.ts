import { ApiClient } from "./client";

export interface Organization {
  id: string;
  name: string;
  owner_id?: string | null;
  waha_api_url?: string | null;
  waha_instance?: string | null;
  waha_group_id?: string | null;
  waha_enabled?: boolean | null;
  waha_start_msg_enabled?: boolean | null;
  waha_end_msg_enabled?: boolean | null;
  waha_attendance_reminder_enabled?: boolean | null;
  waha_vote_reminder_enabled?: boolean | null;
  waha_vote_ended_msg_enabled?: boolean | null;
  waha_use_all_mention?: boolean | null;
  is_blocked?: boolean;
}
export interface OrganizationFeatureFlags {
  organization_id: string;
  finance_control: boolean;
  waha_communications: boolean;
  player_characteristics: boolean;
  monthly_substitutions: boolean;
  org_statistics: boolean;
  peer_voting: boolean;
  unlimited_members: boolean;
  unlimited_peladas: boolean;
}
export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  admin_orgs?: string[];
  position?: string;
  avatar_filename?: string | null;
  is_super_admin?: boolean;
  is_blocked?: boolean;
  allow_org_creation?: boolean;
}
export interface Player {
  id: string;
  user_id: string;
  organization_id: string;
  grade?: number | null;
  position?: string | null;
  position_id?: string | null;
  member_type?:
    | "mensalista"
    | "diarista"
    | "convidado"
    | "mensalista_temporario"
    | "diarista_temporario";
  user_name?: string;
  user_username?: string;
  user_position?: string;
  user_avatar_filename?: string | null;
  position_name?: string;
  passing?: number;
  ball_control?: number;
  velocity?: number;
  shooting?: number;
  dribbling?: number;
  defending?: number;
  user_email?: string;
}
export interface MonthlyPlayerSubstitution {
  id: string;
  organization_id: string;
  permanent_player_id: string;
  temporary_player_id: string;
  start_date: string;
  end_date?: string | null;
  active: boolean;
  permanent_player_name?: string;
  temporary_player_name?: string;
  created_at?: string;
}
export interface OrganizationAdmin {
  id: string;
  organization_id: string;
  user_id: string;
  user_name?: string;
  user_username?: string;
  user_email?: string;
  user_position?: string;
  user_avatar_filename?: string | null;
  organization_name?: string;
  created_at?: string;
}

export type TimerStatus = "stopped" | "running" | "paused";

export interface Pelada {
  id: string;
  organization_id: string;
  organization_name?: string;
  scheduled_at?: string | null;
  when?: string | null;
  num_teams?: number | null;
  players_per_team?: number | null;
  creator_id?: string | null;
  fixed_goalkeepers?: boolean | null;
  home_fixed_goalkeeper_id?: string | null;
  away_fixed_goalkeeper_id?: string | null;
  status?: string | null;
  closed_at?: string | null;
  is_admin?: boolean;
  has_schedule_plan?: boolean;
  timer_started_at?: string | null;
  timer_accumulated_ms?: number | null;
  timer_status?: TimerStatus | null;
  user_attendance_status?: string | null;
}

export interface Team {
  id: string;
  pelada_id: string;
  name: string;
}
export interface TeamPlayer {
  team_id: string;
  player_id: string;
  is_goalkeeper?: boolean;
}
export interface Match {
  id: string;
  pelada_id: string;
  sequence: number;
  status?: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number;
  away_score: number;
  timer_started_at?: string | null;
  timer_accumulated_ms?: number | null;
  timer_status?: TimerStatus | null;
}
export type MatchEventType = "assist" | "goal" | "own_goal";
export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  event_type: MatchEventType;
  created_at?: string;
  session_time_ms?: number | null;
  match_time_ms?: number | null;
}
export interface PlayerStats {
  player_id: string;
  user_id: string;
  name: string;
  goals: number;
  assists: number;
  own_goals: number;
}
export interface OrganizationPlayerStats {
  player_id: string;
  user_id?: string;
  player_name: string;
  player_position?: string;
  avatar_filename?: string | null;
  peladas_played: number;
  goal: number;
  assist: number;
  own_goal: number;
  avg_rating: number;
}
export interface MatchLineupEntry {
  team_id: string;
  player_id: string;
  is_goalkeeper?: boolean;
}
export interface PeladaDashboardDataResponse {
  pelada: Pelada;
  matches: Match[];
  teams: Team[];
  users: User[];
  organization_players: Player[];
  match_events: MatchEvent[];
  player_stats: PlayerStats[] | null;
  pelada_transactions?: Transaction[];
  team_players_map: Record<string, TeamPlayer[]>;
  match_lineups_map: Record<string, Record<string, MatchLineupEntry[]>>;
  attendance?: { player_id: string; status: string; updated_at?: string }[];
}
export interface VotingInfo {
  can_vote: boolean;
  has_voted: boolean;
  eligible_players: {
    player_id: string;
    name: string;
    position?: string;
    avatar_filename?: string | null;
    voting_enabled?: boolean;
    goals?: number;
    assists?: number;
    own_goals?: number;
  }[];
  current_votes?: { target_id: string; stars: number }[];
  voter_player_id?: string | null;
  message?: string;
}

export interface PlayerResult {
  player_id: string;
  user_id?: string;
  name: string;
  position?: string;
  avatar_filename?: string | null;
  average_stars: number;
  goals: number;
  assists: number;
  own_goals: number;
}

export interface VotingResults {
  mvp: PlayerResult[];
  striker: PlayerResult[];
  garcom: PlayerResult[];
  voters: {
    player_id: string;
    name: string;
    has_voted: boolean;
  }[];
  total_eligible: number;
  total_voted: number;
  organization_id?: string;
  organization_name?: string;
}

export interface VotingStatus {
  voters: {
    player_id: string;
    name: string;
    has_voted: boolean;
  }[];
  total_eligible: number;
  total_voted: number;
}

export interface BatchVotePayload {
  voter_id: string;
  votes: { target_id: string; stars: number }[];
}
export interface BatchVoteResponse {
  votes_cast: number;
}

export interface OrganizationFinance {
  id: string;
  organization_id: string;
  mensalista_price: number;
  diarista_price: number;
  monthly_fine_amount?: number;
  monthly_cut_off_day?: number;
  currency: string;
}

export interface Transaction {
  id: string;
  organization_id: string;
  player_id?: string | null;
  player_name?: string | null;
  pelada_id?: string | null;
  amount: number;
  fine_amount?: number | null;
  type: "income" | "expense";
  category: string;
  description?: string | null;
  payment_date: string;
  pelada_date?: string | null;
  created_by?: string | null;
  creator_name?: string | null;
  created_at?: string;
  status?: "paid" | "reversed";
}

export interface MonthlyPayment {
  id?: string;
  organization_id: string;
  player_id: string;
  player_name: string;
  member_type: string;
  year: number;
  month: number;
  transaction_id?: string | null;
  fine_transaction_id?: string | null;
  amount?: number;
  fine_amount?: number;
  fine_status?: "paid" | "reversed";
  paid: boolean;
}

export interface FinanceSummary {
  total_balance: number;
  total_income: number;
  total_expense: number;
}

export type AttendanceStatus =
  | "confirmed"
  | "declined"
  | "pending"
  | "waitlist";
export interface Attendance {
  id?: string;
  pelada_id?: string;
  player_id: string;
  "player-id"?: string;
  playerId?: string;
  status: string;
  Status?: string;
  avatar_filename?: string | null;
  updated_at?: string;
  voting_enabled?: boolean;
  player?: Player & { user: User };
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  organization_name?: string;
  email?: string;
  token: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
}

export interface PeladaFullDetailsResponse {
  pelada: Pelada;
  teams: (Team & {
    players: (Player & { user: User; is_goalkeeper?: boolean })[];
  })[];
  available_players: (Player & {
    user: User;
    attendance_status?: AttendanceStatus;
  })[];
  scores: Record<string, number>;
  attendance: Attendance[];
  pelada_transactions?: Transaction[];
  users_map: Record<string, User>;
  org_players_map: Record<string, Player>;
  voting_info: VotingInfo | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

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
    ) =>
      client.post(`/api/matches/${id}/events`, {
        player_id: playerId,
        event_type: eventType,
        session_time_ms: sessionTimeMs,
        match_time_ms: matchTimeMs,
        assistant_id: assistantId,
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
      teamId: string | string,
      outPlayerId: string,
      inPlayerId: string,
    ) =>
      client.post(`/api/matches/${matchId}/lineups/replace`, {
        team_id: teamId,
        out_player_id: outPlayerId,
        in_player_id: inPlayerId,
      }),

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
  };
}
