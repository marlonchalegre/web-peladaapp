import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Container, Typography, Alert } from '@mui/material'
import { api } from '../../../shared/api/client'
import { createApi, type Pelada, type Organization } from '../../../shared/api/endpoints'
import CreatePeladaForm from '../components/CreatePeladaForm'
import PeladasTable from '../components/PeladasTable'

const endpoints = createApi(api)

export default function OrganizationDetailPage() {
  const { id } = useParams()
  const orgId = Number(id)
  const [org, setOrg] = useState<Organization | null>(null)
  const [peladas, setPeladas] = useState<Pelada[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!orgId) return
    Promise.all([
      endpoints.getOrganization(orgId),
      endpoints.listPeladasByOrg(orgId),
    ])
      .then(([o, ps]) => {
        setOrg(o)
        const seen = new Set<number>()
        const unique = ps.filter((p) => {
          if (p?.id == null) return false
          if (seen.has(p.id)) return false
          seen.add(p.id)
          return true
        })
        setPeladas(unique)
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Erro ao carregar organização'
        setError(message)
      })
  }, [orgId])

  if (error) return <Container><Alert severity="error">{error}</Alert></Container>
  if (!org) return <Container><Typography>Carregando...</Typography></Container>

  return (
    <Container>
      <Typography variant="h4" gutterBottom>{org.name}</Typography>
      <Typography variant="h6" gutterBottom>Peladas</Typography>
      <CreatePeladaForm
        organizationId={orgId}
        onCreate={async (payload) => {
          try {
            await endpoints.createPelada(payload)
            const list = await endpoints.listPeladasByOrg(orgId)
            const seen = new Set<number>()
            const unique = list.filter((p) => {
              if (p?.id == null) return false
              if (seen.has(p.id)) return false
              seen.add(p.id)
              return true
            })
            setPeladas(unique)
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao criar pelada'
            setError(message)
          }
        }}
      />
      <PeladasTable
        peladas={peladas}
        onDelete={async (id) => {
          try {
            await endpoints.deletePelada(id)
            setPeladas((prev) => prev.filter((x) => x.id !== id))
          } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erro ao excluir pelada'
            setError(message)
          }
        }}
      />
    </Container>
  )
}
