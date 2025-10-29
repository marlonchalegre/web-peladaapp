import { ApiClient } from './client'

export type Organization = { id: number; name: string }
export type User = { id: number; name: string; email: string }
export type Player = { id: number; user_id: number; organization_id: number; grade?: number | null; position_id?: number | null }
export type Pelada = { id: number; organization_id: number; scheduled_at?: string | null; when?: string | null; num_teams?: number | null; players_per_team?: number | null; status?: string | null }
export type Team = { id: number; pelada_id: number; name: string }
export type TeamPlayer = { team_id: number; player_id: number }
export type Match = { id: number; pelada_id: number; sequence: number; status?: string | null; home_team_id: number; away_team_id: number; home_score: number; away_score: number }
export type Substitution = { id: number; match_id: number; out_player_id: number; in_player_id: number; minute?: number | null }
export type NormalizedScore = { score: number }
export type MatchEventType = 'assist' | 'goal' | 'own_goal'
export type MatchEvent = { id: number; match_id: number; player_id: number; event_type: MatchEventType; created_at?: string }
export type PlayerStats = { player_id: number; goals: number; assists: number; own_goals: number }
export type MatchLineupEntry = { team_id: number; player_id: number }

export function createApi(client: ApiClient) {
  return {
    // Organizations
    listOrganizations: () => client.get<Organization[]>('/api/organizations'),
    getOrganization: (id: number) => client.get<Organization>(`/api/organizations/${id}`),
    createOrganization: (name: string) => client.post<Organization>('/api/organizations', { name }),
    deleteOrganization: (id: number) => client.delete(`/api/organizations/${id}`),

    // Peladas
    listPeladasByOrg: (organizationId: number) => client.get<Pelada[]>(`/api/organizations/${organizationId}/peladas`),
    getPelada: (id: number) => client.get<Pelada>(`/api/peladas/${id}`),
    createPelada: (payload: Partial<Pelada>) => client.post<Pelada>('/api/peladas', payload),
    deletePelada: (id: number) => client.delete(`/api/peladas/${id}`),
    beginPelada: (id: number, matchesPerTeam?: number) => client.post(`/api/peladas/${id}/begin`, matchesPerTeam ? { matches_per_team: matchesPerTeam } : undefined),
    closePelada: (id: number) => client.post(`/api/peladas/${id}/close`),

    // Teams
    listTeamsByPelada: (peladaId: number) => client.get<Team[]>(`/api/peladas/${peladaId}/teams`),
    listTeamPlayers: (teamId: number) => client.get<TeamPlayer[]>(`/api/teams/${teamId}/players`),
    createTeam: (payload: { pelada_id: number; name: string }) => client.post<Team>('/api/teams', payload),
    addPlayerToTeam: (teamId: number, playerId: number) => client.post(`/api/teams/${teamId}/players`, { player_id: playerId }),
    removePlayerFromTeam: (teamId: number, playerId: number) => client.delete(`/api/teams/${teamId}/players`, { player_id: playerId } as any),

    // Matches
    listMatchesByPelada: (peladaId: number) => client.get<Match[]>(`/api/peladas/${peladaId}/matches`),
    listMatchEventsByPelada: (peladaId: number) => client.get<MatchEvent[]>(`/api/peladas/${peladaId}/events`),
    listPlayerStatsByPelada: (peladaId: number) => client.get<PlayerStats[]>(`/api/peladas/${peladaId}/player-stats`),
    updateMatchScore: (id: number, home: number, away: number, status?: string) => client.put(`/api/matches/${id}/score`, { home_score: home, away_score: away, status }),
    createMatchEvent: (id: number, playerId: number, eventType: MatchEventType) => client.post(`/api/matches/${id}/events`, { player_id: playerId, event_type: eventType }),
    deleteMatchEvent: (id: number, playerId: number, eventType: MatchEventType) => client.delete(`/api/matches/${id}/events`, { player_id: playerId, event_type: eventType } as any),

    // Match lineups (per-match players)
    listMatchLineups: (matchId: number) => client.get<Record<number, MatchLineupEntry[]>>(`/api/matches/${matchId}/lineups`),
    addMatchLineupPlayer: (matchId: number, teamId: number, playerId: number) => client.post(`/api/matches/${matchId}/lineups`, { team_id: teamId, player_id: playerId }),
    removeMatchLineupPlayer: (matchId: number, teamId: number, playerId: number) => client.delete(`/api/matches/${matchId}/lineups`, { team_id: teamId, player_id: playerId } as any),
    replaceMatchLineupPlayer: (matchId: number, teamId: number, outPlayerId: number, inPlayerId: number) => client.post(`/api/matches/${matchId}/lineups/replace`, { team_id: teamId, out_player_id: outPlayerId, in_player_id: inPlayerId }),

    // Substitutions
    listSubstitutions: (matchId: number) => client.get<Substitution[]>(`/api/matches/${matchId}/substitutions`),
    createSubstitution: (matchId: number, outPlayerId: number, inPlayerId: number, minute?: number) =>
      client.post(`/api/matches/${matchId}/substitutions`, { out_player_id: outPlayerId, in_player_id: inPlayerId, minute }),

    // Players
    listPlayersByOrg: (organizationId: number) => client.get<Player[]>(`/api/organizations/${organizationId}/players`),
    createPlayer: (payload: Partial<Player>) => client.post<Player>('/api/players', payload),
    getPlayer: (id: number) => client.get<Player>(`/api/players/${id}`),

    // Users
    listUsers: () => client.get<User[]>('/api/users'),

    // Scores
    getNormalizedScore: (peladaId: number, orgPlayerId: number) => client.get<NormalizedScore>(`/api/peladas/${peladaId}/players/${orgPlayerId}/normalized-score`),
  }
}
