import { ApiClient } from "./client";

export interface Organization {
  id: number;
  name: string;
  owner_id?: number | null;
  waha_api_url?: string | null;
  waha_instance?: string | null;
  waha_group_id?: string | null;
  waha_enabled?: boolean | null;
  waha_start_msg_enabled?: boolean | null;
  waha_end_msg_enabled?: boolean | null;
  waha_attendance_reminder_enabled?: boolean | null;
  waha_vote_reminder_enabled?: boolean | null;
  waha_vote_ended_msg_enabled?: boolean | null;
}
export interface User {
  id: number;
  name: string;
  username: string;
  email?: string;
  admin_orgs?: number[];
  position?: string;
  avatar_filename?: string | null;
}
export interface Player {
  id: number;
  user_id: number;
  organization_id: number;
  grade?: number | null;
  position_id?: number | null;
  member_type?: "mensalista" | "diarista" | "convidado";
  user_name?: string;
  user_username?: string;
  user_position?: string;
  avatar_filename?: string | null;
  position_name?: string;
  user_email?: string;
}
export interface OrganizationAdmin {
  id: number;
  organization_id: number;
  user_id: number;
  user_name?: string;
  user_username?: string;
  user_email?: string;
  user_position?: string;
  organization_name?: string;
  created_at?: string;
}

export type TimerStatus = "stopped" | "running" | "paused";

export interface Pelada {
  id: number;
  organization_id: number;
  organization_name?: string;
  scheduled_at?: string | null;
  when?: string | null;
  num_teams?: number | null;
  players_per_team?: number | null;
  creator_id?: number | null;
  fixed_goalkeepers?: boolean | null;
  home_fixed_goalkeeper_id?: number | null;
  away_fixed_goalkeeper_id?: number | null;
  status?: string | null;
  closed_at?: string | null;
  is_admin?: boolean;
  has_schedule_plan?: boolean;
  timer_started_at?: string | null;
  timer_accumulated_ms?: number | null;
  timer_status?: TimerStatus | null;
  vote_ended_message_sent?: boolean;
}

export interface Team {
  id: number;
  pelada_id: number;
  name: string;
}
export interface TeamPlayer {
  team_id: number;
  player_id: number;
  is_goalkeeper?: boolean;
}
export interface Match {
  id: number;
  pelada_id: number;
  sequence: number;
  status?: string | null;
  home_team_id: number;
  away_team_id: number;
  home_score: number;
  away_score: number;
  timer_started_at?: string | null;
  timer_accumulated_ms?: number | null;
  timer_status?: TimerStatus | null;
}
export type MatchEventType = "assist" | "goal" | "own_goal";
export interface MatchEvent {
  id: number;
  match_id: number;
  player_id: number;
  event_type: MatchEventType;
  created_at?: string;
  session_time_ms?: number | null;
  match_time_ms?: number | null;
}
export interface PlayerStats {
  player_id: number;
  user_id: number;
  name: string;
  goals: number;
  assists: number;
  own_goals: number;
}
export interface OrganizationPlayerStats {
  player_id: number;
  player_name: string;
  player_position?: string;
  peladas_played: number;
  goal: number;
  assist: number;
  own_goal: number;
  avg_rating: number;
}
export interface MatchLineupEntry {
  team_id: number;
  player_id: number;
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
  team_players_map: Record<number, TeamPlayer[]>;
  match_lineups_map: Record<number, Record<number, MatchLineupEntry[]>>;
  attendance?: { player_id: number; status: string; updated_at?: string }[];
}
export interface VotingInfo {
  can_vote: boolean;
  has_voted: boolean;
  eligible_players: {
    player_id: number;
    name: string;
    position?: string;
    avatar_filename?: string | null;
    voting_enabled?: boolean;
    goals?: number;
    assists?: number;
    own_goals?: number;
  }[];
  current_votes?: { target_id: number; stars: number }[];
  voter_player_id?: number | null;
  message?: string;
}

export interface PlayerResult {
  player_id: number;
  user_id?: number;
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
    player_id: number;
    name: string;
    has_voted: boolean;
  }[];
  total_eligible: number;
  total_voted: number;
  organization_id?: number;
  organization_name?: string;
}

export interface VotingStatus {
  voters: {
    player_id: number;
    name: string;
    has_voted: boolean;
  }[];
  total_eligible: number;
  total_voted: number;
}

export interface BatchVotePayload {
  voter_id: number;
  votes: { target_id: number; stars: number }[];
}
export interface BatchVoteResponse {
  votes_cast: number;
}

export interface OrganizationFinance {
  id: number;
  organization_id: number;
  mensalista_price: number;
  diarista_price: number;
  currency: string;
}

export interface Transaction {
  id: number;
  organization_id: number;
  player_id?: number | null;
  player_name?: string | null;
  pelada_id?: number | null;
  amount: number;
  type: "income" | "expense";
  category: string;
  description?: string | null;
  payment_date: string;
  created_by?: number | null;
  creator_name?: string | null;
  created_at?: string;
  status?: "paid" | "reversed";
}

export interface MonthlyPayment {
  id?: number;
  organization_id: number;
  player_id: number;
  player_name: string;
  member_type: string;
  year: number;
  month: number;
  transaction_id?: number | null;
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
  id?: number;
  pelada_id?: number;
  player_id: number;
  "player-id"?: number;
  playerId?: number;
  status: string;
  Status?: string;
  avatar_filename?: string | null;
  updated_at?: string;
  voting_enabled?: boolean;
  player?: Player & { user: User };
}

export interface OrganizationInvitation {
  id: number;
  organization_id: number;
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
  scores: Record<number, number>;
  attendance: Attendance[];
  pelada_transactions?: Transaction[];
  users_map: Record<number, User>;
  org_players_map: Record<number, Player>;
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
    getOrganization: (id: number) =>
      client.get<Organization>(`/api/organizations/${id}`),
    updateOrganization: (id: number, payload: Partial<Organization>) =>
      client.put<Organization>(`/api/organizations/${id}`, payload),
    createOrganization: (name: string) =>
      client.post<Organization>("/api/organizations", { name }),
    deleteOrganization: (id: number) =>
      client.delete(`/api/organizations/${id}`),
    leaveOrganization: (id: number) =>
      client.post(`/api/organizations/${id}/leave`, {}),
    invitePlayer: (id: number, email?: string, name?: string) =>
      client.post<{
        user_id: number;
        email?: string;
        name?: string;
        is_new_user: boolean;
        organization_id: number;
      }>(`/api/organizations/${id}/invite`, { email, name }),
    testWaha: (id: number) =>
      client.post<{ status: string; message: string }>(
        `/api/organizations/${id}/waha/test`,
        {},
      ),
    getInviteLink: (id: number) =>
      client.get<{ token: string }>(`/api/organizations/${id}/invite-link`),
    resetInviteLink: (id: number) =>
      client.post<{ token: string }>(
        `/api/organizations/${id}/invite-link/reset`,
        {},
      ),
    getOrganizationStatistics: (id: number, year: number) =>
      client.get<OrganizationPlayerStats[]>(
        `/api/organizations/${id}/statistics`,
        { year },
      ),

    // Finance
    getOrganizationFinance: (id: number) =>
      client.get<OrganizationFinance>(`/api/organizations/${id}/finance`),
    updateOrganizationFinance: (
      id: number,
      payload: Partial<OrganizationFinance>,
    ) =>
      client.put<{ message: string }>(
        `/api/organizations/${id}/finance`,
        payload,
      ),
    getFinanceSummary: (id: number) =>
      client.get<FinanceSummary>(`/api/organizations/${id}/finance/summary`),
    listTransactions: (id: number, page?: number, per_page?: number) =>
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
    addTransaction: (id: number, payload: Partial<Transaction>) =>
      client.post<Transaction>(
        `/api/organizations/${id}/finance/transactions`,
        payload,
      ),
    reverseTransaction: (id: number, txId: number) =>
      client.post<{ message: string }>(
        `/api/organizations/${id}/finance/transactions/${txId}/reverse`,
      ),
    getMonthlyPayments: (id: number, year: number, month: number) =>
      client.get<MonthlyPayment[]>(
        `/api/organizations/${id}/finance/monthly-payments`,
        { year, month },
      ),
    markMonthlyPayment: (
      id: number,
      payload: Partial<MonthlyPayment> & {
        amount: number;
        payment_date: string;
      },
    ) =>
      client.post<{ message: string; transaction_id?: number }>(
        `/api/organizations/${id}/finance/monthly-payments`,
        payload,
      ),

    // Manual Stats
    getManualStats: (id: number, year: number) =>
      client.get<
        {
          id: number;
          organization_id: number;
          player_id: number;
          year: number;
          goals: number;
          assists: number;
          own_goals: number;
        }[]
      >(`/api/organizations/${id}/manual-stats`, { year }),
    upsertManualStats: (
      id: number,
      stats: {
        player_id: number;
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
      organizationId: number,
      page: number = 1,
      perPage: number = 20,
    ) =>
      client.getPaginated<Pelada[]>(
        `/api/organizations/${organizationId}/peladas`,
        { page, per_page: perPage },
      ),
    listPeladasByUser: (
      userId: number,
      page: number = 1,
      perPage: number = 20,
    ) =>
      client.getPaginated<Pelada[]>(`/api/users/${userId}/peladas`, {
        page,
        per_page: perPage,
      }),
    getPeladaDashboardData: (id: number) =>
      client.get<PeladaDashboardDataResponse>(
        `/api/peladas/${id}/dashboard-data`,
      ),
    createPelada: (payload: Partial<Pelada>) =>
      client.post<Pelada>("/api/peladas", payload),
    deletePelada: (id: number) => client.delete(`/api/peladas/${id}`),
    beginPelada: (id: number, matchesPerTeam?: number) =>
      client.post<{ matches_created: number }>(
        `/api/peladas/${id}/begin`,
        matchesPerTeam ? { matches_per_team: matchesPerTeam } : undefined,
      ),
    closePelada: (id: number) =>
      client.post<Pelada>(`/api/peladas/${id}/close`),
    getPeladaFullDetails: (id: number) =>
      client.get<PeladaFullDetailsResponse>(`/api/peladas/${id}/full-details`),
    updateAttendance: (
      id: number,
      status: AttendanceStatus,
      playerId?: number,
    ) =>
      client.post<number>(`/api/peladas/${id}/attendance`, {
        status,
        player_id: playerId,
      }),
    batchUpdateAttendance: (
      id: number,
      playerIds: number[],
      status: AttendanceStatus,
    ) =>
      client.post<number>(`/api/peladas/${id}/attendance/batch`, {
        player_ids: playerIds,
        status,
      }),
    closeAttendance: (id: number) =>
      client.post<Pelada>(`/api/peladas/${id}/close-attendance`),
    updateVotingEnabled: (id: number, playerId: number, enabled: boolean) =>
      client.post<{ updated: number }>(
        `/api/peladas/${id}/attendance/voting-enabled`,
        {
          player_id: playerId,
          enabled,
        },
      ),

    startPeladaTimer: (id: number) =>
      client.post<Pelada>(`/api/peladas/${id}/timer/start`, {}),
    pausePeladaTimer: (id: number) =>
      client.post<Pelada>(`/api/peladas/${id}/timer/pause`, {}),
    resetPeladaTimer: (id: number) =>
      client.post<Pelada>(`/api/peladas/${id}/timer/reset`, {}),

    // Schedule
    getSchedulePreview: (id: number, matchesPerTeam: number) =>
      client.get<{
        matches: { home: number; away: number }[];
        template_matches?: { home: number; away: number }[];
        random_matches?: { home: number; away: number }[];
        is_from_format: boolean;
      }>(`/api/peladas/${id}/schedule/preview`, {
        matches_per_team: matchesPerTeam,
      }),
    saveSchedulePlan: (
      id: number,
      matchesPerTeam: number,
      matches: { home: number; away: number }[],
    ) =>
      client.post<{ status: string }>(`/api/peladas/${id}/schedule`, {
        matches_per_team: matchesPerTeam,
        matches,
      }),
    getSchedulePlan: (id: number) =>
      client.get<{ home: number; away: number; sequence: number }[]>(
        `/api/peladas/${id}/schedule`,
      ),

    // Teams
    createTeam: (payload: { pelada_id: number; name: string }) =>
      client.post<Team>("/api/teams", payload),
    deleteTeam: (teamId: number) => client.delete(`/api/teams/${teamId}`),
    addPlayerToTeam: (
      teamId: number,
      playerId: number,
      isGoalkeeper?: boolean,
    ) =>
      client.post(`/api/teams/${teamId}/players`, {
        player_id: playerId,
        is_goalkeeper: isGoalkeeper,
      }),
    removePlayerFromTeam: (teamId: number, playerId: number) =>
      client.delete<void>(`/api/teams/${teamId}/players`, {
        player_id: playerId,
      }),

    // Matches
    updateMatchScore: (
      id: number,
      home: number,
      away: number,
      status?: string,
    ) =>
      client.put(`/api/matches/${id}/score`, {
        home_score: home,
        away_score: away,
        status,
      }),
    startMatchTimer: (id: number) =>
      client.post<Match>(`/api/matches/${id}/timer/start`, {}),
    pauseMatchTimer: (id: number) =>
      client.post<Match>(`/api/matches/${id}/timer/pause`, {}),
    resetMatchTimer: (id: number) =>
      client.post<Match>(`/api/matches/${id}/timer/reset`, {}),

    createMatchEvent: (
      id: number,
      playerId: number,
      eventType: MatchEventType,
      sessionTimeMs?: number,
      matchTimeMs?: number,
    ) =>
      client.post(`/api/matches/${id}/events`, {
        player_id: playerId,
        event_type: eventType,
        session_time_ms: sessionTimeMs,
        match_time_ms: matchTimeMs,
      }),
    deleteMatchEvent: (
      id: number,
      playerId: number,
      eventType: MatchEventType,
    ) =>
      client.delete<void>(`/api/matches/${id}/events`, {
        player_id: playerId,
        event_type: eventType,
      }),

    // Match lineups (per-match players)
    addMatchLineupPlayer: (matchId: number, teamId: number, playerId: number) =>
      client.post(`/api/matches/${matchId}/lineups`, {
        team_id: teamId,
        player_id: playerId,
      }),
    replaceMatchLineupPlayer: (
      matchId: number,
      teamId: number,
      outPlayerId: number,
      inPlayerId: number,
    ) =>
      client.post(`/api/matches/${matchId}/lineups/replace`, {
        team_id: teamId,
        out_player_id: outPlayerId,
        in_player_id: inPlayerId,
      }),

    // Players
    listPlayersByOrg: (organizationId: number) =>
      client.get<Player[]>(`/api/organizations/${organizationId}/players`),
    createPlayer: (payload: Partial<Player>) =>
      client.post<Player>("/api/players", payload),
    updatePlayer: (id: number, payload: Partial<Player>) =>
      client.put<Player>(`/api/players/${id}`, payload),
    deletePlayer: (id: number) => client.delete(`/api/players/${id}`),

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
      password?: string;
      position?: string;
    }) =>
      client.post<{ token: string; user: User }>("/auth/first-access", payload),

    // Organization Admins
    listAdminsByOrganization: (organizationId: number) =>
      client.get<OrganizationAdmin[]>(
        `/api/organizations/${organizationId}/admins`,
      ),
    listOrganizationInvitations: (organizationId: number) =>
      client.get<OrganizationInvitation[]>(
        `/api/organizations/${organizationId}/invitations`,
      ),
    revokeInvitation: (organizationId: number, invitationId: number) =>
      client.delete(
        `/api/organizations/${organizationId}/invitations/${invitationId}`,
      ),
    listUserOrganizations: (userId: number) =>
      client.get<(Organization & { role: "admin" | "player" })[]>(
        `/api/users/${userId}/organizations`,
      ),
    listPendingInvitations: () =>
      client.get<OrganizationInvitation[]>("/api/invitations/pending"),
    getInvitationInfo: (token: string) =>
      client.get<OrganizationInvitation>(`/auth/invitations/${token}`),
    acceptInvitation: (token: string) =>
      client.post<{ organization_id: number }>(
        `/api/invitations/${token}/accept`,
        {},
      ),
    addOrganizationAdmin: (organizationId: number, userId: number) =>
      client.post<OrganizationAdmin>(
        `/api/organizations/${organizationId}/admins`,
        { user_id: userId },
      ),
    removeOrganizationAdmin: (organizationId: number, userId: number) =>
      client.delete(`/api/organizations/${organizationId}/admins/${userId}`),

    // Voting
    getVotingInfo: (peladaId: number) =>
      client.get<VotingInfo>(`/api/peladas/${peladaId}/voting-info`),
    getVotingResults: (peladaId: number) =>
      client.get<VotingResults>(`/api/peladas/${peladaId}/voting-results`),
    getVotingStatus: (peladaId: number) =>
      client.get<VotingStatus>(`/api/peladas/${peladaId}/voting-status`),
    batchCastVotes: (peladaId: number, payload: BatchVotePayload) =>
      client.post<BatchVoteResponse>(
        `/api/peladas/${peladaId}/votes/batch`,
        payload,
      ),
  };
}
