import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import PeladaVotingPage from './PeladaVotingPage'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { api } from '../../../shared/api/client'

// Mock the API client
vi.mock('../../../shared/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

// Mock AuthContext
vi.mock('../../../app/providers/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Current User', email: 'me@test.com' },
    isAuthenticated: true,
  }),
}))

describe('PeladaVotingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders voting form with eligible players', async () => {
    const mockUsers = [
      { id: 1, name: 'Current User' },
      { id: 2, name: 'Target Player' }
    ]
    const mockPelada = { id: 1, organization_id: 101 }
    const mockOrgPlayers = [
      { id: 10, user_id: 1, organization_id: 101 },
      { id: 11, user_id: 2, organization_id: 101 }
    ]
    const mockVotingInfo = {
      can_vote: true,
      has_voted: false,
      eligible_players: [11] // Player 11 (User 2) is eligible
    }

    ;(api.get as Mock).mockImplementation((path: string) => {
      if (path === '/api/users') return Promise.resolve(mockUsers)
      if (path === '/api/peladas/1') return Promise.resolve(mockPelada)
      if (path === '/api/organizations/101/players') return Promise.resolve(mockOrgPlayers)
      if (path === '/api/peladas/1/voters/10/voting-info') return Promise.resolve(mockVotingInfo)
      return Promise.reject(new Error(`Not found: ${path}`))
    })

    render(
      <MemoryRouter initialEntries={['/peladas/1/voting']}>
        <Routes>
          <Route path="/peladas/:id/voting" element={<PeladaVotingPage />} />
        </Routes>
      </MemoryRouter>
    )

    await waitFor(() => {
      // t('peladas.voting.title', { id: 1 }) -> 'peladas.voting.title' with simple mock
      expect(screen.getAllByText('peladas.voting.title').length).toBeGreaterThan(0)
      expect(screen.getByText('Target Player')).toBeInTheDocument()
    })
  })
})
