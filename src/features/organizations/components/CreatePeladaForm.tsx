import { useMemo } from 'react'
import type { FormEvent } from 'react'
import { Stack, TextField, Button } from '@mui/material'

export type CreatePeladaPayload = {
  organization_id: number
  when: string
  num_teams: number
  players_per_team: number
}

type Props = {
  organizationId: number
  onCreate: (payload: CreatePeladaPayload) => Promise<void>
}

export default function CreatePeladaForm({ organizationId, onCreate }: Props) {
  const { defaultDate, defaultTime } = useMemo(() => {
    const now = new Date()
    const pad2 = (n: number) => String(n).padStart(2, '0')
    return {
      defaultDate: `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`,
      defaultTime: `${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
    }
  }, [])

  return (
    <form onSubmit={async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const formEl = e.currentTarget
      const data = new FormData(formEl)
      const date = String(data.get('date') || '')
      const time = String(data.get('time') || '')
      const when = date && time ? `${date}T${time}` : ''
      const numTeams = Number(data.get('num_teams') || 2)
      const playersPerTeam = Number(data.get('players_per_team') || 5)
      if (!when) return
      if (numTeams < 2 || playersPerTeam < 1) return
      await onCreate({ organization_id: organizationId, when, num_teams: numTeams, players_per_team: playersPerTeam })
      formEl?.reset()
    }}>
      <Stack spacing={2} sx={{ mb: 2, maxWidth: 480 }}>
        <TextField name="date" type="date" label="Data" InputLabelProps={{ shrink: true }} required defaultValue={defaultDate} />
        <TextField name="time" type="time" label="Hora" InputLabelProps={{ shrink: true }} required defaultValue={defaultTime} />
        <TextField name="num_teams" type="number" label="Quantidade de times" inputProps={{ min: 2 }} defaultValue={2} />
        <TextField name="players_per_team" type="number" label="Jogadores por time" inputProps={{ min: 1 }} defaultValue={5} />
        <Button type="submit" variant="contained">Criar pelada</Button>
      </Stack>
    </form>
  )
}
