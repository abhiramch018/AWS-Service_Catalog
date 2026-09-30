import { Chip } from '@mui/material';

const COLORS = {
  REQUESTED: 'warning',
  PROVISIONING: 'info',
  AVAILABLE: 'success',
  FAILED: 'error',
};

export default function StatusChip({ status }) {
  return <Chip label={status} size="small" color={COLORS[status] || 'default'} />;
}
