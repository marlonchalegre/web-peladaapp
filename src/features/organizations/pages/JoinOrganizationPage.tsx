import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../app/providers/AuthContext";
import { api } from "../../../shared/api/client";
import {
  createApi,
  type OrganizationInvitation,
} from "../../../shared/api/endpoints";

const endpoints = createApi(api);

export default function JoinOrganizationPage() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [invitation, setInvitation] = useState<OrganizationInvitation | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchInfo = async () => {
      try {
        const info = await endpoints.getInvitationInfo(token);
        setInvitation(info);
      } catch {
        setError(t("organizations.invitation.error.invalid_token"));
      } finally {
        setLoading(false);
      }
    };

    fetchInfo();
  }, [token, t]);

  const handleJoin = async () => {
    if (!token) return;

    if (!isAuthenticated) {
      navigate(`/login?redirect=/join/${token}`);
      return;
    }

    setJoining(true);
    try {
      const result = await endpoints.acceptInvitation(token);
      navigate(`/organizations/${result.organization_id}`);
    } catch {
      setError(t("organizations.invitation.error.join_failed"));
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !invitation) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Alert severity="error">
          {error || t("organizations.invitation.error.invalid_token")}
        </Alert>
        <Button onClick={() => navigate("/")} sx={{ mt: 2 }}>
          {t("common.back_to_home")}
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4, textAlign: "center" }}>
        <Typography variant="h4" gutterBottom>
          {t("organizations.invitation.join_title")}
        </Typography>
        <Typography
          variant="h5"
          color="primary"
          gutterBottom
          sx={{ fontWeight: "bold", my: 3 }}
        >
          {invitation.organization_name}
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {t("organizations.invitation.join_description", {
            name: invitation.organization_name,
          })}
        </Typography>

        <Stack spacing={2} sx={{ mt: 4 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleJoin}
            disabled={joining}
            fullWidth
          >
            {joining
              ? t("common.loading")
              : t("organizations.invitation.button.join")}
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate("/")}
            disabled={joining}
            fullWidth
          >
            {t("common.cancel")}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
}
