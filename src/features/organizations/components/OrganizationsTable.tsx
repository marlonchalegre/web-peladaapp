import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Link,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTranslation } from "react-i18next";

export type Org = { id: number; name: string };

type Props = {
  orgs: Org[];
  onAddPlayers: (org: Org) => Promise<void>;
  onManageAdmins?: (org: Org) => Promise<void>;
  onDelete: (org: Org) => Promise<void>;
};

export default function OrganizationsTable({
  orgs,
  onAddPlayers,
  onManageAdmins,
  onDelete,
}: Props) {
  const { t } = useTranslation();

  if (orgs.length === 0) return <p>{t("organizations.list.empty")}</p>;
  return (
    <Paper elevation={1}>
      <div className="table-responsive">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("common.fields.name")}</TableCell>
              <TableCell>{t("common.actions")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orgs.map((o) => (
              <TableRow key={`org-${o.id}`}>
                <TableCell>
                  <Link href={`/organizations/${o.id}`} underline="hover">
                    {o.name}
                  </Link>
                </TableCell>
                <TableCell>
                  <IconButton
                    aria-label={t("organizations.table.aria.add_players", {
                      name: o.name,
                    })}
                    onClick={() => onAddPlayers(o)}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    <PersonAddIcon fontSize="small" />
                  </IconButton>
                  {onManageAdmins && (
                    <IconButton
                      aria-label={t("organizations.table.aria.manage_admins", {
                        name: o.name,
                      })}
                      onClick={() => onManageAdmins(o)}
                      size="small"
                      sx={{ mr: 1 }}
                      color="primary"
                    >
                      <AdminPanelSettingsIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    aria-label={t("organizations.table.aria.delete", {
                      name: o.name,
                    })}
                    onClick={() => onDelete(o)}
                    size="small"
                    color="error"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Paper>
  );
}
