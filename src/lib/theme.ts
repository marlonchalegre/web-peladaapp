import { createTheme } from '@mui/material'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#9c27b0' },
  },
  typography: {
    fontFamily: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'].join(', '),
    h1: { fontSize: '2.25rem', fontWeight: 700 },
    h2: { fontSize: '1.75rem', fontWeight: 700 },
    h3: { fontSize: '1.5rem', fontWeight: 700 },
  },
  shape: { borderRadius: 8 },
})

export default theme
