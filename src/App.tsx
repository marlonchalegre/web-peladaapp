import { BrowserRouter, Routes, Route, Link as RouterLink } from 'react-router-dom'
import { AppBar, Toolbar, Typography, Button, Container } from '@mui/material'
import './App.css'
import { AuthProvider } from './app/providers/AuthProvider'
import { useAuth } from './app/providers/AuthContext'
import ProtectedRoute from './app/routing/ProtectedRoute'
import LoginPage from './features/auth/pages/LoginPage'
import RegisterPage from './features/auth/pages/RegisterPage'
import OrganizationsPage from './features/organizations/pages/OrganizationsPage'
import OrganizationDetailPage from './features/organizations/pages/OrganizationDetailPage'
import PeladaDetailPage from './features/peladas/pages/PeladaDetailPage'
import PeladaMatchesPage from './features/peladas/pages/PeladaMatchesPage'

function Home() {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h3" gutterBottom>Pelada App</Typography>
      <Typography variant="body1">Bem-vindo!</Typography>
    </Container>
  )
}

function AppLayout() {
  const { signOut } = useAuth()
  return (
    <BrowserRouter>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Pelada App</Typography>
          <Button color="inherit" component={RouterLink} to="/">Home</Button>
          <Button color="inherit" component={RouterLink} to="/organizations">Organizações</Button>
          <Button color="inherit" onClick={() => signOut()}>Sair</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/organizations" element={<OrganizationsPage />} />
            <Route path="/organizations/:id" element={<OrganizationDetailPage />} />
            <Route path="/peladas/:id" element={<PeladaDetailPage />} />
            <Route path="/peladas/:id/matches" element={<PeladaMatchesPage />} />
          </Route>
        </Routes>
      </Container>
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
