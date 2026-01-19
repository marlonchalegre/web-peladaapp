import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import PeladaDetailPage from './PeladaDetailPage'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { api } from '../../../shared/api/client'

// Mock the API client
vi.mock('../../../shared/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}))

// Mock AuthContext
vi.mock('../../../app/providers/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}))

describe('PeladaDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders pelada details and teams', async () => {
    const mockFullDetails = {
      pelada: { id: 1, organization_id: 101, status: 'open', players_per_team: 5 },
      teams: [
        { id: 1, name: 'Time 1', players: [{ id: 10, user_id: 1, user: { id: 1, name: 'Player 1' } }] }
      ],
      available_players: [{ id: 11, user_id: 2, user: { id: 2, name: 'Player 2' } }],
      users_map: { 1: { id: 1, name: 'Player 1' }, 2: { id: 2, name: 'Player 2' } },
      org_players_map: { 10: { id: 10, user_id: 1 }, 11: { id: 11, user_id: 2 } },
      voting_info: { can_vote: false, has_voted: false, eligible_players: [] }
    }

    ;(api.get as Mock).mockImplementation((path: string) => {
      if (path === '/api/peladas/1/full-details') return Promise.resolve(mockFullDetails)
      return Promise.reject(new Error('Not found'))
    })

    ;(api.post as Mock).mockImplementation((path: string) => {
      if (path === '/api/scores/normalized') return Promise.resolve({ scores: {} })
      return Promise.resolve({})
    })

    render(
      <MemoryRouter initialEntries={['/peladas/1']}>
        <Routes>
          <Route path="/peladas/:id" element={<PeladaDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      // With simple mock t(k) -> k, we lose replacement. 
      // t('peladas.detail.title', { id: 1 }) -> 'peladas.detail.title'
      expect(screen.getAllByText('peladas.detail.title').length).toBeGreaterThan(0)
      expect(screen.getByText('Time 1')).toBeInTheDocument()
      expect(screen.getByText(/Player 1/)).toBeInTheDocument()
      expect(screen.getByText(/Player 2/)).toBeInTheDocument()
    })
  })
})
