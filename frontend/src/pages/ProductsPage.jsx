import { useCallback, useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TextField,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { createProduct, fetchProducts } from '../services/catalogService';

const EMPTY_PRODUCT = {
  name: '',
  version: '',
  category: '',
  description: '',
  provider: '',
  ec2Instance: '',
  securityGroup: '',
  cloudFormationTemplate: '',
  environment: 'Development',
};

function statusColor(status) {
  return status === 'Approved' ? 'success' : 'default';
}

function ProductActions({ product }) {
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      <Button component={RouterLink} to={`/provisioning/${product.id}`} variant="contained" size="small">
        Provision
      </Button>
      <Button component={RouterLink} to={`/products/${product.id}`} variant="outlined" size="small">
        View details
      </Button>
    </Stack>
  );
}

export default function ProductsPage() {
  const { mode } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_PRODUCT);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch {
      setError('The product catalog could not be loaded. Check that the backend is running.');
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
        const data = await fetchProducts();
        if (active) {
          setProducts(data);
        }
      } catch {
        if (active) {
          setError('The product catalog could not be loaded. Check that the backend is running.');
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

  function updateForm(field) {
    return (event) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  async function saveProduct(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      await createProduct({
        name: form.name,
        version: form.version,
        category: form.category,
        description: form.description,
        provider: form.provider,
        infrastructure: {
          ec2Instance: form.ec2Instance,
          securityGroup: form.securityGroup,
          cloudFormationTemplate: form.cloudFormationTemplate,
          environment: form.environment,
        },
      });
      setOpen(false);
      setForm(EMPTY_PRODUCT);
      await load();
    } catch (saveError) {
      setFormError(saveError.response?.data?.message || 'The product could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" component="h1">
            Products
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            {mode === 'aws'
              ? 'Approved products from AWS Service Catalog.'
              : 'Approved products stored in the portal database.'}
          </Typography>
        </Box>
        {mode !== 'aws' && (
          <Button variant="contained" onClick={() => setOpen(true)}>
            Add product
          </Button>
        )}
      </Stack>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={saveProduct}>
          <DialogTitle>Add product</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {formError && <Alert severity="error">{formError}</Alert>}
              <TextField label="Name" value={form.name} onChange={updateForm('name')} required fullWidth />
              <TextField label="Version" value={form.version} onChange={updateForm('version')} required fullWidth />
              <TextField label="Category" value={form.category} onChange={updateForm('category')} required fullWidth />
              <TextField label="Provider" value={form.provider} onChange={updateForm('provider')} required fullWidth />
              <TextField label="Description" value={form.description} onChange={updateForm('description')} required fullWidth multiline minRows={2} />
              <TextField label="EC2 instance" value={form.ec2Instance} onChange={updateForm('ec2Instance')} required fullWidth />
              <TextField label="Security Group" value={form.securityGroup} onChange={updateForm('securityGroup')} required fullWidth />
              <TextField label="CloudFormation template" value={form.cloudFormationTemplate} onChange={updateForm('cloudFormationTemplate')} required fullWidth />
              <TextField label="Environment" value={form.environment} onChange={updateForm('environment')} required fullWidth />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : 'Save product'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

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
          <Typography color="text.secondary">Loading products…</Typography>
        </Stack>
      ) : (
        products.length === 0 ? (
          <Alert severity="info">No approved products are available.</Alert>
        ) : (
          <>
            <Stack spacing={2} sx={{ display: { md: 'none' } }}>
              {products.map((product) => (
                <Card key={product.id}>
                  <CardContent>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Typography variant="h6" component="h2">
                        {product.name}
                      </Typography>
                      <Chip label={product.status} size="small" color={statusColor(product.status)} />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {product.description}
                    </Typography>
                    <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                      <Typography variant="body2">Version: {product.version}</Typography>
                      <Typography variant="body2">Category: {product.category}</Typography>
                      <Typography variant="body2">Provider: {product.provider}</Typography>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <ProductActions product={product} />
                  </CardActions>
                </Card>
              ))}
            </Stack>
            <TableContainer component={Paper} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Version</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>
                        <Typography variant="subtitle2">{product.name}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 360 }}>
                          {product.description}
                        </Typography>
                      </TableCell>
                      <TableCell>{product.version}</TableCell>
                      <TableCell>{product.category}</TableCell>
                      <TableCell>
                        <Chip label={product.status} size="small" color={statusColor(product.status)} />
                      </TableCell>
                      <TableCell>{product.provider}</TableCell>
                      <TableCell align="right">
                        <ProductActions product={product} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )
      )}
    </Stack>
  );
}
