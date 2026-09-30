import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { ENVIRONMENTS, INITIAL_PROVISION_FORM } from '../data/provisionOptions';
import { fetchProduct } from '../services/catalogService';
import { submitProvisionRequest } from '../services/provisionService';

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

export default function ProvisionProductPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(INITIAL_PROVISION_FORM);
  const [reviewing, setReviewing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        const data = await fetchProduct(productId);
        if (active) {
          setProduct(data);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }
        setLoadError(requestError.response?.data?.message || 'This product could not be loaded.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [productId]);

  function reviewConfiguration() {
    if (!form.instanceType.trim() || !form.region.trim() || !form.subnet.trim() || !form.vpc.trim()) {
      setSubmitError('Instance type, region, subnet, and VPC are required.');
      return;
    }
    setSubmitError('');
    setReviewing(true);
  }

  function updateField(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setReviewing(false);
    };
  }

  async function confirmProvision() {
    setSubmitting(true);
    setSubmitError('');

    try {
      const data = await submitProvisionRequest({
        productId: product.id,
        ...form,
        requestedBy: user?.name || 'Portal user',
      });
      setConfirmOpen(false);
      navigate(`/history/${data.requestId}`);
    } catch (requestError) {
      setSubmitError(requestError.response?.data?.message || 'The provisioning request could not be saved.');
      setConfirmOpen(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={22} />
        <Typography color="text.secondary">Loading product…</Typography>
      </Stack>
    );
  }

  if (loadError) {
    return <Alert severity="error">{loadError}</Alert>;
  }

  const summary = [
    ['Product', product.name],
    ['Environment', form.environment],
    ['Instance type', form.instanceType],
    ['Region', form.region],
    ['Subnet', form.subnet],
    ['VPC', form.vpc],
  ];

  return (
    <Stack spacing={2}>
      <Button component={RouterLink} to={`/products/${product.id}`} startIcon={<ArrowBack />} sx={{ alignSelf: 'flex-start' }}>
        Back to product
      </Button>
      <Box>
        <Typography variant="h4" component="h1">
          Provision Product
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          {product.name}
        </Typography>
      </Box>
      <Alert severity="warning">
        Confirming this request calls AWS Service Catalog and can create billable AWS resources in eu-north-1.
      </Alert>
      {submitError && <Alert severity="error">{submitError}</Alert>}

      <Paper sx={{ p: 3 }}>
          <Stack spacing={2.5}>
            <TextField label="Product" value={product.name} fullWidth slotProps={{ input: { readOnly: true } }} />
            <TextField select label="Environment" value={form.environment} onChange={updateField('environment')} fullWidth>
              {ENVIRONMENTS.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Instance type" value={form.instanceType} onChange={updateField('instanceType')} required fullWidth />
            <TextField label="Region" value={form.region} onChange={updateField('region')} required fullWidth />
            <TextField label="Subnet" value={form.subnet} onChange={updateField('subnet')} required fullWidth />
            <TextField label="VPC" value={form.vpc} onChange={updateField('vpc')} required fullWidth />

            {reviewing && (
              <Box>
                <Typography variant="h6" component="h2" sx={{ mb: 1.5 }}>
                  Review configuration
                </Typography>
                <Stack spacing={1}>
                  {summary.map(([label, value]) => (
                    <SummaryRow key={label} label={label} value={value} />
                  ))}
                </Stack>
              </Box>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button variant={reviewing ? 'outlined' : 'contained'} onClick={reviewConfiguration}>
                Review Configuration
              </Button>
              <Button variant="contained" disabled={!reviewing} onClick={() => setConfirmOpen(true)}>
                Provision Product
              </Button>
            </Stack>
          </Stack>
        </Paper>

      <Dialog open={confirmOpen} onClose={() => !submitting && setConfirmOpen(false)}>
        <DialogTitle>Confirm provisioning request</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Submit a Service Catalog request for {product.name}? This can create AWS resources.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={confirmProvision} disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Confirm request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
