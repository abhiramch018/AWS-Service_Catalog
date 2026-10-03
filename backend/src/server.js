require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { connectDb, databaseStatus } = require('./config/db');
const { portalMode } = require('./config/aws');
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const provisionRoutes = require('./routes/provision.routes');
const networkRoutes = require('./routes/network.routes');

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const LOCAL_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }
  if (origin === CORS_ORIGIN) {
    return true;
  }
  return LOCAL_ORIGINS.includes(CORS_ORIGIN) && LOCAL_ORIGINS.includes(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      callback(null, isAllowedOrigin(origin));
    },
  }),
);
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: portalMode(),
    database: databaseStatus(),
    message:
      portalMode() === 'aws'
        ? 'Connected to AWS Service Catalog. Credentials stay on the server.'
        : 'Demo Mode — AWS resources are not being created.',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/provision', provisionRoutes);
app.use('/api/aws', networkRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

async function start() {
  await connectDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`API listening on port ${PORT} (${portalMode()} mode, MongoDB connected)`);
  });
}

start().catch((error) => {
  const message = String(error.message || 'The API could not start.').replace(
    /mongodb(\+srv)?:\/\/\S+/gi,
    'mongodb://***',
  );
  console.error(message);
  process.exit(1);
});
