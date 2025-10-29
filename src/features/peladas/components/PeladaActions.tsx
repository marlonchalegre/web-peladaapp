import { useState } from 'react'
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack } from '@mui/material'

type PeladaActionsProps = {
  peladaId: number
  changingStatus: boolean
  onBegin: (matchesPerTeam?: number) => Promise<void>
  canBegin?: boolean
}

export default function PeladaActions({ peladaId, changingStatus, onBegin, canBegin = true }: PeladaActionsProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('2')
  const n = parseInt(value, 10)

  if (!canBegin) return null

  return (
    <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
      <Button
        variant="contained"
        disabled={changingStatus || !peladaId}
        onClick={() => setOpen(true)}
      >
        Iniciar
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Iniciar pelada</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Partidas por time"
            type="number"
            fullWidth
            variant="outlined"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputProps={{ min: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            disabled={!Number.isFinite(n) || n <= 0}
            onClick={async () => { await onBegin(n); setOpen(false) }}
          >
            Iniciar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
