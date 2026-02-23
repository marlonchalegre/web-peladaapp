import { ApiClient } from "./client";

export type Organization = { id: number; name: string };
export type User = {
  id: number;
  name: string;
  email: string;
  admin_orgs?: number[];
  position?: string;
};
export type Player = {
  id: number;
  user_id: number;
  organization_id: number;
  grade?: number | null;
  position_id?: number | null;
  user_name?: string;
  user_email?: string;
};
export type OrganizationAdmin = {
  id: number;
  organization_id: number;
  user_id: number;
  user_name?: string;
  user_email?: string;
  organization_name?: string;
  created_at?: string;
};
export type Pelada = {
  id: number;
  organization_id: number;
  organization_name?: string;
  scheduled_at?: string | null;
  when?: string | null;
  num_teams?: number | null;
  players_per_team?: number | null;
  status?: string | null;
  closed_at?: string | null;
};
export type Team = { id: number; pelada_id: number; name: string };
export type TeamPlayer = { team_id: number; player_id: number };
export type Match = {
  id: number;
  pelada_id: number;
  sequence: number;
  status?: string | null;
  home_team_id: number;
  away_team_id: number;
  home_score: number;
  away_score: number;
};
export type MatchEventType = "assist" | "goal" | "own_goal";
export type MatchEvent = {
  id: number;
  match_id: number;
  player_id: number;
  event_type: MatchEventType;
  created_at?: string;
};
export type PlayerStats = {
  player_id: number;
  user_id: number;
  name: string;
  goals: number;
  assists: number;
  own_goals: number;
};
export type MatchLineupEntry = { team_id: number; player_id: number };
export type PeladaDashboardDataResponse = {
  pelada: Pelada;
  matches: Match[];
  teams: Team[];
  users: User[];
  organization_players: Player[];
  match_events: MatchEvent[];
  player_stats: PlayerStats[] | null;
  team_players_map: Record<number, TeamPlayer[]>;
  match_lineups_map: Record<number, Record<number, MatchLineupEntry[]>>;
};
export type VotingInfo = {
  can_vote: boolean;
  has_voted: boolean;
  eligible_players: { player_id: number; name: string }[];
  current_votes?: { target_id: number; stars: number }[];
  voter_player_id?: number | null;
  message?: string;
};
export type BatchVotePayload = {
  voter_id: number;
  votes: { target_id: number; stars: number }[];
};
export type BatchVoteResponse = { votes_cast: number };

export type AttendanceStatus = "confirmed" | "declined" | "pending";
export type Attendance = {
  id: number;
  pelada_id: number;
  player_id: number;
  status: AttendanceStatus;
  player: Player & { user: User };
};

export type OrganizationInvitation = {
  id: number;
  organization_id: number;
  organization_name?: string;
  email?: string;
  token: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
};

export type PeladaFullDetailsResponse = {
  pelada: Pelada;
  teams: (Team & { players: (Player & { user: User })[] })[];
  available_players: (Player & {
    user: User;
    attendance_status?: AttendanceStatus;
  })[];
  scores: Record<number, number>;
  attendance: Attendance[];
  users_map: Record<number, User>;
  org_players_map: Record<number, Player>;
  voting_info: VotingInfo | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

export function createApi(client: ApiClient) {
  return {
    // Organizations
    getOrganization: (id: number) =>
      client.get<Organization>(`/api/organizations/${id}`),
    createOrganization: (name: string) =>
      client.post<Organization>("/api/organizations", { name }),
    deleteOrganization: (id: number) =>
      client.delete(`/api/organizations/${id}`),
    leaveOrganization: (id: number) =>
      client.post(`/api/organizations/${id}/leave`, {}),
    invitePlayer: (id: number, email: string) =>
      client.post<{
        user_id: number;
        email: string;
        is_new_user: boolean;
        organization_id: number;
      }>(`/api/organizations/${id}/invite`, { email }),
    getInviteLink: (id: number) =>
      client.get<{ token: string }>(`/api/organizations/${id}/invite-link`),
    getOrganizationStatistics: (id: number, year: number) =>
      client.get<
        {
          player_id: number;
          player_name: string;
          peladas_played: number;
          goal: number;
          assist: number;
          own_goal: number;
        }[]
      >(`/api/organizations/${id}/statistics`, { year }),

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
    closeAttendance: (id: number) =>
      client.post<Pelada>(`/api/peladas/${id}/close-attendance`),

    // Teams
    createTeam: (payload: { pelada_id: number; name: string }) =>
      client.post<Team>("/api/teams", payload),
    deleteTeam: (teamId: number) => client.delete(`/api/teams/${teamId}`),
    addPlayerToTeam: (teamId: number, playerId: number) =>
      client.post(`/api/teams/${teamId}/players`, { player_id: playerId }),
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
    createMatchEvent: (
      id: number,
      playerId: number,
      eventType: MatchEventType,
    ) =>
      client.post(`/api/matches/${id}/events`, {
        player_id: playerId,
        event_type: eventType,
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
    batchCastVotes: (peladaId: number, payload: BatchVotePayload) =>
      client.post<BatchVoteResponse>(
        `/api/peladas/${peladaId}/votes/batch`,
        payload,
      ),
  };
}
