import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { CloudQueueOutlined, Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

export default function AdminLoginPage() {
  const { isAuthenticated, user, adminLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={user?.role === 'Admin' ? '/admin/dashboard' : '/dashboard'} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await adminLogin(email, password);
      navigate('/admin/dashboard', { replace: true });
    } catch (requestError) {
      const message = requestError.response?.data?.message;
      setError(message || 'The API is not reachable. Start the backend, then try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '46%',
          p: 6,
          color: 'primary.contrastText',
          bgcolor: 'primary.main',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CloudQueueOutlined />
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            AWS Service Catalog Portal
          </Typography>
        </Stack>
        <Box>
          <Typography variant="h3" component="p" sx={{ fontWeight: 600, maxWidth: 460 }}>
            Administration for approved infrastructure
          </Typography>
          <Typography sx={{ mt: 2, maxWidth: 460, opacity: 0.9 }}>
            Review which portal users have requested provisioning.
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.85 }}>
          Approved products are requested through the portal server. AWS credentials are not entered here.
        </Typography>
      </Box>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 6 },
        }}
      >
        <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', maxWidth: 420 }}>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', display: { md: 'none' } }}>
              <CloudQueueOutlined color="primary" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                AWS Service Catalog Portal
              </Typography>
            </Stack>
            <Box>
              <Typography variant="h4" component="h1">
                Admin sign in
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Administrator access is checked by the portal server.
              </Typography>
            </Box>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Email"
              type="email"
              name="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword((current) => !current)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign in'}
            </Button>
            <Button type="button" onClick={() => navigate('/login')}>
              User sign in
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
