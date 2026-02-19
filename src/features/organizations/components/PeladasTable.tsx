import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Link as MuiLink,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import DeleteIcon from "@mui/icons-material/Delete";
import type { Pelada } from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";

export type PeladasTableProps = {
  peladas: Pelada[];
  onDelete?: (peladaId: number) => Promise<void>;
};

export default function PeladasTable({ peladas, onDelete }: PeladasTableProps) {
  const { t } = useTranslation();

  if (!peladas.length) return <p>{t("organizations.peladas.empty")}</p>;
  return (
    <div className="table-responsive">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("common.fields.name")}</TableCell>
            {onDelete && (
              <TableCell align="right">{t("common.actions")}</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {peladas.map((p) => (
            <TableRow key={`pelada-${p.id}`} hover>
              <TableCell>
                <MuiLink
                  component={RouterLink}
                  to={`/peladas/${p.id}`}
                  underline="hover"
                  color="inherit"
                  data-testid={`pelada-link-${p.id}`}
                >
                  {t("organizations.peladas.item_name", { id: p.id })}
                </MuiLink>
              </TableCell>
              {onDelete && (
                <TableCell align="right">
                  <IconButton
                    aria-label={t("organizations.peladas.aria.delete", {
                      id: p.id,
                    })}
                    onClick={() => onDelete(p.id)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
