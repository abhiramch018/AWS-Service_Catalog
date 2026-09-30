import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

export default function SummaryCard({ label, value, icon }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" sx={{ mt: 0.5 }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              display: 'flex',
              p: 1.25,
              borderRadius: 2,
              color: 'primary.main',
              bgcolor: 'action.hover',
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
