# Subnet Core

A production-grade full-stack web application for managing network subnets and IP addresses. Built with NestJS, React, PostgreSQL, and Docker.

## Features

- **Authentication** — JWT-based registration, login, and refresh tokens with bcrypt password hashing; demo login button for quick access
- **Subnet Management** — Full CRUD with CIDR validation, utilization tracking, and visual capacity indicators
- **IP Address Management** — Create, edit, and delete individual IPs within subnets with CIDR range validation and status tracking (active / reserved / deprecated)
- **Automatic IP Reservation** — When a subnet is created, the network address, default gateway, and broadcast address are automatically reserved following real-world networking rules (see [Infrastructure IP Reservation](#infrastructure-ip-reservation))
- **Bulk CSV & JSON Import** — Upload subnets and IPs together in a single CSV or JSON file with row-level validation, grouped by CIDR (samples available in /samples)
- **Sorting & Pagination** — Server-side sorting on all list endpoints with clickable column headers and numbered rows
- **Audit Trail** — Every subnet and IP tracks `createdById` and `updatedById` from the authenticated user's JWT
- **Modern UI** — Network-ops themed dashboard with SVG donut charts, IP status distribution bars, sortable tables, and status-colored indicators
- **pgweb** — Built-in database viewer at http://localhost:8081 for browsing PostgreSQL directly

## Tech Stack

| Layer      | Technology                                                    |
|------------|---------------------------------------------------------------|
| Backend    | NestJS 10, TypeORM, Passport JWT, class-validator             |
| Frontend   | React 18, Vite, TanStack Query v5, React Hook Form, Zod      |
| Database   | PostgreSQL 16 with UUID primary keys                          |
| Infra      | Docker, Docker Compose, Nginx, pgweb                          |

## Quick Start with Docker

```bash
docker compose up --build
```

This starts:

| Service          | URL / Port                | Description                            |
|------------------|---------------------------|----------------------------------------|
| **PostgreSQL**   | port 5432                 | Database                               |
| **Backend API**  | http://localhost:3000     | REST API with Swagger docs at `/api/docs` |
| **Frontend**     | http://localhost          | React SPA (port 80)                    |
| **pgweb**        | http://localhost:8081     | Web-based PostgreSQL browser           |
| **Seed runner**  | one-shot container        | Creates demo user and sample data      |

### Demo Credentials

| Email              | Password     |
|--------------------|--------------|
| demo@example.com   | password123  |

The login page includes a **"Try Demo Account"** button that auto-fills these credentials and signs in.

## Infrastructure IP Reservation

When a subnet is created (via API, CSV import, or JSON import), the system automatically reserves infrastructure IP addresses that are not assignable to regular hosts in real IPv4 networking:

| Reserved IP          | Purpose                          | Example for `192.168.1.0/24` |
|----------------------|----------------------------------|------------------------------|
| **Network Address**  | Identifies the subnet itself     | `192.168.1.0`               |
| **Default Gateway**  | First usable address (router)    | `192.168.1.1`               |
| **Broadcast Address**| Broadcast traffic to all hosts   | `192.168.1.255`             |

These IPs are created with status `reserved` and are visible in the subnet's IP list. Users only need to manage the usable host addresses.

**Edge cases handled:**

- **/32** (single host) — No addresses reserved (the entire range is one host)
- **/31** (point-to-point link, RFC 3021) — No addresses reserved (both addresses are usable)
- **/30 and larger** — Network, gateway, and broadcast are reserved automatically

The seed data follows the same rules: each demo subnet includes the three reserved infrastructure IPs alongside its user-defined addresses.

## API Overview

All endpoints are prefixed with `/api`. Swagger docs are available at `localhost:3000/api/docs` when the backend is running.

### Authentication

| Method | Endpoint             | Auth | Description              |
|--------|----------------------|------|--------------------------|
| POST   | /api/auth/register   | No   | Register a new user      |
| POST   | /api/auth/login      | No   | Login with credentials   |
| POST   | /api/auth/refresh    | Yes  | Refresh access token     |
| POST   | /api/auth/logout     | Yes  | Invalidate refresh token |

### Users

| Method | Endpoint       | Auth | Description         |
|--------|----------------|------|---------------------|
| GET    | /api/users/me  | Yes  | Get current profile |

### Subnets

| Method | Endpoint           | Auth | Description              |
|--------|--------------------|------|--------------------------|
| GET    | /api/subnets       | Yes  | List subnets (paginated, sortable) |
| GET    | /api/subnets/:id   | Yes  | Get subnet by ID         |
| POST   | /api/subnets       | Yes  | Create subnet (auto-reserves infrastructure IPs) |
| PUT    | /api/subnets/:id   | Yes  | Update subnet            |
| DELETE | /api/subnets/:id   | Yes  | Delete subnet and its IPs |

### IP Addresses

| Method | Endpoint                       | Auth | Description                              |
|--------|--------------------------------|------|------------------------------------------|
| GET    | /api/ips                       | Yes  | List IPs (paginated, filterable, sortable) |
| GET    | /api/ips/:id                   | Yes  | Get IP by ID                             |
| POST   | /api/subnets/:subnetId/ips     | Yes  | Create IP in subnet                      |
| PUT    | /api/subnets/:subnetId/ips/:id | Yes  | Update IP metadata                       |
| DELETE | /api/subnets/:subnetId/ips/:id | Yes  | Delete IP                                |

IP addresses are validated against the parent subnet's CIDR range on creation. The address itself is immutable after creation — only metadata (name, description, status) can be updated.

### File Upload

| Method | Endpoint         | Auth | Description                              |
|--------|------------------|------|------------------------------------------|
| POST   | /api/upload      | Yes  | Upload CSV or JSON (auto-detected)       |
| POST   | /api/upload/csv  | Yes  | Upload CSV of subnets and/or IPs         |
| POST   | /api/upload/json | Yes  | Upload JSON of subnets and/or IPs        |

All upload endpoints accept `multipart/form-data` with a `file` field (max 5 MB). Infrastructure IPs (network, gateway, broadcast) are auto-reserved for each new subnet created during import.

### Sorting & Pagination

All list endpoints support query parameters:

| Parameter   | Default | Description                        |
|-------------|---------|------------------------------------|
| `page`      | 1       | Page number                        |
| `limit`     | 20      | Items per page                     |
| `sortBy`    | varies  | Column to sort by (whitelist-validated) |
| `sortOrder` | ASC     | Sort direction (`ASC` or `DESC`)   |

Pagination responses include total count so the frontend can display "Showing X – Y of Z items".

## Import Formats

Both CSV and JSON import support the same data model: subnets with optional nested IP addresses. Infrastructure IPs (network, gateway, broadcast) are auto-reserved for each new subnet — you do not need to include them in your import file.

Sample files are provided in the [`samples/`](samples/) directory:

- [`samples/sample.csv`](samples/sample.csv) — CSV import example
- [`samples/sample.json`](samples/sample.json) — JSON import example

### CSV Format

Rows with the same `cidr` are grouped into a single subnet.

**Example:**

```csv
cidr,name,description,ip,ip_name,ip_description,ip_status
10.0.1.0/24,Office LAN,Main office network,10.0.1.10,Web Server,Primary web server,active
10.0.1.0/24,,,10.0.1.50,Printer,Office printer,reserved
10.0.2.0/24,Server VLAN,Production servers,,,
```

- Rows 1 & 2 create (or group into) the "Office LAN" subnet with two user-defined IPs (plus 3 auto-reserved infrastructure IPs)
- Row 3 creates the "Server VLAN" subnet with only the auto-reserved infrastructure IPs

### JSON Format

An array of subnet objects, each with an optional `ips` array.


**Example:**

```json
[
  {
    "cidr": "10.0.1.0/24",
    "name": "Office LAN",
    "description": "Main office network",
    "ips": [
      { "address": "10.0.1.10", "name": "Web Server", "description": "Primary web server", "status": "active" },
      { "address": "10.0.1.50", "name": "Printer", "description": "Office printer", "status": "reserved" }
    ]
  },
  {
    "cidr": "10.0.2.0/24",
    "name": "Server VLAN",
    "description": "Production servers"
  }
]
```

## Design Decisions

1. **Clean Architecture** — Controllers handle HTTP, Services contain business logic, Repositories abstract data access. This separation enables independent testing and replacement of each layer.

2. **Repository Pattern** — Each entity has a dedicated repository class wrapping TypeORM, decoupling business logic from the ORM. Switching databases only requires repository changes.

3. **Factory + Strategy Pattern for File Parsing** — `ParserFactory` selects the right `FileParserStrategy` by MIME type. Adding new formats (XML, YAML) only requires a new strategy class — no changes to existing code (Open/Closed Principle). Currently supports CSV and JSON.

4. **Automatic Infrastructure IP Reservation** — When a subnet is created, the network address, default gateway, and broadcast address are automatically reserved. This mirrors real-world IPAM behavior where these addresses are non-assignable to hosts and prevents accidental assignment conflicts.

5. **Manual IP Management with CIDR Validation** — IPs are created individually (or via file import) rather than auto-generated. Each IP address is validated against the parent subnet's CIDR range at creation time, and the address is immutable afterward to preserve referential integrity.

6. **Full Audit Trail** — Both subnets and IPs track `createdById` and `updatedById`, extracted from the JWT token on every write operation. This provides accountability without a separate audit log table.

7. **Server-side Sorting with Column Whitelist** — Sort parameters are validated against an allowed column list to prevent SQL injection via `ORDER BY`. The frontend reflects sort state with visual arrow indicators on column headers.

8. **JWT with Refresh Tokens** — Short-lived access tokens (15m) paired with longer-lived refresh tokens (7d) balance security and UX. Refresh tokens are bcrypt-hashed in the database.


## Trade-offs & Improvements

### Current Trade-offs

- **synchronize: true** in TypeORM for development — In production, use proper migrations (`typeorm migration:generate` / `migration:run`).
- **In-memory file processing** — CSV and JSON files are parsed from the memory buffer. For very large files, streaming parsing would be more memory-efficient.
- **Single-process seed** — The seed script runs as a separate container. A more robust approach would use TypeORM migrations with seed hooks.

### Future Improvements
- [ ] Add CSV/JSON export functionality
- [ ] Implement subnet overlap detection
- [ ] Add Redis for caching frequently accessed data
- [ ] Implement proper database migrations for production
- [ ] Add YAML and XML import strategies via the parser factory