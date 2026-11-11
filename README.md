# solar-flow-system

## Frontend

Frontend SolarFlow розроблено на Astro з підтримкою інтерактивних компонентів React, Vue та Svelte.

Для обміну станом між компонентами використовується Nano Stores, а для взаємодії з backend — REST API Client.

### Локальний запуск

Перейдіть у директорію frontend та встановіть залежності:

```powershell
cd frontend
npm install
```

Запустіть сервер розробки:

```powershell
npm run dev
```

За стандартних налаштувань застосунок буде доступний за адресою `http://localhost:4321`.

### Перевірка та тестування

Команди виконуються з директорії `frontend`:

```powershell
npx astro check
npm test
npm run build
```

### Налаштування API

Для підключення до локального backend створіть файл `frontend/.env`:

```env
PUBLIC_API_URL=http://localhost:5106
```

Адреса API повинна відповідати порту, на якому запущено backend. Для роботи запитів із браузера backend має дозволяти відповідне джерело через CORS.

Детальний опис архітектури, структури frontend, маршрутизації, Nano Stores, REST API та інтеграції командних модулів наведено в [документації frontend](docs/frontend.md).

---



## Backend prerequisites

- .NET SDK 9 or a newer SDK capable of targeting net9.0.
- EF Core CLI 9.0.0: `dotnet tool install --global dotnet-ef --version 9.0.0`.
- PostgreSQL 16 (or Docker Compose) when using PostgreSQL.

Run the commands below from the repository root. Keep the same provider and connection configuration for migrations and API startup.

## SQLite

```powershell
Remove-Item Env:ConnectionStrings__DefaultConnection -ErrorAction SilentlyContinue
$env:Database__Provider = "SQLite"
$env:ConnectionStrings__SQLite = "Data Source=solarflow.local.db"
dotnet restore backend/SolarFlow.Api/SolarFlow.Api.csproj
dotnet ef database update --context SolarFlowDbContext --project backend/SolarFlow.Api/SolarFlow.Api.csproj
dotnet run --project backend/SolarFlow.Api/SolarFlow.Api.csproj --no-launch-profile -- --urls http://localhost:5080
```

A relative SQLite file path is resolved from the current working directory. This setup leaves the checked-in database unchanged. Back up an existing database while the API is stopped before applying migrations to it.

## PostgreSQL

Start a local PostgreSQL 16 server, or start only the database service:

```powershell
docker compose up -d solarflow-db
```

For the development database configured in docker-compose.yml:

```powershell
Remove-Item Env:ConnectionStrings__DefaultConnection -ErrorAction SilentlyContinue
$env:Database__Provider = "PostgreSQL"
$env:ConnectionStrings__PostgreSQL = "Host=localhost;Port=5432;Database=SolarFlowDb;Username=postgres;Password=StrongPassword123!"
dotnet ef database update --context PostgreSqlDbContext --project backend/SolarFlow.Api/SolarFlow.Api.csproj
dotnet run --project backend/SolarFlow.Api/SolarFlow.Api.csproj --no-launch-profile -- --urls http://localhost:5080
```

The password above belongs to the existing local Compose example. Supply deployment credentials through environment variables, not tracked appsettings files. To run the API container after migrating the database, use `docker compose up -d --build solarflow-api`.

With demo initialization disabled, new databases contain no stations and `GET http://localhost:5080/api/appliances` returns an empty list. Creating an appliance requires an existing SolarStation.

## Optional demonstration data

Demo initialization is disabled by default in all environments, including Production. To enable it explicitly, set the provider and connection as above, then run:

```powershell
$env:Database__SeedDemoData = "true"
dotnet run --project backend/SolarFlow.Api/SolarFlow.Api.csproj --no-launch-profile -- --urls http://localhost:5080
```

When enabled, startup applies the selected provider's migrations and seeds the database before accepting requests. The same seed callback also runs on `dotnet ef database update` when this flag is enabled. It creates **2 stations, 6 equipment records, 4 appliances and 6 telemetry samples** only when all domain tables are empty. Repeated starts do not duplicate data or reset edits. If any domain data already exists (including an imported legacy station), all demonstration insertion is skipped; it does not repair or refill partially deleted demo data.

Demo stations use `demo-owner` as a placeholder UserId. No user account, password or authentication permissions are created. Telemetry samples are fixed UTC demonstration readings from 2026-11-01, not live measurements.

To disable demo initialization again:

```powershell
$env:Database__SeedDemoData = "false"
```

Disabling this flag leaves existing data intact and stops automatic migrations/initialization at startup. For a clean demonstration, use a separate new local database rather than deleting existing user data. When downgrading migrations, keep demo initialization disabled.

The initializer uses EF Core 9 synchronous and asynchronous seeding hooks with migration locking. Its inserts use the migration transaction, or a dedicated transaction when none exists, so a failure does not leave partial demonstration rows.

## Configuration

`Database:Provider` accepts SQLite or PostgreSQL (case-insensitive); SQLite is the default. Each provider uses its own named connection string. Unknown providers and missing connection strings fail with an explicit startup error. An explicitly configured legacy `ConnectionStrings:DefaultConnection` overrides the named connection for compatibility; remove it when switching providers.

Each provider has its own context type and migration history, sharing the domain configuration. Always specify `--context` in EF CLI commands. Existing SQLite migrations stay in place; PostgreSQL migrations are in `Migrations/PostgreSQL`. Switching a provider selects another database; it does not copy existing data between databases.

## Automated tests

```powershell
dotnet test backend/SolarFlow.Api.Tests/SolarFlow.Api.Tests.csproj --collect:"XPlat Code Coverage"
```

SQLite tests use isolated databases in memory. To include the PostgreSQL integration test:

```powershell
$env:SOLARFLOW_TEST_POSTGRES = "Host=localhost;Port=5432;Database=postgres;Username=postgres;Password=StrongPassword123!"
dotnet test backend/SolarFlow.Api.Tests/SolarFlow.Api.Tests.csproj --collect:"XPlat Code Coverage"
```

The PostgreSQL test account must be allowed to create databases. The test creates and deletes only a new database named `solarflow_test_<random GUID>`, never the database named in the supplied connection string. Without SOLARFLOW_TEST_POSTGRES, the PostgreSQL integration test is explicitly skipped; the remaining tests still run. Coverage reports are generated under `backend/SolarFlow.Api.Tests/TestResults/`.

Check both migration snapshots:

```powershell
dotnet ef migrations has-pending-model-changes --context SolarFlowDbContext --project backend/SolarFlow.Api/SolarFlow.Api.csproj -- --Database:Provider=SQLite
dotnet ef migrations has-pending-model-changes --context PostgreSqlDbContext --project backend/SolarFlow.Api/SolarFlow.Api.csproj -- --Database:Provider=PostgreSQL
```

The backend GitHub Actions workflow runs tests with PostgreSQL 16, checks both snapshots and uploads test/coverage reports. Check the workflow result in the pull request Checks tab after pushing changes.

See [database conventions and decisions](docs/database.md).
