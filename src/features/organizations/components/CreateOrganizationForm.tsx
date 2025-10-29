import React, { FormEvent } from 'react'
import { Stack, TextField, Button } from '@mui/material'

type Props = {
  onCreate: (name: string) => Promise<void>
}

export default function CreateOrganizationForm({ onCreate }: Props) {
  return (
    <form onSubmit={async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const form = e.currentTarget
      const data = new FormData(form)
      const name = String(data.get('name') || '')
      if (!name) return
      await onCreate(name)
      form.reset()
    }}>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
        <TextField name="name" label="Nome" required size="small" />
        <Button type="submit" variant="contained">Criar</Button>
      </Stack>
    </form>
  )
}
