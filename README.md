# AWS Service Catalog for Self-Service Provisioning

A B.Tech project portal for viewing approved infrastructure products and requesting provisioning through AWS Service Catalog.

The app can run in two modes. `DEMO_MODE=true` stores requests in MongoDB and does not call AWS. `DEMO_MODE=false` uses the AWS SDK default credential chain: local environment keys for development, or an EC2 instance IAM role in production. The React app never receives AWS credentials.

Production deployment steps are in [DEPLOYMENT.md](DEPLOYMENT.md).

## Architecture

```
User
  ↓
React frontend (Vite, Material UI)
  ↓
Node.js + Express API
  ↓
AWS Service Catalog   ← added in a later phase
  ↓
CloudFormation
  ↓
AWS resources
```

The frontend never talks to AWS and never holds AWS credentials. It calls only this backend. In AWS mode the backend lists Service Catalog products and provisions them. VPC and subnet choices come from `GET /api/aws/vpcs` and `GET /api/aws/subnets`.

```
Frontend
  ↓
POST /api/provision
  ↓
Express controller
  ↓
Provisioning service
  ↓
MongoDB
```

Intended production path, after AWS integration:

```
Frontend
  ↓
Express controller
  ↓
Provisioning service
  ↓
AWS SDK
  ↓
IAM authorization
  ↓
AWS Service Catalog
  ↓
CloudFormation
  ↓
AWS resources
```

IAM stays on the AWS side. The React app is not an IAM administration portal.

## Current status

| Phase | Scope | Status |
| --- | --- | --- |
| 1 | Vite, React, MUI, React Router, Axios, Express, CORS, folders | Done |
| 2 | Login, layout, sidebar, dashboard | Done |
| 3 | Product catalog and product details | Done |
| 4 | Provisioning form and provision API | Done |
| 5 | Provisioning status and history | Done |
| 6 | AWS Service Catalog integration | Done when `DEMO_MODE=false` |

API routes available now:

- `GET /api/health`
- `POST /api/auth/register` — creates an account in MongoDB. Password must be at least 6 characters.
- `POST /api/auth/login` — signs in with that account.
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/dashboard`
- `POST /api/provision` — saves a request such as `REQ-2026-001` in MongoDB. Demo status moves from `REQUESTED` to `PROVISIONING` to `AVAILABLE`.
- `GET /api/provision`
- `GET /api/provision/:id`
- `GET /api/aws/vpcs` — authenticated. Lists VPCs in `AWS_REGION`.
- `GET /api/aws/subnets?vpcId=` — authenticated. Lists subnets in the selected VPC.

Products and provisioning requests are stored in MongoDB. With `DEMO_MODE=false`, confirming a provision calls AWS Service Catalog and can create billable resources. The browser session token is not an AWS credential. Restarting the API keeps the saved requests.

## Prerequisites

- Node.js 22
- npm 11
- MongoDB running locally, or a `MONGODB_URI` in `backend/.env`

## Install

From the project root, these commands were used to create the apps:

```bash
npm create vite@latest frontend -- --template react
```

Frontend dependencies:

```bash
cd frontend
npm install
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled react-router-dom axios
```

Backend dependencies:

```bash
cd backend
npm install
```

Backend AWS packages are `@aws-sdk/client-service-catalog` and `@aws-sdk/client-ec2`. Do not add AWS credentials to the frontend.

## Run

Start MongoDB first so it is listening on `127.0.0.1:27017`. If it is not installed, run this in an elevated PowerShell window:

```powershell
winget install --id MongoDB.Server -e --accept-package-agreements --accept-source-agreements
```

This project can also use the user-level binaries already extracted under `%LOCALAPPDATA%\MongoDB`. Start that server with:

```powershell
& "$env:LOCALAPPDATA\MongoDB\mongodb-win32-x86_64-windows-9.0.2\bin\mongod.exe" --dbpath "$env:LOCALAPPDATA\MongoDB\data" --bind_ip 127.0.0.1 --port 27017
```

If MongoDB is down, the API prints `Could not connect to MongoDB. Start MongoDB, then check MONGODB_URI in backend/.env.` and exits. It does not seed sample products.

Use two terminals.

Backend:

```bash
cd backend
npm run dev
```

The API listens on `http://localhost:5000` only after MongoDB connects. Set `MONGODB_URI` in `backend/.env`. The catalog starts empty. Add products from the Products page. Accounts are created from the sign-in page and stored with a password hash.

Frontend:

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173`. Create an account, then sign in. Passwords must be at least 6 characters. The dashboard, catalog, and provisioning history load from MongoDB through the API. AWS is not connected.

Optional environment files (no secrets):

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

`backend/.env.example` lists future AWS variable names. Leave them blank. Do not commit a real `.env`.

## Security

- No AWS access keys, secret keys, or session tokens in the frontend.
- On EC2, leave `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` unset. The SDK uses the instance role.
- `.env.example` contains names and placeholders, not secrets. `.env` is gitignored.

## Project layout

```
frontend/src
  components/    shared cards and route guard
  pages/         login, dashboard, and later screens
  layouts/       sidebar and top bar
  services/      Axios client and API calls
  context/       demo session
  data/          environment labels for the provision form
  theme/         Material UI theme
  App.jsx
  main.jsx

backend/src
  config/        MongoDB connection
  models/        User, Product, and ProvisionRequest
  routes/        auth, products, dashboard, provision, network
  controllers/   request handlers
  services/      MongoDB, Service Catalog, and VPC/subnet lookup
  server.js
  ecosystem.config.js
```

## Production

See [DEPLOYMENT.md](DEPLOYMENT.md). Intended layout: Amplify hosts the frontend, a small Linux EC2 instance in `eu-north-1` runs this API behind Caddy, MongoDB Atlas stores users and requests, and the EC2 instance role calls Service Catalog. Do not put access keys on the instance.
