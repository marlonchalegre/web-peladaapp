import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material'
import './App.css'
import { AuthProvider } from './app/providers/AuthProvider'
import { useAuth } from './app/providers/AuthContext'
import ProtectedRoute from './app/routing/ProtectedRoute'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import HomePage from './features/home/pages/HomePage'
import OrganizationsPage from './features/organizations/pages/OrganizationsPage'
import OrganizationDetailPage from './features/organizations/pages/OrganizationDetailPage'
import OrganizationStatisticsPage from './features/organizations/pages/OrganizationStatisticsPage'
import PeladaDetailPage from './features/peladas/pages/PeladaDetailPage'
import AttendanceListPage from './features/peladas/pages/AttendanceListPage'
import PeladaMatchesPage from './features/peladas/pages/PeladaMatchesPage'
import PeladaVotingPage from './features/peladas/pages/PeladaVotingPage'
import UserProfilePage from './features/user/pages/UserProfilePage'
import UsersPage from './features/user/pages/UsersPage'

function AppLayout() {
  const { isAuthenticated, signOut } = useAuth()

  return (
    <BrowserRouter>
      {isAuthenticated && (
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Pelada App</Typography>
            <Button color="inherit" component={RouterLink} to="/">Home</Button>
            <Button color="inherit" component={RouterLink} to="/organizations">Organizações</Button>
            <Button color="inherit" component={RouterLink} to="/users">Users</Button>
            <Button color="inherit" component={RouterLink} to="/profile">Perfil</Button>
            <Button color="inherit" onClick={() => signOut()}>Sair</Button>
          </Toolbar>
        </AppBar>
      )}
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
