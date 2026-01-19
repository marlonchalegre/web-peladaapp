import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import HomePage from './HomePage'
import { MemoryRouter } from 'react-router-dom'
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
    user: { id: 1, name: 'Test User', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}))

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lists organizations where user is admin or player', async () => {
    // Mock user is admin of Org A
    const mockAdminOrgs = [
      { id: 1, organization_id: 101, user_id: 1 }
    ]
    // Mock all organizations
    const mockAllOrgs = [
      { id: 101, name: 'Org Admin' },
      { id: 102, name: 'Org Player' },
      { id: 103, name: 'Org None' }
    ]
    // Mock players for Org 102 (user is in it)
    const mockPlayers102 = [{ id: 1, user_id: 1, organization_id: 102 }]
    // Mock players for Org 103 (user NOT in it)
    const mockPlayers103 = [{ id: 2, user_id: 2, organization_id: 103 }]

    ;(api.get as Mock).mockImplementation((path: string) => {
      if (path.includes('/admin-organizations')) return Promise.resolve(mockAdminOrgs)
      if (path === '/api/organizations') return Promise.resolve(mockAllOrgs)
      if (path === '/api/organizations/102/players') return Promise.resolve(mockPlayers102)
      if (path === '/api/organizations/103/players') return Promise.resolve(mockPlayers103)
      return Promise.resolve([])
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('Org Admin')).toBeInTheDocument()
      expect(screen.getByText('Org Player')).toBeInTheDocument()
    })

    expect(screen.queryByText('Org None')).not.toBeInTheDocument()
    
    // Check role labels
    expect(screen.getByText('common.roles.admin')).toBeInTheDocument()
    expect(screen.getByText('common.roles.player')).toBeInTheDocument()
  })

  it('renders empty state messages when user has no organizations', async () => {
    ;(api.get as Mock).mockImplementation((path: string) => {
      if (path.includes('/admin-organizations')) return Promise.resolve([])
      if (path === '/api/organizations') return Promise.resolve([])
      return Promise.resolve([])
    })

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('home.sections.admin_orgs.empty')).toBeInTheDocument()
      expect(screen.getByText('home.sections.member_orgs.empty')).toBeInTheDocument()
    })
  })
})
