import { useState } from 'react'
import type { FormEvent } from 'react'
import { Box, Paper, TextField, Button, Stack, Typography, Alert, Link as MLink } from '@mui/material'
import { login } from '../../../shared/api/client'
import { useAuth } from '../../../app/providers/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { token, user } = await login(email, password)
      signIn(token, user)
      navigate('/')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 420, width: '100%', mx: 2 }} elevation={3}>
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Typography variant="h5" component="h1" textAlign="center" gutterBottom>
              Entrar
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField 
              label="Email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              fullWidth 
            />
            <TextField 
              label="Senha" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              fullWidth 
            />
            <Button 
              type="submit" 
              variant="contained" 
              disabled={loading}
              size="large"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
            <Typography variant="body2" textAlign="center">
              Novo aqui? <MLink href="/register" underline="hover">Criar conta</MLink>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  )
}
