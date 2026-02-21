import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  Box,
  Avatar,
  Link,
} from "@mui/material";
import GroupsIcon from "@mui/icons-material/Groups";
import InfoIcon from "@mui/icons-material/Info";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type OrganizationWithRole } from "../hooks/useHomeDashboard";

interface MemberOrganizationsListProps {
  organizations: OrganizationWithRole[];
}

export default function MemberOrganizationsList({
  organizations,
}: MemberOrganizationsListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <GroupsIcon sx={{ mr: 1.5, color: "text.secondary" }} />
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "text.primary" }}
        >
          {t(
            "home.sections.member_orgs.title",
            "Organizações que faço parte (Jogador)",
          )}
        </Typography>
      </Box>

      {organizations.length === 0 ? (
        <Box
          sx={{
            border: "2px dashed",
            borderColor: "divider",
            borderRadius: 3,
            py: 8,
            px: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.paper",
            textAlign: "center",
          }}
        >
          <Avatar
            sx={{
              bgcolor: "grey.100",
              color: "grey.400",
              width: 48,
              height: 48,
              mb: 2,
            }}
          >
            <InfoIcon />
          </Avatar>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ maxWidth: 400 }}
          >
            {t(
              "home.sections.member_orgs.empty_desc",
              "No momento, você não faz parte de nenhuma organização como jogador.",
            )}
          </Typography>
        </Box>
      ) : (
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
              </TableRow>
            </TableHead>
            <TableBody>
              {organizations.map((org) => (
                <TableRow
                  key={`member-${org.id}`}
                  hover
                  onClick={(e) => {
                    // Prevenir a navegação se o clique for em um elemento interativo
                    if ((e.target as HTMLElement).closest("button, a")) {
                      return;
                    }
                    navigate(`/organizations/${org.id}`);
                  }}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Avatar
                        variant="rounded"
                        sx={{
                          bgcolor: "grey.100",
                          color: "text.secondary",
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
                      >
                        {org.name}
                      </Link>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Typography variant="body2" color="text.secondary">
                        {t("common.roles.player", "Jogador")}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
