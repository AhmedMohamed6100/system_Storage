import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { AppProvider } from './contexts/AppContext';
import AppRouter from './routes/AppRouter';

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppProvider>
              <AppRouter />
            </AppProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </HashRouter>
  );
}