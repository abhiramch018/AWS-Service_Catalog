import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
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
import StatusChip from '../components/StatusChip';
import { fetchProvisionRequests } from '../services/provisionService';

function formatWhen(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export default function ProvisioningHistoryPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await fetchProvisionRequests();
      setRequests(data);
      setError('');
    } catch {
      setError('Provisioning history could not be loaded. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        const data = await fetchProvisionRequests();
        if (!active) {
          return;
        }
        setRequests(data);
        setError('');
      } catch {
        if (active) {
          setError('Provisioning history could not be loaded. Check that the backend is running.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    run();
    const timer = setInterval(run, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          Provisioning History
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Requests recorded by this portal.
        </Typography>
      </Box>
      <Alert severity="info">Status is read from AWS Service Catalog.</Alert>
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
          <Typography color="text.secondary">Loading history…</Typography>
        </Stack>
      ) : requests.length === 0 ? (
        <Alert severity="info">No provisioning requests yet. Submit one from the product catalog.</Alert>
      ) : (
        <>
          <Stack spacing={2} sx={{ display: { md: 'none' } }}>
            {requests.map((request) => (
              <Card key={request.requestId}>
                <CardContent>
                  <Stack spacing={0.75}>
                    <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1">{request.requestId}</Typography>
                      <StatusChip status={request.status} />
                    </Stack>
                    <Typography variant="body2">{request.product}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {request.environment} · {request.requestedBy}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatWhen(request.requestedAt)}
                    </Typography>
                  </Stack>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button component={RouterLink} to={`/history/${request.requestId}`} size="small" variant="outlined">
                    View status
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Stack>
          <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Request ID</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Environment</TableCell>
                  <TableCell>Requested by</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.requestId} hover>
                    <TableCell>{request.requestId}</TableCell>
                    <TableCell>{request.product}</TableCell>
                    <TableCell>{request.environment}</TableCell>
                    <TableCell>{request.requestedBy}</TableCell>
                    <TableCell>{formatWhen(request.requestedAt)}</TableCell>
                    <TableCell>
                      <StatusChip status={request.status} />
                    </TableCell>
                    <TableCell align="right">
                      <Button component={RouterLink} to={`/history/${request.requestId}`} size="small" variant="outlined">
                        View status
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Stack>
  );
}
