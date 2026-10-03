import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutlined,
  CloudQueueOutlined,
  GroupOutlined,
  PendingActionsOutlined,
} from '@mui/icons-material';
import StatusChip from '../components/StatusChip';
import SummaryCard from '../components/SummaryCard';
import { fetchAdminDashboard } from '../services/adminService';

const EMPTY = {
  totalUsers: 0,
  totalProvisioningRequests: 0,
  activeProvisionedResources: 0,
  successfulRequests: 0,
  requests: [],
};

function formatWhen(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || '—';
  }
  return date.toLocaleString();
}

function display(value) {
  return value || '—';
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setSummary(await fetchAdminDashboard());
    } catch {
      setError('The admin dashboard could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchAdminDashboard();
        if (active) {
          setSummary(data);
        }
      } catch {
        if (active) {
          setError('The admin dashboard could not be loaded.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    run();
    return () => {
      active = false;
    };
  }, []);

  const cards = [
    { label: 'Total Users', value: summary.totalUsers, icon: <GroupOutlined /> },
    {
      label: 'Total Provisioning Requests',
      value: summary.totalProvisioningRequests,
      icon: <PendingActionsOutlined />,
    },
    {
      label: 'Active/Available Provisioned Resources',
      value: summary.activeProvisionedResources,
      icon: <CloudQueueOutlined />,
    },
    {
      label: 'Successful Provisioning Requests',
      value: summary.successfulRequests,
      icon: <CheckCircleOutlined />,
    },
  ];
  const requests = summary.requests || [];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          Admin Dashboard
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Users and the AWS resources they have requested.
        </Typography>
      </Box>

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={load}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 6 }}>
          <CircularProgress size={22} />
          <Typography color="text.secondary">Loading dashboard…</Typography>
        </Stack>
      ) : (
        <>
          <Grid container spacing={2}>
            {cards.map((card) => (
              <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
                <SummaryCard label={card.label} value={card.value} icon={card.icon} />
              </Grid>
            ))}
          </Grid>

          <Box>
            <Typography variant="h6" component="h2">
              Resource provisioning
            </Typography>
          </Box>

          {requests.length === 0 ? (
            <Alert severity="info">No provisioning requests yet.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 1100 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Request ID</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Environment</TableCell>
                    <TableCell>Provisioned Product</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.requestId} hover>
                      <TableCell>{display(request.user)}</TableCell>
                      <TableCell>{display(request.email)}</TableCell>
                      <TableCell>{request.requestId}</TableCell>
                      <TableCell>{request.product}</TableCell>
                      <TableCell>{request.environment}</TableCell>
                      <TableCell>{display(request.provisionedProduct)}</TableCell>
                      <TableCell>
                        <StatusChip status={request.status} />
                      </TableCell>
                      <TableCell>{formatWhen(request.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Stack>
  );
}
