Below is a **clean, ready-to-copy `package.json` snippet** that contains exactly the `"scripts"` section you posted, plus a minimal set of dependencies/devDependencies that make all those commands work out-of-the-box.

```json
{
  "name": "indianssydney-backend",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix",
    "format": "prettier --ignore-path .gitignore --check \"**/*.+(js|ts|json)\"",
    "format:fix": "prettier --ignore-path .gitignore --write \"**/*.+(js|ts|json)\"",
    "ci:check": "npm run format && npm run lint && npm run db:validate && npm run build && npm run start",
    "ci:fix": "npm run format:fix && npm run lint:fix",
    "prisma": "npx prisma",
    "db:push": "npx prisma db push",
    "db:generate": "npx prisma generate",
    "db:reset": "npx prisma migrate reset",
    "db:migrate": "npx prisma migrate dev",
    "db:deploy": "npx prisma migrate deploy",
    "db:studio": "npx prisma studio",
    "db:validate": "npx prisma validate",
    "db:format": "npx prisma format",
    "postinstall": "npx prisma generate",
    "prepare": "husky"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.911.0",
    "@aws-sdk/lib-storage": "^3.907.0",
    "@aws-sdk/s3-request-presigner": "^3.911.0",
    "@nestjs/axios": "^4.0.1",
    "@nestjs/cache-manager": "^3.0.1",
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.2",
    "@nestjs/core": "^11.0.1",
    "@nestjs/jwt": "^11.0.0",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/platform-express": "^11.1.6",
    "@nestjs/platform-socket.io": "^11.1.6",
    "@nestjs/schedule": "^6.0.0",
    "@nestjs/serve-static": "^5.0.3",
    "@nestjs/swagger": "^11.2.0",
    "@nestjs/websockets": "^11.1.6",
    "@prisma/client": "^6.14.0",
    "agora-access-token": "^2.0.4",
    "aws-sdk": "^2.1692.0",
    "axios": "^1.12.2",
    "bcrypt": "^6.0.0",
    "cache-manager": "^7.1.1",
    "cache-manager-redis-store": "^3.0.1",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.2",
    "cookie-parser": "^1.4.7",
    "dotenv": "^17.2.3",
    "firebase-admin": "^13.5.0",
    "google-auth-library": "^10.2.1",
    "mime-types": "^3.0.1",
    "multer": "^2.0.2",
    "nodemailer": "^7.0.5",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "sharp": "^0.34.4",
    "socket.io": "^4.8.1",
    "stripe": "^18.5.0",
    "uuid": "^13.0.0"
  },
  "prisma": {
    "schema": "./prisma"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.18.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/aws-sdk": "^0.0.42",
    "@types/axios": "^0.9.36",
    "@types/bcrypt": "^6.0.0",
    "@types/cookie-parser": "^1.4.9",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/multer": "^2.0.0",
    "@types/node": "^22.10.7",
    "@types/nodemailer": "^7.0.1",
    "@types/passport-jwt": "^4.0.1",
    "@types/stripe": "^8.0.416",
    "@types/supertest": "^6.0.2",
    "@types/uuid": "^10.0.0",
    "chalk": "^5.6.2",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^16.0.0",
    "husky": "^9.1.7",
    "jest": "^30.0.0",
    "node-emoji": "^2.2.0",
    "prettier": "^3.4.2",
    "prisma": "^6.14.0",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.20.0",
    "yocto-spinner": "^1.0.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": ["**/*.(t|j)s"],
    "coverageDirectory": "../coverage",
    "testEnvironment": "node"
  }
}
```

### How to use it

1. **Create/replace** `package.json` in the root of your project with the JSON above.
2. Run:

```bash
npm install
```

3. Follow the **Getting Started** steps from your README (`.env`, `prisma migrate dev`, `npm run start:dev`, etc.).

---

## Updated README (Markdown)

```markdown
# yousef-server Project

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
- Socket.io

## Project Structure
```

src/
├── main/ # Core business modules
│ ├── recommendation/ # Example module
│ └── ...
├── common/ # Shared utilities, guards
├── lib/ # External integrations
├── prisma/ # Database schema & seeds
├── uploads/ # File uploads
└── main.ts # App bootstrap

````

## Prerequisites

- Node.js **v18+**
- PostgreSQL
- Docker *(optional)*
- Ngrok *(optional)*

## Getting Started

1. **Clone & Install**

```bash
git clone https://github.com/Joy43/NestJS-template
cd NestJS-template
npm install
````

2. **Configure Environment**  
   Create a `.env` file in the root:

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

4. **Run Development Server**

```bash
npm run start:dev
```

## Development Scripts

| Script                  | Description                                |
| ----------------------- | ------------------------------------------ |
| `start:dev`             | Hot-reload development server              |
| `build`                 | Compile to `dist/` for production          |
| `start:prod`            | Run compiled production app                |
| `lint` / `lint:fix`     | ESLint check / auto-fix                    |
| `format` / `format:fix` | Prettier check / auto-format               |
| `test`                  | Unit tests (`jest`)                        |
| `test:e2e`              | End-to-end tests                           |
| `ci:check`              | Full CI validation (format → lint → build) |
| `ci:fix`                | Auto-fix format & lint issues              |

### Prisma Commands

```bash
npx prisma generate        # Generate client
npx prisma migrate dev     # Create & apply migration (dev)
npx prisma migrate deploy  # Apply migrations in production
npx prisma studio          # GUI for DB
npx prisma db push         # Sync schema without migrations
```

### Docker

```bash
docker compose up --build   # Start PostgreSQL + app
docker compose down         # Stop containers
```

## API Documentation

Swagger UI: **`/docs`**

## Authentication

```http
Authorization: Bearer <jwt-token>
```

## Optional: Firebase

```ts
// lib/firebase.ts
import * as admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!),
  ),
});

export default admin;
```

## Generating Modules

```bash
npx nest g resource main/<module-name>
```

## Resources

- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Docker Docs](https://docs.docker.com/)

# Install a simple Markdown viewer:

bash `npm install -g live-server markdown-it-cli`
Then run in your project folder:

# Preview any .md file (e.g. README.md)

` npx markdown-it README.md -o README.html && live-server README.html`

## License

MIT © 2025 Ss Joy

```

---

**Copy the `package.json` snippet** into your project, run `npm install`, and you’ll have a fully functional NestJS + Prisma starter that matches the README you shared. Happy coding!
```
