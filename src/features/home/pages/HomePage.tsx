import { useEffect, useState, useCallback } from "react";
import {
  Typography,
  Container,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
  Alert,
  Link,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import GroupsIcon from "@mui/icons-material/Groups";
import AddIcon from "@mui/icons-material/Add";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import { createApi } from "../../../shared/api/endpoints";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../shared/components/Loading";
import CreateOrganizationForm from "../../organizations/components/CreateOrganizationForm";

const endpoints = createApi(api);

type OrganizationWithRole = {
  id: number;
  name: string;
  role: "admin" | "player";
};

export default function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [adminOrgs, setAdminOrgs] = useState<OrganizationWithRole[]>([]);
  const [memberOrgs, setMemberOrgs] = useState<OrganizationWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const fetchOrganizations = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);

      const userOrgs = await endpoints.listUserOrganizations(user.id);

      if (!Array.isArray(userOrgs)) {
        throw new Error(t("home.error.invalid_format_org_list"));
      }

      const adminOrgsList = userOrgs.filter((org) => org.role === "admin");
      const memberOrgsList = userOrgs.filter((org) => org.role === "player");

      setAdminOrgs(adminOrgsList);
      setMemberOrgs(memberOrgsList);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("home.error.load_failed");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [user, t]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h3" gutterBottom>
          {t("app.title")}
        </Typography>
        <Typography variant="body1">{t("home.welcome.guest")}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography variant="h3">
          {t("home.welcome.user", { name: user.name })}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          {t("home.actions.create_organization")}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Loading message={t("common.loading")} />
      ) : (
        <>
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <AdminPanelSettingsIcon sx={{ mr: 1 }} color="primary" />
              <Typography variant="h5">
                {t("home.sections.admin_orgs.title")}
              </Typography>
            </Box>

            {adminOrgs.length === 0 ? (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("home.sections.admin_orgs.empty")}
                </Typography>
              </Paper>
            ) : (
              <Paper elevation={1}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("home.table.headers.org_name")}</TableCell>
                      <TableCell>{t("home.table.headers.role")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {adminOrgs.map((org) => (
                      <TableRow key={`admin-${org.id}`}>
                        <TableCell>
                          <Link
                            href={`/organizations/${org.id}`}
                            underline="hover"
                          >
                            {org.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <AdminPanelSettingsIcon
                              fontSize="small"
                              sx={{ mr: 0.5 }}
                              color="primary"
                            />
                            {t("common.roles.admin")}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>

          <Box>
            <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
              <GroupsIcon sx={{ mr: 1 }} color="action" />
              <Typography variant="h5">
                {t("home.sections.member_orgs.title")}
              </Typography>
            </Box>

            {memberOrgs.length === 0 ? (
              <Paper elevation={1} sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {t("home.sections.member_orgs.empty")}
                </Typography>
              </Paper>
            ) : (
              <Paper elevation={1}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("home.table.headers.org_name")}</TableCell>
                      <TableCell>{t("home.table.headers.role")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {memberOrgs.map((org) => (
                      <TableRow key={`member-${org.id}`}>
                        <TableCell>
                          <Link
                            href={`/organizations/${org.id}`}
                            underline="hover"
                          >
                            {org.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <GroupsIcon fontSize="small" sx={{ mr: 0.5 }} />
                            {t("common.roles.player")}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}
          </Box>
        </>
      )}

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      >
        <DialogTitle>{t("home.actions.create_organization")}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <CreateOrganizationForm
              onCreate={async (name) => {
                await endpoints.createOrganization(name);
                setCreateDialogOpen(false);
                fetchOrganizations();
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
