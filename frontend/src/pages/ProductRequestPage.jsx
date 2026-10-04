import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
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
import StatusChip from '../components/StatusChip';
import {
  fetchMyProductRequests,
  fetchRequestableProducts,
  submitProductRequest,
} from '../services/productRequestService';

const EMPTY_FORM = {
  productId: '',
  reason: '',
  environment: 'Development',
  expectedUsage: '',
};

function formatWhen(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || '—';
  }
  return date.toLocaleString();
}

export default function ProductRequestPage() {
  const [options, setOptions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [confirmation, setConfirmation] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productOptions, mine] = await Promise.all([
        fetchRequestableProducts(),
        fetchMyProductRequests(),
      ]);
      setOptions(productOptions);
      setRequests(mine);
      setForm((current) => ({
        ...current,
        productId: current.productId || productOptions[0]?.id || '',
      }));
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
        const [productOptions, mine] = await Promise.all([
          fetchRequestableProducts(),
          fetchMyProductRequests(),
        ]);
        if (!active) {
          return;
        }
        setOptions(productOptions);
        setRequests(mine);
        setForm((current) => ({
          ...current,
          productId: current.productId || productOptions[0]?.id || '',
        }));
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

  const selected = options.find((item) => item.id === form.productId);
  const environments = selected?.environments || ['Development', 'Testing', 'Production'];

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError('');
    setConfirmation('');
    setSubmitting(true);
    try {
      const created = await submitProductRequest({
        productId: form.productId,
        reason: form.reason,
        environment: form.environment,
        expectedUsage: form.expectedUsage,
      });
      setConfirmation('Product request submitted successfully.');
      setForm({
        productId: form.productId,
        reason: '',
        environment: 'Development',
        expectedUsage: '',
      });
      setRequests((current) => [created, ...current.filter((item) => item.requestId !== created.requestId)]);
    } catch (requestError) {
      setFormError(requestError.response?.data?.message || 'The product request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          Request a Product
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Ask an administrator for access to a product that is not in your catalog.
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
          <Typography color="text.secondary">Loading product requests…</Typography>
        </Stack>
      ) : (
        <>
          <Paper sx={{ p: { xs: 2, sm: 3 } }}>
            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                {confirmation && <Alert severity="success">{confirmation} Status: PENDING.</Alert>}
                {formError && <Alert severity="error">{formError}</Alert>}
                <TextField
                  select
                  label="Product"
                  value={form.productId}
                  onChange={(event) => setForm((current) => ({ ...current, productId: event.target.value }))}
                  required
                  fullWidth
                >
                  {options.map((option) => (
                    <MenuItem key={option.id} value={option.id}>
                      {option.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Reason"
                  value={form.reason}
                  onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                  required
                  fullWidth
                  multiline
                  minRows={3}
                />
                <TextField
                  select
                  label="Environment"
                  value={form.environment}
                  onChange={(event) => setForm((current) => ({ ...current, environment: event.target.value }))}
                  required
                  fullWidth
                >
                  {environments.map((environment) => (
                    <MenuItem key={environment} value={environment}>
                      {environment}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Expected usage"
                  value={form.expectedUsage}
                  onChange={(event) => setForm((current) => ({ ...current, expectedUsage: event.target.value }))}
                  required
                  fullWidth
                  multiline
                  minRows={3}
                />
                <Button type="submit" variant="contained" disabled={submitting || !form.productId} sx={{ alignSelf: 'flex-start' }}>
                  {submitting ? <CircularProgress size={22} color="inherit" /> : 'Request Product'}
                </Button>
              </Stack>
            </Box>
          </Paper>

          <Box>
            <Typography variant="h6" component="h2">
              My Product Requests
            </Typography>
          </Box>

          {requests.length === 0 ? (
            <Alert severity="info">No product requests yet.</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
              <Table sx={{ minWidth: 760 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Request ID</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Environment</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted At</TableCell>
                    <TableCell>Admin Comment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.requestId} hover>
                      <TableCell>{request.requestId}</TableCell>
                      <TableCell>{request.productName}</TableCell>
                      <TableCell>{request.environment}</TableCell>
                      <TableCell>
                        <StatusChip status={request.status} />
                      </TableCell>
                      <TableCell>{formatWhen(request.createdAt)}</TableCell>
                      <TableCell>{request.adminComment || '—'}</TableCell>
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
