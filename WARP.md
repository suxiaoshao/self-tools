# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a full-stack monorepo containing personal tools with a microservices architecture:

- **Backend**: Rust microservices using Axum (GraphQL) and Volo (Thrift)
- **Frontend**: React packages with Module Federation and RSBuild
- **Database**: PostgreSQL
- **Infrastructure**: Docker Compose deployment

## Development Commands

### Frontend Development
```bash
# Install dependencies
pnpm install

# Start development server (portal with hot reload)
cd web/packages/portal && pnpm dev

# Build all frontend packages
pnpm build

# Lint and format
pnpm lint
pnpm format

# Run tests
pnpm test
```

### Backend Development
```bash
# Build all Rust services
cargo build

# Run a specific service in development
cd server/packages/bookmarks && cargo run

# Build and run with Docker
./scripts/build.sh
./scripts/compose.sh
```

### GraphQL Code Generation
```bash
# Generate GraphQL types for bookmarks
cd web/packages/bookmarks && pnpm generate

# Generate GraphQL types for collections  
cd web/packages/collections && pnpm generate
```

## Architecture

### Backend Services
- **auth**: Thrift service on port 80 for authentication
- **login**: GraphQL service for login functionality  
- **bookmarks**: GraphQL service on port 8080 for bookmark management
- **collections**: GraphQL service for collection management

All GraphQL services use:
- Axum web framework
- async-graphql for GraphQL implementation
- Diesel ORM for PostgreSQL
- Middleware for CORS and tracing

### Frontend Architecture
- **portal**: Main React application using Module Federation
- **bookmarks**: Federated module for bookmark functionality
- **collections**: Federated module for collections functionality

Key frontend technologies:
- RSBuild for bundling with React Compiler
- Module Federation for micro-frontends
- Material-UI components
- Apollo Client for GraphQL
- React Hook Form with Valibot validation

### Database Schema
PostgreSQL database shared across services:
- Each service connects independently
- Database migrations handled per service
- Connection pooling with r2d2

## Common Development Patterns

### Adding a New Backend Service
1. Create new package in `server/packages/`
2. Add to workspace in root `Cargo.toml`
3. Implement GraphQL schema with async-graphql
4. Add database models using Diesel
5. Create Docker build script in `docker/server/`
6. Update `docker-compose.yml`

### Adding a New Frontend Package
1. Create package in `web/packages/` or `web/common/`
2. Add to pnpm workspace in `pnpm-workspace.yaml`
3. Configure RSBuild if standalone app
4. Set up Module Federation if federated module
5. Add GraphQL codegen config if using GraphQL

### GraphQL Integration
- Backend exposes GraphQL endpoints at `/graphql`
- Frontend uses Apollo Client with generated TypeScript types
- Schema introspection configured in `graphql.config.yml`
- Authentication via Authorization header

## Testing

### Frontend Tests
- Jest with SWC for transformation
- Testing Library for React components  
- jsdom test environment
- Run with `pnpm test`

### Backend Tests
- Standard Rust testing with `cargo test`
- Integration tests per service
- Database testing with test containers

## Docker Development

### Local Development
```bash
# Start all services
./scripts/compose.sh

# Build all Docker images
./scripts/build.sh
```

### Service URLs (when running with Docker)
- Web: https://localhost (with SSL)
- Auth: Internal Thrift service
- Login: Internal GraphQL service  
- Bookmarks: Internal GraphQL service
- Collections: Internal GraphQL service
- PostgreSQL: localhost:5432

## Code Organization

### Shared Libraries
- `server/common/graphql-common`: GraphQL utilities and pagination
- `server/common/middleware`: CORS, tracing, and GraphQL middleware
- `server/common/thrift`: Thrift service definitions
- `server/common/novel_crawler`: Novel crawling utilities

### Frontend Common Packages
- `web/common/custom-graphql`: GraphQL components and hooks
- `web/common/custom-table`: Reusable table components
- `web/common/i18n`: Internationalization utilities
- `web/common/notify`: Notification system
- `web/common/time`: Time formatting utilities

## Environment Configuration

Services expect these environment variables:
- Database connection strings
- Authentication tokens
- Service URLs

Environment files:
- `.env` in Docker compose directory for production
- Use `dotenv` crate for development in Rust services
