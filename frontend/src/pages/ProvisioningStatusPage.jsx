import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import StatusChip from '../components/StatusChip';
import { fetchProvisionRequest } from '../services/provisionService';

const STEPS = ['REQUESTED', 'PROVISIONING', 'AVAILABLE'];

function formatWhen(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function stepIndex(status) {
  if (status === 'PROVISIONING') {
    return 1;
  }
  if (status === 'AVAILABLE') {
    return STEPS.length;
  }
  return 0;
}

function SummaryRow({ label, value }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: { sm: 160 }, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </Stack>
  );
}

export default function ProvisioningStatusPage() {
  const { requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await fetchProvisionRequest(requestId);
        if (!active) {
          return;
        }
        setRequest(data);
        setError('');
      } catch (requestError) {
        if (!active) {
          return;
        }
        setError(requestError.response?.data?.message || 'This request could not be loaded.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    const timer = setInterval(async () => {
      try {
        const data = await fetchProvisionRequest(requestId);
        if (!active) {
          return;
        }
        setRequest(data);
        setError('');
        if (data.status === 'AVAILABLE' || data.status === 'FAILED') {
          clearInterval(timer);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }
        setError(requestError.response?.data?.message || 'This request could not be loaded.');
      }
    }, 2000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [requestId]);

  if (loading) {
    return (
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={22} />
        <Typography color="text.secondary">Loading request…</Typography>
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const inProgress = request.status === 'REQUESTED' || request.status === 'PROVISIONING';

  return (
    <Stack spacing={2}>
      <Button component={RouterLink} to="/history" startIcon={<ArrowBack />} sx={{ alignSelf: 'flex-start' }}>
        Back to history
      </Button>
      <Typography variant="h4" component="h1">
        Provisioning status
      </Typography>
      <Alert severity="info">{request.message}</Alert>
      {request.status === 'AVAILABLE' && request.mode === 'aws' && (
        <Alert severity="success">This product is AVAILABLE in AWS Service Catalog.</Alert>
      )}
      {request.status === 'AVAILABLE' && request.mode !== 'aws' && (
        <Alert severity="success">This demo request is marked AVAILABLE. No AWS resources were created.</Alert>
      )}
      {request.status === 'FAILED' && <Alert severity="error">{request.message}</Alert>}
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Stepper activeStep={stepIndex(request.status)} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel error={request.status === 'FAILED' && label === 'PROVISIONING'}>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          {inProgress && <LinearProgress />}
          <Stack spacing={1.25}>
            <SummaryRow label="Request ID" value={request.requestId} />
            <SummaryRow label="Product" value={request.product} />
            <SummaryRow label="Environment" value={request.environment} />
            <SummaryRow label="Requested by" value={request.requestedBy} />
            <SummaryRow label="Requested at" value={formatWhen(request.requestedAt)} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.25, sm: 2 }} sx={{ alignItems: { sm: 'center' } }}>
              <Typography variant="body2" color="text.secondary" sx={{ width: { sm: 160 } }}>
                Status
              </Typography>
              <StatusChip status={request.status} />
            </Stack>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
