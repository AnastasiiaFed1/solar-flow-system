# Database implementation notes

## Data conventions
- Latitude/longitude: decimal degrees, ranges [-90, 90] and [-180, 180].
- Tilt: [0, 90] degrees. Azimuth: [0, 360), clockwise from north.
- Equipment capacity and telemetry power: kW; appliance PowerWatts: W.
- EfficiencyFactor: ratio [0, 1], not a percentage.
- BatteryChargePercent: [0, 100].
- Telemetry Timestamp: UTC DateTime; callers must supply UTC values.
- Equipment Type: Panel=1, Inverter=2, Battery=3.
- Equipment Status: Active=1, Warning=2, Critical=3.
- Appliance Priority: 1=critical, 2=medium, 3=flexible.
- IsActive is an operating state; IsSmartGridEnabled is permission for automation.

## Decisions
1. Preserve the existing SolarFlowDbContext name to avoid breaking service registration and existing migrations.
2. Preserve the PowerWatts database column and model property for compatibility with existing code. DTOs continue to expose PowerConsumptionWatts.
3. Store IsSmartGridEnabled independently of IsActive. The old service mapped these together; migration copies the old value to the new flag once to preserve previous API behaviour.
4. Keep the original InitialCreate migration. AddStationDomain incrementally upgrades its schema. Existing appliances receive priority 1 and a station explicitly marked as ownership unassigned; no real user ownership is invented.
5. Cascade station deletion to station-owned equipment, appliances and telemetry. Use composite indexes for station/priority and station/time history queries.
6. Validate referenced stations before appliance writes so a missing station produces a 400 response rather than an unhandled foreign-key error.

## Current limitations
SQLite and PostgreSQL are selected by Database:Provider. SolarFlowDbContext keeps the existing SQLite migration history; PostgreSqlDbContext inherits the domain configuration and has its own PostgreSQL migrations. The PostgreSQL integration test runs against an actual server when SOLARFLOW_TEST_POSTGRES is set. The Docker image build itself requires Docker and was not run locally.
UserId is a string ownership identifier; a user-table foreign key awaits the agreed authentication model.
Optional DbInitializer demonstration data is implemented in issue #25; it is disabled by default and never merged into a non-empty database.

## Validation cases
Automated tests cover a fresh database, repeated migration, legacy appliance preservation, persisted appliance fields, unknown station handling, invalid station angles/coordinates, invalid priority, foreign keys, cascades and the 400 validation response.

Tests use real SQLite in-memory databases with migrations, not EF Core's non-relational InMemory provider.

## Provider decisions (issue #23)
7. Keep provider-specific migration sets using two context types in the same assembly, as described in the [EF Core documentation](https://learn.microsoft.com/en-us/ef/core/managing-schemas/migrations/providers). This preserves published SQLite migrations and prevents PostgreSQL from executing SQLite-specific column definitions.
8. Keep services dependent on SolarFlowDbContext. DI resolves the PostgreSQL subclass when PostgreSQL is selected, so controllers and services do not depend on the provider.
9. Keep explicit legacy DefaultConnection overrides working; use SQLite/PostgreSQL named connections for new configuration. Provider selection does not transfer data between engines.
10. Align Docker images with the existing net9.0 target and explicitly bind port 80 to match Compose. No authentication or sample data is introduced by this task.

## Validation for issue #23
- 22 tests passed with no skipped tests, including a real PostgreSQL 16.4 integration test on an isolated temporary localhost server.
- SQLite legacy upgrade tests still pass.
- PostgreSQL tests apply migrations twice, round-trip appliance and UTC telemetry data, reject invalid priority and orphan records, and verify cascades.
- Configuration tests check both providers, unknown providers, missing connection strings and legacy overrides.
- GitHub Actions execution and the Docker image build remain to be verified in their respective environments.

## Initializer decisions (issue #25)
11. Use EF Core 9 UseSeeding and UseAsyncSeeding hooks, so migration locking protects the empty-check and insertion. See [EF Core seeding documentation](https://learn.microsoft.com/en-us/ef/core/modeling/data-seeding). Both CLI and asynchronous startup paths are supported.
12. Gate demo initialization with Database:SeedDemoData, default false in every environment. Startup applies migrations only when this opt-in flag is true; normal production startup remains unchanged.
13. Seed only a completely empty domain database. Any existing station/equipment/appliance/telemetry row causes the initializer to skip all inserts. This preserves user edits, legacy data and partially removed demo sets.
14. Insert one related graph in a transaction, reusing EF's migration transaction where present. Generated keys avoid hard-coded identity values. Demonstration ownership is a placeholder without account creation.
15. Use deterministic UTC telemetry samples for reproducible demonstrations. No schema changes or new migrations are required for optional seed data.

## Validation for issue #25
- 32 tests passed with zero skipped tests, including real PostgreSQL tests.
- Both sync and async seeding paths populate the expected graph without duplicates.
- Existing user data is preserved; changed demo station names are not reset.
- Disabled/missing configuration leaves domain tables empty.
- Simulated equipment insertion failures on SQLite and PostgreSQL roll back all seed rows.
- Existing migration snapshots remain unchanged.
- Startup smoke check: the API returns 4 demo appliances; a restart preserves the count; disabled initialization creates no new production database.
