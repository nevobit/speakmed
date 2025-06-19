# Applications Monorepo

This monorepo houses a comprehensive ecosystem of Node.js applications, services, and shared packages.

## Project Structure

- `.vscode/`: VS Code configurations
- `apps/`: Main applications
- `lambdas/`: AWS Lambda functions
- `legacy/`: Legacy code
- `node_modules/`: Node.js dependencies
- `packages/`: Shared packages and modules
  - `business-logic/`: Core business rules and logic
  - `constant-definitions/`: Shared constants
  - `core-modules/`: Essential shared modules
  - `data-sources/`: Data access and integration layers
  - `design-system/`: UI component library and styles
  - `entities/`: Domain entities and models
  - `eslint-config/`: Shared ESLint configurations
  - `tools/`: Utility functions and helper tools
  - `typescript-config/`: Shared TypeScript configurations
  - `ui/`: Reusable UI components
- `playgrounds/`: Development and testing environments
- `templates/`: Project templates for new components

## Configuration Files

- `.gitignore`: Git ignore rules
- `.node-version`: Node.js version specification
- `.npmrc`: npm configuration
- `commitlint.config.js`: Commit message linting rules
- `docker-compose.yml`: Docker services configuration
- `package.json`: Project metadata and scripts
- `pnpm-lock.yaml`: pnpm dependency lock file
- `pnpm-workspace.yaml`: pnpm workspace configuration
- `pull_request_template.md`: PR template for contributors
- `turbo.json`: Turborepo configuration

## Key Technologies

- Backend: Node.js with Fastify
- Frontend: React (Web), NextJs and React Native (Mobile)
- Database: MongoDB with Mongoose or Postgresql with Drizzle
- Caching: Redis
- Client State Management: React Query
- Authentication: JWT with refresh tokens
- ORM: Mongoose (with custom configuration for UUIDs) or Drizzle ORM
- API Documentation: Swagger/OpenAPI
- Containerization: Docker
- Package Management: pnpm

## Core Features

- Monorepo architecture for efficient code sharing and development
- Multi-tenant system based on subdomains
- Cursor-based pagination for efficient data retrieval
- Centralized and customizable logging system
- UUID-based IDs for Mongoose models
- Comprehensive authentication system with JWT and refresh tokens
- React Query integration for optimized state management and server synchronization
- Docker containerization for consistent development and deployment environments
- Redis integration for caching and session management


## Getting Started

1. Install dependencies:
    ```
    pnpm install
    ```
2. Set up environment variables:
   - Copy `.env.example` to `.env` in each application directory (api, web, mobile)
   - Adjust variables as needed
3. Start Docker containers:
    ```
    docker-compose up -d
    ```
4. Start development servers:
    ```
    pnpm run dev
    ```

## Development Workflow

- Use `pnpm` for package management
- Follow the commit message format specified in `commitlint.config.js`
- Utilize the shared configurations in `packages/` for consistent code style and quality
- Use the custom logger from `core-modules` for all logging
- Implement new database models in `packages/entities` using the UUID plugin
- Use the pagination service in `core-modules` for list queries
- Implement business logic in `packages/business-logic`
- Develop reusable UI components in `packages/ui`
- Use Docker for local development and testing

## API Development

- Use Fastify for route handling
- Implement new routes in `apps/api/src/routes/`
- Use the `subdomainTenantIdentifier` hook for multi-tenant support
- Utilize Mongoose with the custom UUID configuration for database operations
- Integrate Redis for caching and session management

## Frontend Development

- Use React Query for state management and API interactions
- Implement authentication flows using the provided JWT services
- Utilize shared UI components from `packages/ui`

## Testing

- Write unit tests for all new features
- Use the provided testing utilities in `packages/tools`
- Run tests using:
    ```
    pnpm run test
    ```

## Docker Usage

- Use `docker-compose up` to start all services
- Refer to `docker-compose.yml` for service configurations
- Ensure all environment variables are set correctly in `.env` files and Docker configurations

## Contributing

Please refer to `pull_request_template.md` when submitting contributions. Ensure all code adheres to the shared ESLint and TypeScript configurations.

## License

See `LICENSE` file for details.

## Additional Information

For more details on specific packages or applications, refer to their individual README files within their respective directories.