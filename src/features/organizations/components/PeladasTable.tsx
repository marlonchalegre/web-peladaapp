import { Table, TableHead, TableRow, TableCell, TableBody, IconButton, Link as MuiLink } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import DeleteIcon from '@mui/icons-material/Delete'
import type { Pelada } from '../../../shared/api/endpoints'

export type PeladasTableProps = {
  peladas: Pelada[]
  onDelete?: (peladaId: number) => Promise<void>
}

export default function PeladasTable({ peladas, onDelete }: PeladasTableProps) {
  if (!peladas.length) return <p>Nenhuma pelada.</p>
  return (
    <div className="table-responsive">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            {onDelete && <TableCell align="right">Ações</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {peladas.map((p) => (
            <TableRow key={`pelada-${p.id}`} hover>
              <TableCell>
                <MuiLink component={RouterLink} to={`/peladas/${p.id}`} underline="hover" color="inherit">Pelada #{p.id}</MuiLink>
              </TableCell>
              {onDelete && (
                <TableCell align="right">
                  <IconButton aria-label={`Excluir Pelada #${p.id}`} onClick={() => onDelete(p.id)} size="small" color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
