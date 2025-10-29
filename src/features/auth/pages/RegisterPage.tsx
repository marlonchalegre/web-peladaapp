import { useState } from 'react'
import type { FormEvent } from 'react'
import { Box, Paper, TextField, Button, Stack, Typography, Alert, Link as MLink } from '@mui/material'
import { register, login } from '../../../shared/api/client'
import { useAuth } from '../../../app/providers/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { signIn } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register(name, email, password)
      const { token, user } = await login(email, password)
      signIn(token, user)
      navigate('/')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registro falhou'
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
              Criar conta
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField 
              label="Nome" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              fullWidth 
            />
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
              {loading ? 'Registrando...' : 'Registrar'}
            </Button>
            <Typography variant="body2" textAlign="center">
              Já tem conta? <MLink href="/login" underline="hover">Entrar</MLink>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  )
}
