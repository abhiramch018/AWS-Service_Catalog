import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircleOutlined, CancelOutlined, PendingActionsOutlined } from '@mui/icons-material';
import StatusChip from './StatusChip';
import SummaryCard from './SummaryCard';
import {
  approveProductRequest,
  fetchAdminProductRequests,
  rejectProductRequest,
} from '../services/productRequestService';

function formatWhen(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || '—';
  }
  return date.toLocaleString();
}

function Detail({ label, value }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: { sm: 140 }, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value || '—'}</Typography>
    </Stack>
  );
}

export default function AdminProductRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [dialog, setDialog] = useState(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setRequests(await fetchAdminProductRequests());
    } catch {
      setError('Product requests could not be loaded.');
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
        const data = await fetchAdminProductRequests();
        if (active) {
          setRequests(data);
        }
      } catch {
        if (active) {
          setError('Product requests could not be loaded.');
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

  const pending = requests.filter((request) => request.status === 'PENDING');
  const reviewed = requests.filter((request) => request.status !== 'PENDING');
  const cards = [
    {
      label: 'Pending Product Requests',
      value: pending.length,
      icon: <PendingActionsOutlined />,
    },
    {
      label: 'Approved Product Requests',
      value: requests.filter((request) => request.status === 'APPROVED').length,
      icon: <CheckCircleOutlined />,
    },
    {
      label: 'Rejected Product Requests',
      value: requests.filter((request) => request.status === 'REJECTED').length,
      icon: <CancelOutlined />,
    },
  ];

  function openDialog(mode, request) {
    setActionError('');
    setComment('');
    setDialog({ mode, request });
  }

  async function confirmReview() {
    if (!dialog) {
      return;
    }
    setSaving(true);
    setActionError('');
    try {
      const updated =
        dialog.mode === 'approve'
          ? await approveProductRequest(dialog.request.requestId, comment)
          : await rejectProductRequest(dialog.request.requestId, comment);
      setRequests((current) =>
        current.map((item) => (item.requestId === updated.requestId ? updated : item)),
      );
      setDialog(null);
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || 'The product request could not be reviewed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6" component="h2">
          Product Requests
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Review developer requests for products that are not yet available to them.
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
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 2 }}>
          <CircularProgress size={22} />
          <Typography color="text.secondary">Loading product requests…</Typography>
        </Stack>
      ) : (
        <>
          <Grid container spacing={2}>
            {cards.map((card) => (
              <Grid key={card.label} size={{ xs: 12, sm: 4 }}>
                <SummaryCard label={card.label} value={card.value} icon={card.icon} />
              </Grid>
            ))}
          </Grid>

          {pending.length === 0 ? (
            <Alert severity="info">No pending product requests.</Alert>
          ) : (
            pending.map((request) => (
              <Paper key={request.requestId} sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack spacing={1.25}>
                  <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">{request.requestId}</Typography>
                    <StatusChip status={request.status} />
                  </Stack>
                  <Detail label="Developer" value={request.userName} />
                  <Detail label="Email" value={request.userEmail} />
                  <Detail label="Product" value={request.productName} />
                  <Detail label="Environment" value={request.environment} />
                  <Detail label="Reason" value={request.reason} />
                  <Detail label="Expected usage" value={request.expectedUsage} />
                  <Stack direction="row" spacing={1}>
                    <Button variant="contained" onClick={() => openDialog('approve', request)}>
                      Approve
                    </Button>
                    <Button variant="outlined" color="error" onClick={() => openDialog('reject', request)}>
                      Reject
                    </Button>
                  </Stack>
                </Stack>
              </Paper>
            ))
          )}

          {reviewed.length > 0 && (
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 860 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Request ID</TableCell>
                    <TableCell>Developer</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Environment</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Admin Comment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviewed.map((request) => (
                    <TableRow key={request.requestId} hover>
                      <TableCell>{request.requestId}</TableCell>
                      <TableCell>{request.userName}</TableCell>
                      <TableCell>{request.userEmail}</TableCell>
                      <TableCell>{request.productName}</TableCell>
                      <TableCell>{request.environment}</TableCell>
                      <TableCell>
                        <StatusChip status={request.status} />
                      </TableCell>
                      <TableCell>{request.adminComment || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      <Dialog open={Boolean(dialog)} onClose={() => !saving && setDialog(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {dialog?.mode === 'reject' ? 'Reject Product Request' : 'Approve Product Request?'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant="body2">Product: {dialog?.request.productName}</Typography>
            <Typography variant="body2">Developer: {dialog?.request.userName}</Typography>
            {dialog?.mode === 'reject' && (
              <TextField
                label="Reason"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                fullWidth
                multiline
                minRows={3}
              />
            )}
            {actionError && <Alert severity="error">{actionError}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color={dialog?.mode === 'reject' ? 'error' : 'primary'}
            onClick={confirmReview}
            disabled={saving}
          >
            {saving ? <CircularProgress size={22} color="inherit" /> : dialog?.mode === 'reject' ? 'Reject Request' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
