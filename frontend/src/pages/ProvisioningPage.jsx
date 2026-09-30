import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { fetchProducts } from '../services/catalogService';

export default function ProvisioningPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const data = await fetchProducts();
        if (active) {
          setProducts(data);
        }
      } catch {
        if (active) {
          setError('Products could not be loaded. Check that the backend is running.');
        }
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
  }, []);

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">
        Provisioning
      </Typography>
      <Alert severity="info">
        Provisioning sends a request to AWS Service Catalog for an approved product.
      </Alert>
      {loading && (
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <CircularProgress size={22} />
          <Typography color="text.secondary">Loading products…</Typography>
        </Stack>
      )}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && !error && products.length === 0 && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" component={RouterLink} to="/products">
              Add product
            </Button>
          }
        >
          No approved products are available.
        </Alert>
      )}
      {!loading &&
        products.map((product) => (
          <Stack key={product.id} direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
            <Stack spacing={0.5}>
              <Typography variant="h6" component="h2">
                {product.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {product.category} · {product.version}
              </Typography>
            </Stack>
            <Button component={RouterLink} to={`/provisioning/${product.id}`} variant="contained">
              Provision
            </Button>
          </Stack>
        ))}
    </Stack>
  );
}
