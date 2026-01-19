import { Dialog, DialogTitle, DialogContent, DialogActions, Button, List, ListItem, ListItemText, Checkbox, Stack } from '@mui/material'
import type { User } from '../../../shared/api/endpoints'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('organizations.dialog.add_players.title')}</DialogTitle>
      <DialogContent dividers>
        {users.length === 0 ? (
          <ListItemText primary={t('organizations.dialog.add_players.empty_users')} />
        ) : (
          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" onClick={onSelectAll}>{t('organizations.dialog.add_players.select_all')}</Button>
              <Button variant="text" size="small" onClick={onClear}>{t('organizations.dialog.add_players.clear_selection')}</Button>
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
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={onAddSelected} variant="contained">{t('organizations.dialog.add_players.add_selected')}</Button>
        <Button onClick={onAddAll} variant="outlined">{t('organizations.dialog.add_players.add_all')}</Button>
      </DialogActions>
    </Dialog>
  )
}
