# Azure Tenant Migration — SYB2.0

> **Purpose**: Recreate all SYB2.0 infrastructure in a new Azure tenant with an active subscription.
> Optimized for minimal cost (~$5/month). No SLA or performance requirements.

---

## 1. Architecture Overview

SYB2.0 runs as a .NET 9 App Service (Linux, F1 Free tier) serving both the API and the React SPA (built into `wwwroot/`). It connects to an Azure SQL Database (Basic 5 DTU) for persistence. Application Insights (workspace-based, backed by a Log Analytics Workspace) provides observability. All resources live in **Norway East** within a single resource group.

CI/CD is handled by GitHub Actions using OIDC (federated credentials) — no stored passwords or service principal secrets.

---

## 2. Resource Naming

| Resource | Old Name | New Name | Globally Unique? |
|----------|----------|----------|-------------------|
| Resource Group | `syb` | `syb-rg` | No |
| SQL Server | `syb` | `syb-sql` | Yes — append random suffix if taken |
| SQL Database | `syb` | `syb-db` | No (scoped to server) |
| App Service Plan | `syb-sp` | `syb-plan` | No (scoped to RG) |
| App Service | `zyb` | `syb-app` | Yes — must be unique across Azure |
| Log Analytics Workspace | _(none)_ | `syb-logs` | No (scoped to RG) |
| Application Insights | `zyb` | `syb-insights` | No (scoped to RG) |

> If `syb-sql` or `syb-app` are taken, append a short random suffix (e.g. `syb-sql-7k3`, `syb-app-7k3`).
> Update all references below accordingly.

---

## 3. Azure CLI Script Blocks

### Prerequisites

- Azure CLI >= 2.60 installed (`az --version`)
- Logged in to the **new** tenant
- An active subscription in the new tenant

### 3.1 — Login & Set Subscription

```bash
# Replace with your actual tenant and subscription IDs
NEW_TENANT_ID="<your-new-tenant-id>"
NEW_SUBSCRIPTION_ID="<your-new-subscription-id>"

az login --tenant "$NEW_TENANT_ID"
az account set --subscription "$NEW_SUBSCRIPTION_ID"

# Verify
az account show --query "{name:name, id:id, tenantId:tenantId}" -o table
```

### 3.2 — Register Resource Providers

New subscriptions don't have resource providers registered by default. Register all providers used by this stack:

```bash
az provider register --namespace Microsoft.Sql --wait
az provider register --namespace Microsoft.Web --wait
az provider register --namespace Microsoft.Insights --wait
az provider register --namespace Microsoft.OperationalInsights --wait
```

> `--wait` blocks until registration completes (~1-2 minutes each). You can check status with:
> ```bash
> az provider show --namespace Microsoft.Sql --query "registrationState" -o tsv
> ```

### 3.3 — Create Resource Group

```bash
az group create \
  --name syb-rg \
  --location norwayeast
```

### 3.4 — Create SQL Server

```bash
# Set your SQL admin credentials
SQL_ADMIN_USER="sybadmin"
SQL_ADMIN_PASSWORD="<CHOOSE-A-STRONG-PASSWORD>"   # Min 8 chars, upper+lower+digit+special

az sql server create \
  --name syb-sql \
  --resource-group syb-rg \
  --location norwayeast \
  --admin-user "$SQL_ADMIN_USER" \
  --admin-password "$SQL_ADMIN_PASSWORD"
```

> **If `syb-sql` is taken**, the command will fail with a naming conflict. Pick a unique name (e.g. `syb-sql-7k3`) and use it everywhere below.

### 3.5 — Create SQL Database (Basic 5 DTU — ~$5/month)

```bash
az sql db create \
  --name syb-db \
  --resource-group syb-rg \
  --server syb-sql \
  --edition Basic \
  --capacity 5 \
  --max-size 2GB
```

> **Basic 5 DTU** is the cheapest tier at ~$4.90/month. Max 2GB storage. Sufficient for this workload.

### 3.6 — SQL Firewall: Allow Azure Services

This rule allows other Azure services (like App Service) to connect to SQL Server. It does **not** open the server to the public internet.

```bash
az sql server firewall-rule create \
  --name AllowAzureServices \
  --resource-group syb-rg \
  --server syb-sql \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

> **Optional — Allow your local IP for debugging**:
> ```bash
> MY_IP=$(curl -s https://ifconfig.me)
> az sql server firewall-rule create \
>   --name AllowMyIP \
>   --resource-group syb-rg \
>   --server syb-sql \
>   --start-ip-address "$MY_IP" \
>   --end-ip-address "$MY_IP"
> ```

### 3.7 — Create App Service Plan (F1 Free Tier, Linux)

```bash
az appservice plan create \
  --name syb-plan \
  --resource-group syb-rg \
  --location norwayeast \
  --sku F1 \
  --is-linux
```

> **F1 limitations**: 60 CPU-minutes/day, 1GB RAM, 1GB disk, no custom domain SSL, no always-on, no deployment slots. Fine for a rarely-used hobby project.

### 3.8 — Create App Service (.NET 9, Linux)

```bash
az webapp create \
  --name syb-app \
  --resource-group syb-rg \
  --plan syb-plan \
  --runtime "DOTNETCORE:9.0"
```

> If `syb-app` is taken, pick a unique name and update the workflow YAML `app-name` accordingly.

### 3.9 — Create Log Analytics Workspace

```bash
az monitor log-analytics workspace create \
  --workspace-name syb-logs \
  --resource-group syb-rg \
  --location norwayeast
```

> Uses the default **PerGB2018** (pay-as-you-go) tier. The legacy Free tier has been retired.
> At hobby-project volumes this costs $0 — you'd need to ingest multiple GB/month before charges apply.

### 3.10 — Create Application Insights (Workspace-Based)

```bash
# Get the Log Analytics workspace resource ID
LOGS_ID=$(az monitor log-analytics workspace show \
  --workspace-name syb-logs \
  --resource-group syb-rg \
  --query id -o tsv)

az monitor app-insights component create \
  --app syb-insights \
  --resource-group syb-rg \
  --location norwayeast \
  --kind web \
  --application-type web \
  --workspace "$LOGS_ID"
```

### 3.11 — Configure App Service Settings

#### Connection String

```bash
# Build the connection string
CONN_STRING="Server=tcp:syb-sql.database.windows.net,1433;Initial Catalog=syb-db;Persist Security Info=False;User ID=${SQL_ADMIN_USER};Password=${SQL_ADMIN_PASSWORD};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

az webapp config connection-string set \
  --name syb-app \
  --resource-group syb-rg \
  --connection-string-type SQLAzure \
  --settings DefaultConnection="$CONN_STRING"
```

#### Application Insights Instrumentation

```bash
# Get the instrumentation key and connection string
AI_CONN=$(az monitor app-insights component show \
  --app syb-insights \
  --resource-group syb-rg \
  --query connectionString -o tsv)

az webapp config appsettings set \
  --name syb-app \
  --resource-group syb-rg \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="$AI_CONN" \
    ApplicationInsightsAgent_EXTENSION_VERSION="~3"
```

### 3.12 — Output Summary

```bash
echo ""
echo "========================================="
echo "  SYB2.0 Infrastructure — Created"
echo "========================================="
echo ""
echo "Resource Group:   syb-rg"
echo "SQL Server:       syb-sql.database.windows.net"
echo "SQL Database:     syb-db"
echo "SQL Admin User:   $SQL_ADMIN_USER"
echo "App Service Plan: syb-plan (F1 Free)"
echo "App Service:      syb-app"
echo "App URL:          https://syb-app.azurewebsites.net"
echo "App Insights:     syb-insights"
echo "Log Analytics:    syb-logs"
echo ""
echo "Tenant ID:        $NEW_TENANT_ID"
echo "Subscription ID:  $NEW_SUBSCRIPTION_ID"
echo ""
echo "Next step: Set up OIDC via Azure Portal (Section 4)"
echo "========================================="
```

---

## 4. OIDC Auth Setup (Portal-Driven)

GitHub Actions authenticates to Azure using **OIDC federated credentials** — no client secrets stored. The Azure Portal Deployment Center wizard handles the Entra ID app registration automatically.

### Step-by-step

1. **Open Azure Portal** → Navigate to **App Services** → **syb-app**

2. Go to **Deployment Center** (left sidebar, under "Deployment")

3. Under **Source**, select **GitHub**

4. **Authorize** Azure to access your GitHub account if prompted

5. Configure the deployment:
   - **Organization**: Your GitHub org/username
   - **Repository**: `SYB2.0` (or whatever the repo is named)
   - **Branch**: `main`

6. Azure will show a preview of a workflow file it wants to create. **Do NOT save/commit this file** — we already have our own workflow. Just let the wizard complete so it creates the Entra ID resources.

7. Click **Save**. Azure will:
   - Create an **Entra ID App Registration** with a federated credential for your GitHub repo
   - Push three secrets to your GitHub repository:
     - `AZUREAPPSERVICE_CLIENTID_<GUID>`
     - `AZUREAPPSERVICE_TENANTID_<GUID>`
     - `AZUREAPPSERVICE_SUBSCRIPTIONID_<GUID>`
   - Possibly push a new workflow `.yml` file to the repo

8. **If Azure pushed a workflow file**: Delete it from the repo (it will be a new `.yml` file, not our existing `main_zyb.yml`)

9. **Rename the GitHub secrets** to clean names:
   - Go to **GitHub** → **Settings** → **Secrets and variables** → **Actions**
   - For each GUID-suffixed secret, create a new secret with the clean name and the same value, then delete the old one:

   | Old (auto-generated) | New (clean) |
   |----------------------|-------------|
   | `AZUREAPPSERVICE_CLIENTID_<GUID>` | `AZURE_CLIENT_ID` |
   | `AZUREAPPSERVICE_TENANTID_<GUID>` | `AZURE_TENANT_ID` |
   | `AZUREAPPSERVICE_SUBSCRIPTIONID_<GUID>` | `AZURE_SUBSCRIPTION_ID` |

   > GitHub doesn't support renaming secrets — you must create new ones and delete the old ones.

10. **Delete the old GUID-suffixed secrets** after creating the clean-named ones.

11. **Also delete the old secrets** from the previous tenant (the ones referenced in the current workflow) — they point to a disabled subscription and will never work again.

---

## 5. GitHub Secrets Summary

After completing Section 4, your GitHub repo should have exactly these 3 secrets:

| Secret Name | Value Source | Where to Find It |
|-------------|-------------|-------------------|
| `AZURE_CLIENT_ID` | Auto-pushed by Portal wizard | Portal → Entra ID → App registrations → the auto-created app → Application (client) ID |
| `AZURE_TENANT_ID` | Auto-pushed by Portal wizard | Portal → Entra ID → Overview → Tenant ID |
| `AZURE_SUBSCRIPTION_ID` | Auto-pushed by Portal wizard | Portal → Subscriptions → your subscription → Subscription ID |

**Verification**: Go to GitHub → repo → Settings → Secrets and variables → Actions. You should see exactly `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`. No GUID-suffixed secrets should remain.

---

## 6. GitHub Actions Workflow Changes

File: `.github/workflows/main_zyb.yml`

### 6.1 — Update workflow name

```yaml
# Old:
name: Build and deploy ASP.Net Core app to Azure Web App - zyb

# New:
name: Build and deploy ASP.Net Core app to Azure Web App - syb-app
```

### 6.2 — Update secret references (deploy job, Login to Azure step)

```yaml
# Old:
client-id: ${{ secrets.AZUREAPPSERVICE_CLIENTID_A7BA27AA100041C1A6A5A3C4938B762C }}
tenant-id: ${{ secrets.AZUREAPPSERVICE_TENANTID_A169E49015794711B36E558487D24104 }}
subscription-id: ${{ secrets.AZUREAPPSERVICE_SUBSCRIPTIONID_D1F85B0B6D6D4186A9E8E7403BD9314A }}

# New:
client-id: ${{ secrets.AZURE_CLIENT_ID }}
tenant-id: ${{ secrets.AZURE_TENANT_ID }}
subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
```

### 6.3 — Update app-name (deploy job, Deploy step)

```yaml
# Old:
app-name: 'zyb'

# New:
app-name: 'syb-app'
```

### 6.4 — (Optional) Switch to Ubuntu runners

The workflow currently uses `windows-latest` for both build and deploy jobs. Since the target is a Linux App Service, `ubuntu-latest` works fine and is slightly faster. The `dotnet publish` path (`${{env.DOTNET_ROOT}}/myapp`) works on both OSes.

```yaml
# Optional change for both jobs:
runs-on: ubuntu-latest
```

> This is optional. Windows runners deploy to Linux App Service without issues.

---

## 7. Cost Breakdown

| Resource | SKU / Tier | Monthly Cost |
|----------|-----------|-------------|
| App Service Plan | F1 (Free) | $0 |
| SQL Database | Basic (5 DTU, 2GB) | ~$4.90 |
| Application Insights | Free (up to 5GB/month) | $0 |
| Log Analytics Workspace | PerGB2018 (free at low volume) | $0 |
| Entra ID (App Registration) | Free | $0 |
| **Total** | | **~$5/month** |

### F1 Free Tier Limitations

| Constraint | Limit |
|-----------|-------|
| CPU time | 60 minutes/day |
| Memory | 1 GB |
| Disk | 1 GB |
| Custom domain SSL | Not available |
| Deployment slots | Not available |
| Always-on | Not available |
| Scale out | Not available |

This is fine for a hobby project that is "very rarely used" with no SLA requirements.

### Scaling Up Later

If you outgrow F1, the next tier up is **B1 Basic** (~$13/month) which removes all the above limitations and adds always-on, custom domains with SSL, and manual scaling.

---

## 8. Verification Checklist

Run through this after completing all sections:

- [ ] **Infrastructure exists**:
  ```bash
  az group show --name syb-rg --query "{name:name, location:location}" -o table
  az webapp show --name syb-app --resource-group syb-rg --query "{name:name, state:state, defaultHostName:defaultHostName}" -o table
  az sql db show --name syb-db --resource-group syb-rg --server syb-sql --query "{name:name, edition:edition, status:status}" -o table
  ```

- [ ] **GitHub secrets are clean**: Exactly 3 secrets — `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID`. No GUID-suffixed leftovers.

- [ ] **Workflow updated**: `main_zyb.yml` references clean secret names and `app-name: 'syb-app'`

- [ ] **Pipeline passes**: Push a commit to `main` (or trigger via `workflow_dispatch`) and verify the GitHub Actions run completes green (both build and deploy jobs).

- [ ] **App loads**: Open `https://syb-app.azurewebsites.net` in a browser. The React SPA should render.

- [ ] **Database connected**: EF Core auto-applies migrations on startup. If the app loads and the login page works, SQL connectivity is confirmed. You can also check App Service logs:
  ```bash
  az webapp log tail --name syb-app --resource-group syb-rg
  ```

- [ ] **Application Insights receiving data**: Portal → syb-insights → Live Metrics. Make a request to the app and confirm telemetry appears.

---

## 9. Rollback / Teardown

If something goes wrong and you need to start over, one command deletes everything:

```bash
az group delete --name syb-rg --yes --no-wait
```

This deletes the resource group and **all resources inside it**. The Entra ID app registration is NOT inside the resource group — delete it separately if needed:

```bash
# Find and delete the app registration
APP_ID=$(az ad app list --display-name "syb-app" --query "[0].appId" -o tsv)
az ad app delete --id "$APP_ID"
```

---

## 10. Full Script (Copy-Paste Ready)

Below is the complete script for Sections 3.1–3.11 combined. Set the variables at the top and run it.

```bash
#!/bin/bash
set -euo pipefail

# ============================================================
#  CONFIGURATION — Set these before running
# ============================================================
NEW_TENANT_ID="<your-new-tenant-id>"
NEW_SUBSCRIPTION_ID="<your-new-subscription-id>"
SQL_ADMIN_USER="sybadmin"
SQL_ADMIN_PASSWORD="<CHOOSE-A-STRONG-PASSWORD>"

# Resource names (change if globally unique names are taken)
RG_NAME="syb-rg"
SQL_SERVER="syb-sql"
SQL_DB="syb-db"
APP_PLAN="syb-plan"
APP_NAME="syb-app"
LOG_WORKSPACE="syb-logs"
APP_INSIGHTS="syb-insights"
LOCATION="norwayeast"

# ============================================================
#  LOGIN
# ============================================================
az login --tenant "$NEW_TENANT_ID"
az account set --subscription "$NEW_SUBSCRIPTION_ID"
echo "Logged in. Subscription: $(az account show --query name -o tsv)"

# ============================================================
#  REGISTER RESOURCE PROVIDERS
# ============================================================
echo "Registering resource providers (this takes ~1-2 min each)..."
az provider register --namespace Microsoft.Sql --wait
az provider register --namespace Microsoft.Web --wait
az provider register --namespace Microsoft.Insights --wait
az provider register --namespace Microsoft.OperationalInsights --wait
echo "All providers registered."

# ============================================================
#  RESOURCE GROUP
# ============================================================
az group create --name "$RG_NAME" --location "$LOCATION"

# ============================================================
#  SQL SERVER + DATABASE
# ============================================================
az sql server create \
  --name "$SQL_SERVER" \
  --resource-group "$RG_NAME" \
  --location "$LOCATION" \
  --admin-user "$SQL_ADMIN_USER" \
  --admin-password "$SQL_ADMIN_PASSWORD"

az sql db create \
  --name "$SQL_DB" \
  --resource-group "$RG_NAME" \
  --server "$SQL_SERVER" \
  --edition Basic \
  --capacity 5 \
  --max-size 2GB

az sql server firewall-rule create \
  --name AllowAzureServices \
  --resource-group "$RG_NAME" \
  --server "$SQL_SERVER" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# ============================================================
#  APP SERVICE
# ============================================================
az appservice plan create \
  --name "$APP_PLAN" \
  --resource-group "$RG_NAME" \
  --location "$LOCATION" \
  --sku F1 \
  --is-linux

az webapp create \
  --name "$APP_NAME" \
  --resource-group "$RG_NAME" \
  --plan "$APP_PLAN" \
  --runtime "DOTNETCORE:9.0"

# ============================================================
#  OBSERVABILITY
# ============================================================
az monitor log-analytics workspace create \
  --workspace-name "$LOG_WORKSPACE" \
  --resource-group "$RG_NAME" \
  --location "$LOCATION"

LOGS_ID=$(az monitor log-analytics workspace show \
  --workspace-name "$LOG_WORKSPACE" \
  --resource-group "$RG_NAME" \
  --query id -o tsv)

az monitor app-insights component create \
  --app "$APP_INSIGHTS" \
  --resource-group "$RG_NAME" \
  --location "$LOCATION" \
  --kind web \
  --application-type web \
  --workspace "$LOGS_ID"

# ============================================================
#  APP CONFIGURATION
# ============================================================
CONN_STRING="Server=tcp:${SQL_SERVER}.database.windows.net,1433;Initial Catalog=${SQL_DB};Persist Security Info=False;User ID=${SQL_ADMIN_USER};Password=${SQL_ADMIN_PASSWORD};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"

az webapp config connection-string set \
  --name "$APP_NAME" \
  --resource-group "$RG_NAME" \
  --connection-string-type SQLAzure \
  --settings DefaultConnection="$CONN_STRING"

AI_CONN=$(az monitor app-insights component show \
  --app "$APP_INSIGHTS" \
  --resource-group "$RG_NAME" \
  --query connectionString -o tsv)

az webapp config appsettings set \
  --name "$APP_NAME" \
  --resource-group "$RG_NAME" \
  --settings \
    APPLICATIONINSIGHTS_CONNECTION_STRING="$AI_CONN" \
    ApplicationInsightsAgent_EXTENSION_VERSION="~3"

# ============================================================
#  SUMMARY
# ============================================================
echo ""
echo "========================================="
echo "  SYB2.0 Infrastructure — Created"
echo "========================================="
echo ""
echo "Resource Group:   $RG_NAME"
echo "SQL Server:       ${SQL_SERVER}.database.windows.net"
echo "SQL Database:     $SQL_DB"
echo "SQL Admin User:   $SQL_ADMIN_USER"
echo "App Service Plan: $APP_PLAN (F1 Free)"
echo "App Service:      $APP_NAME"
echo "App URL:          https://${APP_NAME}.azurewebsites.net"
echo "App Insights:     $APP_INSIGHTS"
echo "Log Analytics:    $LOG_WORKSPACE"
echo ""
echo "Tenant ID:        $NEW_TENANT_ID"
echo "Subscription ID:  $NEW_SUBSCRIPTION_ID"
echo ""
echo "Next step: Set up OIDC via Azure Portal (Section 4)"
echo "========================================="
```

> After running this script, proceed to **Section 4** (Portal-based OIDC setup), then **Section 6** (YAML changes), then **Section 8** (verification).
