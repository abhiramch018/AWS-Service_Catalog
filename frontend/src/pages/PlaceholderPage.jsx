import { Paper, Stack, Typography } from '@mui/material';

export default function PlaceholderPage({ title, message }) {
  return (
    <Stack spacing={2}>
      <Typography variant="h4" component="h1">
        {title}
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography color="text.secondary">{message}</Typography>
      </Paper>
    </Stack>
  );
}
