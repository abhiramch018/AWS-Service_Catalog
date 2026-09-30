import { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { fetchProduct } from '../services/catalogService';

const INFRASTRUCTURE_FIELDS = [
  ['ec2Instance', 'EC2 instance'],
  ['securityGroup', 'Security Group'],
  ['cloudFormationTemplate', 'CloudFormation template'],
  ['environment', 'Environment'],
];

export default function ProductDetailsPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchProduct(id);
        if (active) {
          setProduct(data);
        }
      } catch (requestError) {
        if (!active) {
          return;
        }
        const message = requestError.response?.data?.message;
        setError(message || 'This product could not be loaded.');
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
  }, [id]);

  if (loading) {
    return (
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', py: 4 }}>
        <CircularProgress size={22} />
        <Typography color="text.secondary">Loading product…</Typography>
      </Stack>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Stack spacing={2}>
      <Button
        component={RouterLink}
        to="/products"
        startIcon={<ArrowBack />}
        sx={{ alignSelf: 'flex-start' }}
      >
        Back to products
      </Button>
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.5}
            sx={{ alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between' }}
          >
            <Typography variant="h4" component="h1">
              {product.name}
            </Typography>
            <Chip
              label={product.status}
              color={product.status === 'Approved' ? 'success' : 'default'}
            />
          </Stack>
          <Typography color="text.secondary">{product.description}</Typography>
          <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <Chip label={`Version ${product.version}`} variant="outlined" />
            <Chip label={product.category} variant="outlined" />
            <Chip label={product.provider} variant="outlined" />
          </Stack>
          <Divider />
          <Typography variant="h6" component="h2">
            Infrastructure details
          </Typography>
          <Stack spacing={1.25}>
            {INFRASTRUCTURE_FIELDS.map(([key, label]) => (
              <Stack
                key={key}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={{ xs: 0.25, sm: 2 }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ width: { sm: 220 }, flexShrink: 0 }}>
                  {label}
                </Typography>
                <Typography variant="body2">{product.infrastructure?.[key] || 'Not specified'}</Typography>
              </Stack>
            ))}
          </Stack>
          <Alert severity="info">
            This product comes from AWS Service Catalog. Provisioning can create AWS resources.
          </Alert>
          <Button
            component={RouterLink}
            to={`/provisioning/${product.id}`}
            variant="contained"
            sx={{ alignSelf: 'flex-start' }}
          >
            Provision Product
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
