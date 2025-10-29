import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, Checkbox, Stack } from '@mui/material'
import type { User } from '../../../shared/api/endpoints'

type Props = {
  open: boolean
  users: User[]
  selectedIds: Set<number>
  onSelectAll: () => void
  onClear: () => void
  onToggle: (userId: number, checked: boolean) => void
  onAddSelected: () => Promise<void>
  onAddAll: () => Promise<void>
  onClose: () => void
}

export default function AddPlayersDialog({ open, users, selectedIds, onSelectAll, onClear, onToggle, onAddSelected, onAddAll, onClose }: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Adicionar jogadores</DialogTitle>
      <DialogContent dividers>
        {users.length === 0 ? (
          <ListItemText primary="Nenhum usuário disponível." />
        ) : (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" onClick={onSelectAll}>Selecionar todos</Button>
              <Button variant="text" size="small" onClick={onClear}>Limpar seleção</Button>
            </Stack>
            <List sx={{ maxHeight: 320, overflow: 'auto' }}>
              {users.map((u) => (
                <ListItem key={`user-${u.id}`} secondaryAction={
                  <Checkbox edge="end" checked={selectedIds.has(u.id)} onChange={(e) => onToggle(u.id, e.target.checked)} />
                }>
                  <ListItemText primary={u.name} secondary={u.email} />
                </ListItem>
              ))}
            </List>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={onAddSelected} variant="contained">Adicionar selecionados</Button>
        <Button onClick={onAddAll} variant="outlined">Adicionar todos</Button>
      </DialogActions>
    </Dialog>
  )
}
