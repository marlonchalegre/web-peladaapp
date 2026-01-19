import { useEffect, useState } from 'react'
import { Typography, Alert, Container, Pagination } from '@mui/material'
import { api } from '../../../shared/api/client'
import { createApi, type User, type OrganizationAdmin } from '../../../shared/api/endpoints'
import CreateOrganizationForm from '../components/CreateOrganizationForm'
import OrganizationsTable from '../components/OrganizationsTable'
import AddPlayersDialog from '../components/AddPlayersDialog'
import ManageAdminsDialog from '../components/ManageAdminsDialog'
import { useTranslation } from 'react-i18next'
import { Loading } from '../../../shared/components/Loading'

type Organization = {
  id: number
  name: string
}

const endpoints = createApi(api)

export default function OrganizationsPage() {
  const { t } = useTranslation()
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [addingPlayersOrgId, setAddingPlayersOrgId] = useState<number | null>(null)
  const [managingAdminsOrg, setManagingAdminsOrg] = useState<Organization | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(new Set())
  const [admins, setAdmins] = useState<OrganizationAdmin[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage] = useState(10)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    api.getPaginated<Organization[]>('/api/organizations', { page, per_page: perPage })
      .then((data) => {
        setOrgs(data.data)
        setTotal(data.total)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : t('organizations.list.error.load_failed')
        setError(message)
      })
      .finally(() => setLoading(false))
  }, [page, perPage, t])

  if (loading) return <Loading message={t('organizations.list.loading')} />
  if (error) return <Container><Alert severity="error">{error}</Alert></Container>

  return (
    <Container>
      <Typography variant="h4" gutterBottom>{t('organizations.list.title')}</Typography>
      <CreateOrganizationForm onCreate={async (name) => {
        const created = await endpoints.createOrganization(name)
        setOrgs((prev) => {
          const withoutDup = prev.filter((o) => o.id !== created.id)
          return [...withoutDup, created]
        })
      }} />
      <OrganizationsTable
        orgs={orgs}
        onAddPlayers={async (o) => {
          try {
            const [users, players] = await Promise.all([
              endpoints.listUsers(),
              endpoints.listPlayersByOrg(o.id),
            ])
            const existing = new Set(players.map((p) => p.user_id))
            const available = users.filter((u) => !existing.has(u.id))
            setAllUsers(available)
            setSelectedUserIds(new Set())
            setAddingPlayersOrgId(o.id)
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('organizations.error.load_users_failed')
            setError(message)
          }
        }}
        onManageAdmins={async (o) => {
          try {
            setLoadingAdmins(true)
            const [users, orgAdmins] = await Promise.all([
              endpoints.listUsers(),
              endpoints.listAdminsByOrganization(o.id),
            ])
            setAllUsers(users)
            setAdmins(orgAdmins)
            setManagingAdminsOrg(o)
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('organizations.error.load_admins_failed')
            setError(message)
          } finally {
            setLoadingAdmins(false)
          }
        }}
        onDelete={async (o) => {
          try {
            await endpoints.deleteOrganization(o.id)
            setOrgs((prev) => prev.filter((x) => x.id !== o.id))
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : t('organizations.error.delete_failed')
            setError(message)
          }
        }}
      />

      <Pagination
        count={Math.ceil(total / perPage)}
        page={page}
        onChange={(_, value) => setPage(value)}
        sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
      />

      <AddPlayersDialog
        open={addingPlayersOrgId != null}
        users={allUsers}
        selectedIds={selectedUserIds}
        onSelectAll={() => setSelectedUserIds(new Set(allUsers.map((u) => u.id)))}
        onClear={() => setSelectedUserIds(new Set())}
        onToggle={(id, checked) => setSelectedUserIds((prev) => {
          const next = new Set(prev)
          if (checked) next.add(id); else next.delete(id)
          return next
        })}
        onAddSelected={async () => {
          if (addingPlayersOrgId == null) return
          const ids = Array.from(selectedUserIds)
          await Promise.all(ids.map((uid) => endpoints.createPlayer({ organization_id: addingPlayersOrgId, user_id: uid })))
          setAddingPlayersOrgId(null)
        }}
        onAddAll={async () => {
          if (addingPlayersOrgId == null) return
          await Promise.all(allUsers.map((u) => endpoints.createPlayer({ organization_id: addingPlayersOrgId, user_id: u.id })))
          setAddingPlayersOrgId(null)
        }}
        onClose={() => setAddingPlayersOrgId(null)}
      />

      {managingAdminsOrg && (
        <ManageAdminsDialog
          open={!loadingAdmins}
          organizationId={managingAdminsOrg.id}
          organizationName={managingAdminsOrg.name}
          admins={admins}
          availableUsers={allUsers}
          onClose={() => {
            setManagingAdminsOrg(null)
            setAdmins([])
          }}
          onAddAdmin={async (userId: number) => {
            const newAdmin = await endpoints.addOrganizationAdmin(managingAdminsOrg.id, userId)
            setAdmins((prev) => [...prev, newAdmin])
          }}
          onRemoveAdmin={async (userId: number) => {
            await endpoints.removeOrganizationAdmin(managingAdminsOrg.id, userId)
            setAdmins((prev) => prev.filter((a) => a.user_id !== userId))
          }}
        />
      )}
    </Container>
  )
}
