






## 📖 Documentation Links

- **[Real time near by garage location](./docs/garage-location-api-docs.md)** - Start here if you're building a frontend
- **[notification event Guide](./docs/event_system_docs.md)** - Real-time notification details
- **[privateChat](./docs/private-chat.md)** - Real time chat message
- **[masud rana](./docs/changelog.masudrana.md)** - Code change masud Rana


## 📦 Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Start the server
npm run start:dev
```
## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

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

Made with ❤️ by Team Dev Ninja

```

---

**Copy the `package.json` snippet** into your project, run `npm install`, and you’ll have a fully functional NestJS + Prisma starter that matches the README you shared. Happy coding!
```
