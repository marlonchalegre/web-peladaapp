import { Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Link } from '@mui/material'
import PersonAddIcon from '@mui/icons-material/PersonAdd'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings'
import DeleteIcon from '@mui/icons-material/Delete'

export type Org = { id: number; name: string }

type Props = {
  orgs: Org[]
  onAddPlayers: (org: Org) => Promise<void>
  onManageAdmins?: (org: Org) => Promise<void>
  onDelete: (org: Org) => Promise<void>
}

export default function OrganizationsTable({ orgs, onAddPlayers, onManageAdmins, onDelete }: Props) {
  if (orgs.length === 0) return <p>Nenhuma organização encontrada.</p>
  return (
    <Paper elevation={1}>
      <div className="table-responsive">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orgs.map((o) => (
              <TableRow key={`org-${o.id}`}>
                <TableCell>
                  <Link href={`/organizations/${o.id}`} underline="hover">{o.name}</Link>
                </TableCell>
                <TableCell>
                  <IconButton aria-label={`Adicionar jogadores à organização ${o.name}`} onClick={() => onAddPlayers(o)} size="small" sx={{ mr: 1 }}>
                    <PersonAddIcon fontSize="small" />
                  </IconButton>
                  {onManageAdmins && (
                    <IconButton aria-label={`Gerenciar administradores da organização ${o.name}`} onClick={() => onManageAdmins(o)} size="small" sx={{ mr: 1 }} color="primary">
                      <AdminPanelSettingsIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton aria-label={`Excluir organização ${o.name}`} onClick={() => onDelete(o)} size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Paper>
  )
}
