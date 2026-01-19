import { useState } from 'react'
import type { FormEvent } from 'react'
import { Box, Paper, TextField, Button, Stack, Typography, Alert, Link as MLink } from '@mui/material'
import { login } from '../../../shared/api/client'
import { useAuth } from '../../../app/providers/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()
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
      const message = error instanceof Error ? error.message : t('auth.login.error.failed')
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
              {t('auth.login.title')}
            </Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField 
              label={t('common.fields.email')}
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              fullWidth 
            />
            <TextField 
              label={t('common.fields.password')}
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
              {loading ? t('auth.login.button.loading') : t('auth.login.button.submit')}
            </Button>
            <Typography variant="body2" textAlign="center">
              {t('auth.login.link.new_user')} <MLink href="/register" underline="hover">{t('auth.login.link.register')}</MLink>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  )
}
