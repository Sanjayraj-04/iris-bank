import { createRoot } from 'react-dom/client';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import '@fontsource-variable/inter';
import FirebasePortal from './FirebasePortal';
import bank from './bank-config';
import './style.css';
import './firebase-portal.css';

document.title = bank.name + ' | Banking portal';
document.documentElement.dataset.bank = bank.theme;
const theme = createTheme({
  palette: { primary: { main: bank.color } },
  shape: { borderRadius: 10 },
  typography: { fontFamily: '"Inter Variable", Inter, sans-serif', button: { textTransform: 'none', fontWeight: 680 } },
  components: { MuiButton: { defaultProps: { disableElevation: true } } },
});
const switchUrl = 'https://sriramtpsiog.github.io/SharedDB/';
createRoot(document.getElementById('root')).render(
  <ThemeProvider theme={theme}><CssBaseline /><FirebasePortal switchUrl={switchUrl}/></ThemeProvider>,
);
