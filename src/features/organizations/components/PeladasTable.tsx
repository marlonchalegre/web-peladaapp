import { Paper, Table, TableHead, TableRow, TableCell, TableBody, IconButton, Link } from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import type { Pelada } from '../../../shared/api/endpoints'

export type PeladasTableProps = {
  peladas: Pelada[]
  onDelete: (peladaId: number) => Promise<void>
}

export default function PeladasTable({ peladas, onDelete }: PeladasTableProps) {
  if (!peladas.length) return <p>Nenhuma pelada.</p>
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
            {peladas.map((p) => (
              <TableRow key={`pelada-${p.id}`}>
                <TableCell>
                  <Link href={`/peladas/${p.id}`} underline="hover">Pelada #{p.id}</Link>
                </TableCell>
                <TableCell>
                  <IconButton aria-label={`Excluir Pelada #${p.id}`} onClick={() => onDelete(p.id)} size="small" color="error">
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
