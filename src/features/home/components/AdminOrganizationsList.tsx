import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
  Button,
  Avatar,
  Link,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import AddIcon from "@mui/icons-material/Add";
import GroupsIcon from "@mui/icons-material/Groups";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type OrganizationWithRole } from "../hooks/useHomeDashboard";

interface AdminOrganizationsListProps {
  organizations: OrganizationWithRole[];
  onCreate: () => void;
}

export default function AdminOrganizationsList({
  organizations,
  onCreate,
}: AdminOrganizationsListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 5 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <SecurityIcon sx={{ mr: 1.5, color: "secondary.main" }} />
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "text.primary" }}
          >
            {t(
              "home.sections.admin_orgs.title",
              "Minhas Organizações (Administrador)",
            )}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddIcon />}
          onClick={onCreate}
          data-testid="create-org-open-dialog"
          sx={{
            borderRadius: 2,
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {t("home.actions.create_organization", "Criar Organização")}
        </Button>
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead sx={{ bgcolor: "background.default" }}>
            <TableRow>
              <TableCell
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  py: 2,
                }}
              >
                {t("home.table.headers.org_name", "NOME DA ORGANIZAÇÃO")}
              </TableCell>
              <TableCell
                sx={{
                  color: "text.secondary",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                  py: 2,
                }}
              >
                {t("home.table.headers.role", "FUNÇÃO")}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {organizations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {t(
                      "home.sections.admin_orgs.empty",
                      "Nenhuma organização administrada.",
                    )}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              organizations.map((org) => (
                <TableRow
                  key={`admin-${org.id}`}
                  hover
                  onClick={(e) => {
                    // Prevenir a navegação se o clique for em um elemento interativo
                    if ((e.target as HTMLElement).closest("button, a")) {
                      return;
                    }
                    navigate(`/organizations/${org.id}`);
                  }}
                  sx={{
                    cursor: "pointer",
                    "& .MuiTableCell-root": {
                      position: "relative",
                    },
                    // Ensure the button is always on top and clickable
                    "& button, & a": {
                      position: "relative",
                      zIndex: 2,
                    },
                  }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          bgcolor: "secondary.light",
                          color: "secondary.main",
                          mr: 2,
                          width: 40,
                          height: 40,
                        }}
                      >
                        <GroupsIcon />
                      </Avatar>
                      <Link
                        component={RouterLink}
                        to={`/organizations/${org.id}`}
                        underline="hover"
                        variant="body2"
                        fontWeight={600}
                        color="text.primary"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`org-link-${org.name}`}
                      >
                        {org.name}
                      </Link>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <VerifiedUserIcon
                        sx={{
                          fontSize: 16,
                          mr: 0.5,
                          color: "text.secondary",
                        }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        {t("common.roles.admin", "Administrador")}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 2.5 }}>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{
                        bgcolor: "action.hover",
                        color: "text.primary",
                        boxShadow: "none",
                        textTransform: "none",
                        fontWeight: 600,
                        "&:hover": {
                          bgcolor: "action.selected",
                          boxShadow: "none",
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/organizations/${org.id}/management`);
                      }}
                      data-testid={`manage-org-${org.id}`}
                    >
                      {t("common.actions.manage", "Gerenciar")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}
