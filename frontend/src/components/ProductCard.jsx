import { Button, Card, CardActions, CardContent, Chip, Stack, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

export default function ProductCard({ product }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="h3">
            {product.name}
          </Typography>
          <Chip
            label={product.status}
            size="small"
            color={product.status === 'Approved' ? 'success' : 'default'}
          />
        </Stack>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', my: 1.5 }}>
          <Chip label={product.category} size="small" variant="outlined" />
          <Chip label={product.version} size="small" variant="outlined" />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {product.description}
        </Typography>
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Button component={RouterLink} to={`/products/${product.id}`} variant="outlined" size="small">
          View Details
        </Button>
      </CardActions>
    </Card>
  );
}
