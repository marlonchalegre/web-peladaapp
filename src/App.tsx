import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material'
import './App.css'
import { AuthProvider } from './app/providers/AuthProvider'
import { useAuth } from './app/providers/AuthContext'
import { LanguageSwitcher } from './shared/components/LanguageSwitcher'
import { useTranslation } from 'react-i18next'
import ProtectedRoute from './app/routing/ProtectedRoute'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import HomePage from './features/home/pages/HomePage'
import OrganizationsPage from './features/organizations/pages/OrganizationsPage'
import OrganizationDetailPage from './features/organizations/pages/OrganizationDetailPage'
import OrganizationStatisticsPage from './features/organizations/pages/OrganizationStatisticsPage'
import OrganizationManagementPage from './features/organizations/pages/OrganizationManagementPage'
import PeladaDetailPage from './features/peladas/pages/PeladaDetailPage'
import AttendanceListPage from './features/peladas/pages/AttendanceListPage'
import PeladaMatchesPage from './features/peladas/pages/PeladaMatchesPage'
import PeladaVotingPage from './features/peladas/pages/PeladaVotingPage'
import UserProfilePage from './features/user/pages/UserProfilePage'
import UsersPage from './features/user/pages/UsersPage'

function Footer() {
  const { t } = useTranslation()
  const version = import.meta.env.VITE_APP_VERSION || t('app.development')
  
  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 2, 
        px: 2, 
        mt: 'auto', 
        backgroundColor: (theme) => theme.palette.grey[200],
        textAlign: 'center'
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {t('app.version', { version })}
      </Typography>
    </Box>
  )
}

function AppLayout() {
  const { isAuthenticated, signOut } = useAuth()
  const { t } = useTranslation()

  return (
    <BrowserRouter>
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {isAuthenticated && (
          <AppBar position="static">
            <Toolbar>
              <Box 
                component={RouterLink} 
                to="/" 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  textDecoration: 'none', 
                  color: 'inherit',
                  flexGrow: 1 
                }}
              >
                <Box
                  component="img"
                  src="/logo.png"
                  alt="Pelada App Logo"
                  sx={{ height: 40, mr: 2, borderRadius: '50%' }}
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold'
                  }}
                >
                  {t('app.title')}
                </Typography>
              </Box>
              <LanguageSwitcher />
              <Button color="inherit" component={RouterLink} to="/profile">{t('navigation.profile')}</Button>
              <Button color="inherit" onClick={() => signOut()}>{t('auth.logout')}</Button>
            </Toolbar>
          </AppBar>
        )}
        <Box component="main" sx={{ flexGrow: 1 }}>
          <Routes>
            {/* Rotas públicas sem Container para permitir centralização própria */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Rotas protegidas com Container */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/organizations" element={
                <Container maxWidth="lg" sx={{ py: 3 }}>
                  <OrganizationsPage />
                </Container>
              } />
              <Route path="/organizations/:id" element={
                <Container maxWidth="lg" sx={{ py: 3 }}>
                  <OrganizationDetailPage />
                </Container>
              } />
              <Route path="/organizations/:id/statistics" element={
                <Container maxWidth="lg" sx={{ py: 3 }}>
                  <OrganizationStatisticsPage />
                </Container>
              } />
              <Route path="/organizations/:id/management" element={
                <Container maxWidth="lg" sx={{ py: 3 }}>
                  <OrganizationManagementPage />
                </Container>
              } />
              <Route path="/peladas/:id" element={
                <Container maxWidth="lg" sx={{ py: 3 }}>
                  <PeladaDetailPage />
                </Container>
              } />
              <Route path="/peladas/:id/attendance" element={
                <Container maxWidth="lg" sx={{ py: 3 }}>
                  <AttendanceListPage />
                </Container>
              } />
              <Route path="/peladas/:id/matches" element={
                <Container maxWidth="lg" sx={{ py: 3 }}>
                  <PeladaMatchesPage />
                </Container>
              } />
              <Route path="/peladas/:id/voting" element={
                <Container maxWidth="lg" sx={{ py: 3 }}>
                  <PeladaVotingPage />
                </Container>
              } />
              <Route path="/profile" element={
                <Container maxWidth="lg" sx={{ py: 3 }}>
                  <UserProfilePage />
                </Container>
              } />
              <Route path="/users" element={
                <Container maxWidth="lg" sx={{ py: 3 }}>
                  <UsersPage />
                </Container>
              } />
            </Route>
          </Routes>
        </Box>
        <Footer />
      </Box>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  )
}
