import { useState, useEffect, type FormEvent } from 'react'
import { Paper, TextField, Button, Stack, Typography, Alert, Box, Divider } from '@mui/material'
import { updateUserProfile, getUser } from '../../../shared/api/client'
import { useAuth } from '../../../app/providers/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function UserProfilePage() {
  const navigate = useNavigate()
  const { user: authUser, signIn, token } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    if (!authUser) {
      navigate('/login')
      return
    }

    // Load current user data
    const loadUserProfile = async () => {
      try {
        const userData = await getUser(authUser.id)
        setName(userData.name)
        setEmail(userData.email)
      } catch (error) {
        console.error('Failed to load user profile:', error)
        setError('Falha ao carregar perfil do usuário')
      } finally {
        setLoadingProfile(false)
      }
    }

    loadUserProfile()
  }, [authUser, navigate])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // SECURITY: This function always uses authUser.id (the authenticated user's ID)
    // The backend validates that users can only update their own profile

    // Validation
    if (password && password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }

    if (!email.trim()) {
      setError('Email é obrigatório')
      return
    }

    setLoading(true)
    try {
      if (!authUser) throw new Error('User not authenticated')

      // Prepare update data - only include fields that should be updated
      const updates: { name?: string; email?: string; password?: string } = {}
      
      if (name !== authUser.name) updates.name = name
      if (email !== authUser.email) updates.email = email
      if (password) updates.password = password

      if (Object.keys(updates).length === 0) {
        setError('Nenhuma alteração detectada')
        setLoading(false)
        return
      }

      const updatedUser = await updateUserProfile(authUser.id, updates)
      
      // Update auth context with new user data
      if (token) {
        signIn(token, updatedUser)
      }

      setSuccess('Perfil atualizado com sucesso!')
      setPassword('')
      setConfirmPassword('')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Falha ao atualizar perfil'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  if (loadingProfile) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Carregando...</Typography>
      </Box>
    )
  }

  return (
    <Box maxWidth={600} mx="auto">
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Configurações do Perfil</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Atualize suas informações pessoais. O score do usuário não pode ser modificado.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <form onSubmit={onSubmit}>
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}
            
            <TextField 
              label="Nome" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              fullWidth 
              disabled={loading}
            />
            
            <TextField 
              label="Email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              fullWidth 
              disabled={loading}
            />

            <Divider sx={{ my: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Alterar senha (deixe em branco para manter a atual)
              </Typography>
            </Divider>
            
            <TextField 
              label="Nova Senha" 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              fullWidth 
              disabled={loading}
              helperText="Deixe em branco se não quiser alterar a senha"
            />
            
            <TextField 
              label="Confirmar Nova Senha" 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              fullWidth 
              disabled={loading || !password}
            />

            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button 
                variant="outlined" 
                onClick={() => navigate('/')} 
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                disabled={loading}
              >
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </Box>
          </Stack>
        </form>
      </Paper>
    </Box>
  )
}
