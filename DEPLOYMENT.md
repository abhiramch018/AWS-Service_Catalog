# Production deployment

Do not create AWS resources until the account owner approves each billable item. This file matches the repository as it exists on `feature/network-api`.

## Target layout

```
Internet
  ↓
AWS Amplify (frontend/dist)
  ↓ HTTPS
Caddy on a new Linux EC2 instance in eu-north-1
  ↓
Node.js API (PM2, port 5000, not open to the internet)
  ↓
MongoDB Atlas
  ↓
EC2 instance role AWSServiceCatalogBackendEC2Role
  ↓
AWS Service Catalog
  ↓
CloudFormation, using the existing ServiceCatalogLaunchRole
  ↓
Approved product resources
```

The React app never receives AWS keys. The API creates the Service Catalog and EC2 clients with `region` only. The AWS SDK default credential chain supplies credentials.

## Environment variables

Backend, in `backend/.env` on the EC2 instance only:

| Name | Required in production | Notes |
| --- | --- | --- |
| `PORT` | Optional | Defaults to `5000`. Keep it private behind Caddy. |
| `MONGODB_URI` | Yes | Atlas connection string. Secret. |
| `MONGODB_DB` | Optional | Database name when the URI does not already select one. |
| `CORS_ORIGIN` | Yes | Exact Amplify origin, for example `https://main.xxxx.amplifyapp.com`. |
| `DEMO_MODE` | Yes | Must be `false` in production. `true` never calls AWS. |
| `AWS_REGION` | Yes | `eu-north-1`. |
| `AWS_ACCESS_KEY_ID` | No | Leave unset on EC2. |
| `AWS_SECRET_ACCESS_KEY` | No | Leave unset on EC2. |

Frontend, Amplify environment variable, set before the production build:

| Name | Required | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Public HTTPS origin of the API, with no trailing path. Vite inlines this at build time. |

## Backend IAM role

Role name: `AWSServiceCatalogBackendEC2Role`.

Trust policy principal: `ec2.amazonaws.com`.

Inline policy, least privilege for the calls in this repository:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "ServiceCatalogEndUser",
      "Effect": "Allow",
      "Action": [
        "servicecatalog:SearchProducts",
        "servicecatalog:DescribeProduct",
        "servicecatalog:ListLaunchPaths",
        "servicecatalog:DescribeProvisioningParameters",
        "servicecatalog:ProvisionProduct",
        "servicecatalog:DescribeProvisionedProduct"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DescribeNetworks",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets"
      ],
      "Resource": "*"
    }
  ]
}
```

Also grant this role access on the Service Catalog portfolio. An IAM policy alone does not make the role a catalog principal.

`ServiceCatalogLaunchRole` is separate. CloudFormation uses that role to create product resources. Do not replace it with the backend role, and do not change it for this deployment.

## HTTPS

Amplify serves the frontend over HTTPS. The browser will block an HTTP API. Use Caddy on the EC2 instance with a domain name you control. Point an A record at the instance public IPv4 address. Caddy obtains a Let's Encrypt certificate and proxies to `127.0.0.1:5000`.

This avoids an Application Load Balancer. A trusted certificate still requires a domain. Stop and choose a domain before opening ports 80 and 443.

## Amplify

`amplify.yml` builds `frontend/` with Node 22 and publishes `dist`.

Amplify does not read `frontend/public/_redirects`. After the Amplify app exists, apply `customRules.json`:

```bash
aws amplify update-app --app-id <app-id> --region eu-north-1 --custom-rules file://customRules.json
```

Or paste the same rule in Amplify Hosting → Rewrites and redirects:

- Source: `/<*>`
- Target: `/index.html`
- Type: `404-200`

Set `VITE_API_BASE_URL` before the build, then redeploy.

## Process manager

From `backend/` after `.env` is in place:

```bash
npm ci --omit=dev
pm2 start ecosystem.config.js
pm2 save
```

`ecosystem.config.js` starts `src/server.js` as `portal-api`. It does not contain secrets. `dotenv` reads `backend/.env`.

## Security group

- TCP 22 from the administrator's current public IP only
- TCP 80 and TCP 443 from the internet, for Caddy and Let's Encrypt
- Do not open TCP 5000 or TCP 27017

## What this deployment does not add

No NAT Gateway, Application Load Balancer, RDS, ECS, or EKS. MongoDB stays on Atlas. The existing Service Catalog portfolio, products, constraints, and `ServiceCatalogLaunchRole` stay as they are.
