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
import {
  INITIAL_PROVISION_FORM,
  REGION_CODE,
  REGION_LABEL,
  productProfile,
} from '../data/provisionOptions';
import { fetchProduct } from '../services/catalogService';
import { fetchSubnets, fetchVpcs } from '../services/networkService';
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
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(INITIAL_PROVISION_FORM);
  const [vpcs, setVpcs] = useState([]);
  const [vpcState, setVpcState] = useState('loading');
  const [subnets, setSubnets] = useState([]);
  const [subnetState, setSubnetState] = useState('idle');
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

  useEffect(() => {
    setForm(INITIAL_PROVISION_FORM);
    setReviewing(false);
    setSubmitError('');
  }, [productId]);

  const profile = productProfile(product);
  const fields = profile?.fields || [];
  const needsVpc = fields.includes('vpc');

  useEffect(() => {
    if (!needsVpc) {
      setVpcs([]);
      setVpcState('idle');
      return undefined;
    }

    let active = true;

    async function loadNetworks() {
      setVpcState('loading');
      try {
        const data = await fetchVpcs();
        if (!active) {
          return;
        }
        setVpcs(data.vpcs || []);
        setForm((current) => ({ ...current, region: data.region || current.region }));
        setVpcState((data.vpcs || []).length ? 'ready' : 'empty');
      } catch {
        if (active) {
          setVpcs([]);
          setVpcState('error');
        }
      }
    }

    loadNetworks();
    return () => {
      active = false;
    };
  }, [product?.id, needsVpc]);

  useEffect(() => {
    if (!form.vpc) {
      setSubnets([]);
      setSubnetState('idle');
      return undefined;
    }

    let active = true;
    setSubnetState('loading');
    setSubnets([]);

    async function loadSubnets() {
      try {
        const data = await fetchSubnets(form.vpc);
        if (!active) {
          return;
        }
        setSubnets(data.subnets || []);
        setSubnetState((data.subnets || []).length ? 'ready' : 'empty');
      } catch {
        if (active) {
          setSubnets([]);
          setSubnetState('error');
        }
      }
    }

    loadSubnets();
    return () => {
      active = false;
    };
  }, [form.vpc]);

  function reviewConfiguration() {
    if (!profile) {
      setSubmitError('This product cannot be provisioned from the portal.');
      return;
    }
    if (fields.includes('instanceType') && !form.instanceType.trim()) {
      setSubmitError('Instance type is required.');
      return;
    }
    if (fields.includes('vpc') && (!form.region.trim() || !form.subnet.trim() || !form.vpc.trim())) {
      setSubmitError('Region, subnet, and VPC are required.');
      return;
    }
    setSubmitError('');
    setReviewing(true);
  }

  function provisionPayload() {
    const payload = {
      productId: product.id,
      environment: form.environment,
    };
    if (fields.includes('instanceType')) {
      payload.instanceType = form.instanceType;
    }
    if (fields.includes('region')) {
      payload.region = form.region;
    }
    if (fields.includes('vpc')) {
      payload.vpc = form.vpc;
    }
    if (fields.includes('subnet')) {
      payload.subnet = form.subnet;
    }
    return payload;
  }

  function updateField(field) {
    return (event) => {
      const value = event.target.value;
      setForm((current) => ({
        ...current,
        [field]: value,
        ...(field === 'vpc' ? { subnet: '' } : {}),
      }));
      setReviewing(false);
    };
  }

  async function confirmProvision() {
    setSubmitting(true);
    setSubmitError('');

    try {
      const data = await submitProvisionRequest(provisionPayload());
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

  const vpcLabel = vpcs.find((vpc) => vpc.id === form.vpc)?.label || form.vpc;
  const subnetLabel = subnets.find((subnet) => subnet.id === form.subnet)?.label || form.subnet;
  const summary = [
    ['Product', product.name],
    ['Environment', form.environment],
    fields.includes('instanceType') ? ['Instance type', form.instanceType] : null,
    fields.includes('region') ? ['Region', form.region === REGION_CODE ? REGION_LABEL : form.region] : null,
    fields.includes('vpc') ? ['VPC', vpcLabel] : null,
    fields.includes('subnet') ? ['Subnet', subnetLabel] : null,
  ].filter(Boolean);

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
            {profile && (
              <TextField select label="Environment" value={form.environment} onChange={updateField('environment')} fullWidth>
                {profile.environments.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {fields.includes('instanceType') && (
              <TextField select label="Instance type" value={form.instanceType} onChange={updateField('instanceType')} required fullWidth>
                {profile.instanceTypes.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {fields.includes('region') && (
              <TextField select label="Region" value={form.region} fullWidth>
                <MenuItem value={REGION_CODE}>{REGION_LABEL}</MenuItem>
              </TextField>
            )}
            {fields.includes('vpc') && (
              <TextField
                select
                label="VPC"
                value={form.vpc}
                onChange={updateField('vpc')}
                disabled={vpcState !== 'ready'}
                required
                fullWidth
                helperText={
                  vpcState === 'loading'
                    ? 'Loading VPCs…'
                    : vpcState === 'empty'
                      ? 'No VPCs found.'
                      : vpcState === 'error'
                        ? 'Failed to load VPCs.'
                        : ' '
                }
              >
                <MenuItem value="" disabled>
                  Select VPC
                </MenuItem>
                {vpcs.map((vpc) => (
                  <MenuItem key={vpc.id} value={vpc.id}>
                    {vpc.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {fields.includes('subnet') && (
              <TextField
                select
                label="Subnet"
                value={form.subnet}
                onChange={updateField('subnet')}
                disabled={!form.vpc || subnetState !== 'ready'}
                required
                fullWidth
                helperText={
                  !form.vpc
                    ? 'Select a VPC first.'
                    : subnetState === 'loading'
                      ? 'Loading subnets…'
                      : subnetState === 'empty'
                        ? 'No subnets found.'
                        : subnetState === 'error'
                          ? 'Failed to load subnets.'
                          : ' '
                }
              >
                <MenuItem value="" disabled>
                  Select Subnet
                </MenuItem>
                {subnets.map((subnet) => (
                  <MenuItem key={subnet.id} value={subnet.id}>
                    {subnet.label}
                  </MenuItem>
                ))}
              </TextField>
            )}
            {!profile && (
              <Alert severity="error">This product cannot be provisioned from the portal.</Alert>
            )}

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
