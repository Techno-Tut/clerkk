# InBriefs Backend API

Digital PR Platform backend built with FastAPI and PostgreSQL.

## Architecture

```mermaid
graph TB
    Client[Client] --> API[FastAPI API]
    API --> Controllers[Controllers]
    Controllers --> Services[Services]
    Services --> Models[SQLAlchemy Models]
    Models --> DB[(PostgreSQL)]

    API --> Middleware[Request ID Middleware]
    API --> ErrorHandlers[Centralized Error Handlers]
    Services --> Logging[Structured Logging]
```

## Database Schema

```mermaid
erDiagram
    users ||--o{ organizations : creates
    organizations ||--|| wallets : has
    organizations ||--o{ ledger : has
    organizations ||--o{ campaigns : has
    organizations ||--o{ payment_transactions : has

    products ||--o{ pricing_plans : has
    product_types ||--o{ products : categorizes
    categories ||--o{ pricing_plans : categorizes
    categories ||--o{ bundle_plans : categorizes

    bundles ||--o{ bundle_plans : has

    campaigns ||--o{ campaign_items : contains
    campaign_items }o--|| pricing_plans : references
    campaign_items }o--|| bundle_plans : references

    campaigns ||--o{ executions : creates

    wallets ||--o{ ledger : tracks
    payment_transactions }o--|| ledger : creates

    users {
        string user_id PK
        string email
        string name
        boolean is_active
    }

    organizations {
        string organization_id PK
        string name
        string organization_type
        string country
        string created_by FK
    }

    wallets {
        string wallet_id PK
        string organization_id FK
        numeric balance
        string currency
    }

    ledger {
        string ledger_id PK
        string organization_id FK
        string wallet_id FK
        datetime transaction_date
        string transaction_type
        numeric debit
        numeric credit
        numeric balance_after
        string campaign_id FK
        string invoice_id
    }

    payment_transactions {
        string transaction_id PK
        string organization_id FK
        string gateway
        string gateway_order_id
        numeric amount
        string status
        string ledger_id FK
    }

    products {
        integer product_id PK
        integer product_type_id FK
        string name
        string domain
        string credibility_tier
        numeric trust_score
        jsonb stats
    }

    product_types {
        integer product_type_id PK
        string name
    }

    categories {
        string category_id PK
        string name
    }

    pricing_plans {
        string pricing_plan_id PK
        integer reference_id
        integer product_id FK
        string category_id FK
        string plan_name
        numeric rate
        string language
        boolean is_organic
        boolean includes_social_media
    }

    bundles {
        string bundle_id PK
        string name
        text description
    }

    bundle_plans {
        string bundle_plan_id PK
        string bundle_id FK
        integer reference_id
        string plan_name
        string category_id FK
        integer price
        string language
        boolean is_organic
        boolean includes_social_media
        string network_coverage
    }

    campaigns {
        string campaign_id PK
        string organization_id FK
        string title
        text content
        string status
        numeric budget
    }

    campaign_items {
        string campaign_item_id PK
        string campaign_id FK
        string pricing_plan_id FK
        string bundle_plan_id FK
        numeric price
    }

    executions {
        string execution_id PK
        string campaign_id FK
        string status
        string published_url
        datetime published_at
    }
```

## Key Features

### Business Rules
- Users can only belong to **one active organization**
- Database constraints enforce rules at data layer
- Partial unique constraint: `(user_id, is_active=TRUE)`


## Quick Start

```bash
# Start backend and database
docker-compose up --build -d backend

# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

## API Examples

```bash
# Create user
curl -X POST "http://localhost:8000/users/" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'

# Create organization
curl -X POST "http://localhost:8000/organizations/?owner_id=USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Agency", "organization_type": "AGENCY"}'
```

## Tech Stack

- **FastAPI** - Web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM
- **Docker** - Containerization
