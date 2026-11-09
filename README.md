# solar-flow-system

## Backend prerequisites

- .NET SDK 9 or a newer SDK capable of targeting net9.0.
- EF Core CLI. The API currently uses EF Core 9.0.0; a matching CLI can be installed with `dotnet tool install --global dotnet-ef --version 9.0.0`.

Run commands below from the repository root.

## SQLite development setup

The current database stage supports SQLite. The existing PostgreSQL Docker Compose configuration needs the separate provider-selection task before it can run this API correctly.

To start with a separate development database, leaving the checked-in database unchanged:

```powershell
$env:ConnectionStrings__DefaultConnection = "Data Source=solarflow.local.db"
dotnet restore backend/SolarFlow.Api/SolarFlow.Api.csproj
dotnet ef database update --project backend/SolarFlow.Api/SolarFlow.Api.csproj
dotnet run --project backend/SolarFlow.Api/SolarFlow.Api.csproj --no-launch-profile -- --urls http://localhost:5080
```

Use the same connection string for migrations and API startup. A relative SQLite file path is resolved from the current working directory. The new database has no sample data at this stage; `GET http://localhost:5080/api/appliances` returns an empty list. Creating an appliance requires an existing SolarStation. The DbInitializer task will provide development sample stations.

Before upgrading an existing database, back it up while the API is stopped. The AddStationDomain migration retains old appliances and links them to an imported station with ownership explicitly unassigned. See [database notes](docs/database.md).

## Automated tests

```powershell
dotnet test backend/SolarFlow.Api.Tests/SolarFlow.Api.Tests.csproj --collect:"XPlat Code Coverage"
dotnet ef migrations has-pending-model-changes --project backend/SolarFlow.Api/SolarFlow.Api.csproj
```

Tests use isolated SQLite databases in memory. They do not migrate the checked-in `solarflow.db`. Coverage output is written under `backend/SolarFlow.Api.Tests/TestResults/`; report percentages are tool-generated, not estimated.

The local issue draft for this stage is in [docs/issues/database-entities.md](docs/issues/database-entities.md).
