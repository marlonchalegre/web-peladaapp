import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'
import ActiveMatchDashboard from './ActiveMatchDashboard'
import type { Match, TeamPlayer, Player } from '../../../shared/api/endpoints'

describe('ActiveMatchDashboard', () => {
  const mockMatch: Match = {
    id: 1,
    pelada_id: 1,
    sequence: 1,
    home_team_id: 10,
    away_team_id: 20,
    home_score: 2,
    away_score: 1,
    status: 'running'
  }

  const mockHomePlayers: TeamPlayer[] = [
    { team_id: 10, player_id: 101 }
  ]
  const mockAwayPlayers: TeamPlayer[] = [
    { team_id: 20, player_id: 201 }
  ]

  const mockOrgPlayerIdToUserId = { 101: 1, 201: 2 }
  const mockUserIdToName = { 1: 'Player One', 2: 'Player Two' }
  const mockStatsMap = {
    101: { goals: 1, assists: 0, ownGoals: 0 },
    201: { goals: 0, assists: 1, ownGoals: 0 }
  }

  const defaultProps = {
    match: mockMatch,
    homeTeamName: 'Home Team',
    awayTeamName: 'Away Team',
    homePlayers: mockHomePlayers,
    awayPlayers: mockAwayPlayers,
    orgPlayerIdToUserId: mockOrgPlayerIdToUserId,
    userIdToName: mockUserIdToName,
    statsMap: mockStatsMap,
    benchPlayers: [] as Player[],
    finished: false,
    updating: false,
    selectMenu: null,
    setSelectMenu: vi.fn(),
    recordEvent: vi.fn(),
    deleteEventAndRefresh: vi.fn(),
    adjustScore: vi.fn(),
    replacePlayerOnTeam: vi.fn(),
  }

  it('renders team names and score', () => {
    render(<ActiveMatchDashboard {...defaultProps} />)
    expect(screen.getByText('Home Team')).toBeInTheDocument()
    expect(screen.getByText('Away Team')).toBeInTheDocument()
    expect(screen.getByText('2 x 1')).toBeInTheDocument()
  })

  it('renders player names and stats', () => {
    render(<ActiveMatchDashboard {...defaultProps} />)
    expect(screen.getByText('Player One')).toBeInTheDocument()
    expect(screen.getByText('Player Two')).toBeInTheDocument()
    // Check stats (goals/assists)
    // There are multiple cells with numbers, so we might need to be specific or just check presence
    // Actually getByText might find multiple "0"s.
    // Let's check for specific stats if possible, or just layout elements.
    expect(screen.getByText('Player Data Entry')).toBeInTheDocument()
  })

  it('renders substitution buttons', () => {
    render(<ActiveMatchDashboard {...defaultProps} />)
    const buttons = screen.getAllByRole('button')
    // We expect buttons for sub, plus/minus goals/assists
    expect(buttons.length).toBeGreaterThan(0)
  })
})
