# NestJS Template Project

A production-ready NestJS template with Prisma ORM, Docker support, JWT authentication, and modular structure.

## Features

- Prisma ORM integration
- JWT authentication
- Docker support
- Modular architecture
- Swagger API docs
- Firebase integration (optional)
- File upload handling
- Environment configuration
- Test setup
- Socket io

## Project Structure

```
src/
├── main/              # Core business modules
│   ├── recommendation/ # Example module
│   └── ...
├── common/           # Shared utilities, guards
├── lib/             # External integrations
├── prisma/          # Database schema & seeds
├── uploads/         # File uploads
└── main.ts          # App bootstrap
```

## Prerequisites

- Node.js v18+
- PostgreSQL
- Docker (optional)
- Ngrok (optional)

## Getting Started

1. **Clone and Install**

```bash
git clone https://github.com/Joy43/NestJS-template
cd nestjs-template
npm install
```

2. **Configure Environment**
   Create .env file:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nest_template"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRATION="7d"
PORT=5000
NODE_ENV=development
```

3. **Database Setup**

```bash
npx prisma generate
npx prisma migrate dev
```

4. **Start Development Server**

```bash
npm run start:dev
```

## Development

### Available Scripts

- `npm run start:dev` - Development with hot reload
- `npm run build` - Production build
- `npm run start:prod` - Production server
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run E2E tests

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

### Docker Support

```bash
# Start containers
docker compose up --build

# Stop containers
docker compose down
```

## API Documentation

Swagger UI available at `/docs` endpoint.

## Authentication

Use bearer token:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Additional Features

### Firebase Setup

```ts
// lib/firebase.ts
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT),
  ),
});

export default admin;
```

### Generate New Module

```bash
npx nest g resource main/example
```

## Resources

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Docker Docs](https://docs.docker.com/)

## License

MIT © 2025 Ss Joy
