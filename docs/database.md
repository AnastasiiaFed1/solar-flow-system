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
This stage supports SQLite. PostgreSQL migrations and provider selection are a separate follow-up, and the existing Docker Compose PostgreSQL setup is not validated by this stage.
UserId is a string ownership identifier; a user-table foreign key awaits the agreed authentication model.
New databases contain no sample stations yet. DbInitializer and sample data are the next separate task.

## Validation cases
Automated tests cover a fresh database, repeated migration, legacy appliance preservation, persisted appliance fields, unknown station handling, invalid station angles/coordinates, invalid priority, foreign keys, cascades and the 400 validation response.

Tests use real SQLite in-memory databases with migrations, not EF Core's non-relational InMemory provider.
