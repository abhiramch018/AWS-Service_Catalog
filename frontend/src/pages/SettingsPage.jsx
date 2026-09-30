import { Alert, Stack, Typography } from '@mui/material';
import { useAuth } from '../context/AuthContext';

function Row({ label, value }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography>{value}</Typography>
    </Stack>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <Stack spacing={3} sx={{ maxWidth: 640 }}>
      <Typography variant="h4" component="h1">
        Settings
      </Typography>
      <Alert severity="info">
        AWS credentials are stored only on the server. This page does not manage access keys.
      </Alert>
      <Row label="Name" value={user?.name || '—'} />
      <Row label="Email" value={user?.email || '—'} />
      <Row label="Role" value={user?.role || '—'} />
    </Stack>
  );
}
