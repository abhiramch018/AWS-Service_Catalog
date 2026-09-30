import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  CheckCircleOutlined,
  CloudQueueOutlined,
  Inventory2Outlined,
  PendingActionsOutlined,
} from '@mui/icons-material';
import ProductCard from '../components/ProductCard';
import SummaryCard from '../components/SummaryCard';
import { fetchDashboardSummary, fetchProducts } from '../services/catalogService';

const EMPTY_SUMMARY = {
  approvedProducts: 0,
  provisioningRequests: 0,
  activeProvisionedResources: 0,
  successfulRequests: 0,
};

export default function DashboardPage() {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [summaryData, productData] = await Promise.all([
        fetchDashboardSummary(),
        fetchProducts(),
      ]);
      setSummary(summaryData);
      setProducts(productData);
    } catch {
      setError('The catalog could not be loaded. Check that the backend is running.');
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
        const [summaryData, productData] = await Promise.all([
          fetchDashboardSummary(),
          fetchProducts(),
        ]);
        if (!active) {
          return;
        }
        setSummary(summaryData);
        setProducts(productData);
      } catch {
        if (active) {
          setError('The catalog could not be loaded. Check that the backend is running.');
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
    {
      label: 'Approved Products',
      value: summary.approvedProducts,
      icon: <Inventory2Outlined />,
    },
    {
      label: 'Provisioning Requests',
      value: summary.provisioningRequests,
      icon: <PendingActionsOutlined />,
    },
    {
      label: 'Active Provisioned Resources',
      value: summary.activeProvisionedResources,
      icon: <CloudQueueOutlined />,
    },
    {
      label: 'Successful Requests',
      value: summary.successfulRequests,
      icon: <CheckCircleOutlined />,
    },
  ];

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Approved products available for self-service provisioning.
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
              Available Products
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Products approved in AWS Service Catalog for this portal.
            </Typography>
          </Box>

          {products.length === 0 ? (
            <Alert severity="info">No approved products are available.</Alert>
          ) : (
            <Grid container spacing={2}>
              {products.map((product) => (
                <Grid key={product.id} size={{ xs: 12, md: 6 }}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
        </>
      )}
    </Stack>
  );
}
