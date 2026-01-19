import { StrictMode, Suspense } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import theme from './lib/theme'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './lib/i18n'
import { Loading } from './shared/components/Loading.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Suspense fallback={<Loading fullScreen />}>
        <App />
      </Suspense>
    </ThemeProvider>
  </StrictMode>,
)