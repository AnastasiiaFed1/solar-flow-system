using Microsoft.EntityFrameworkCore;
using SolarFlow.Api.Models;

namespace SolarFlow.Api.Data;

public static class DbInitializer
{
    public static void ConfigureDemoData(DbContextOptionsBuilder options, bool enabled)
    {
        if (!enabled) return;
        // Both entry points are needed: EF CLI uses sync seeding, startup uses async.
        // EF migration locking serializes these callbacks across application instances.
        options.UseSeeding((context, _) => Seed((SolarFlowDbContext)context));
        options.UseAsyncSeeding((context, _, token) => SeedAsync((SolarFlowDbContext)context, token));
    }

    public static void Seed(SolarFlowDbContext context)
    {
        // Reuse EF's migration transaction; direct calls get their own transaction.
        using var transaction = context.Database.CurrentTransaction is null
            ? context.Database.BeginTransaction() : null;
        if (context.Database.GetPendingMigrations().Any()) return;
        if (context.SolarStations.Any() || context.Appliances.Any()
            || context.Equipment.Any() || context.TelemetryLogs.Any()) return;

        context.SolarStations.AddRange(CreateDemoStations());
        context.SaveChanges();
        transaction?.Commit();
    }

    public static async Task SeedAsync(SolarFlowDbContext context, CancellationToken cancellationToken = default)
    {
        await using var transaction = context.Database.CurrentTransaction is null
            ? await context.Database.BeginTransactionAsync(cancellationToken) : null;
        if ((await context.Database.GetPendingMigrationsAsync(cancellationToken)).Any()) return;
        if (await context.SolarStations.AnyAsync(cancellationToken)
            || await context.Appliances.AnyAsync(cancellationToken)
            || await context.Equipment.AnyAsync(cancellationToken)
            || await context.TelemetryLogs.AnyAsync(cancellationToken)) return;

        context.SolarStations.AddRange(CreateDemoStations());
        await context.SaveChangesAsync(cancellationToken);
        if (transaction is not null) await transaction.CommitAsync(cancellationToken);
    }

    private static SolarStation[] CreateDemoStations() =>
    [
        CreateStation("Demo Kyiv", 50.4501, 30.5234, 30, 5, 0),
        CreateStation("Demo Lviv", 49.8397, 24.0297, 35, 3, 1)
    ];

    private static SolarStation CreateStation(string name, double latitude, double longitude,
        double tilt, double capacity, int offset)
    {
        var station = new SolarStation
        {
            Name = name, Latitude = latitude, Longitude = longitude,
            TiltAngle = tilt, AzimuthAngle = 180,
            // Placeholder only; no account, password or ownership grant is created.
            UserId = "demo-owner",
            Equipment = new List<Equipment>
            {
                new() { Type = EquipmentType.Panel, ModelName = "Demo panel array", CapacityKw = capacity, EfficiencyFactor = .21 },
                new() { Type = EquipmentType.Inverter, ModelName = "Demo inverter", CapacityKw = capacity, EfficiencyFactor = .96 },
                new() { Type = EquipmentType.Battery, ModelName = "Demo battery", CapacityKw = 3, EfficiencyFactor = .9 }
            },
            Appliances = new List<Appliance>
            {
                new() { Name = "Demo fridge", PowerWatts = 150, Priority = 1, IsActive = true, IsSmartGridEnabled = false },
                new() { Name = "Demo washing machine", PowerWatts = 1800, Priority = 3, IsActive = false, IsSmartGridEnabled = true }
            }
        };
        // Fixed UTC samples keep repeated demonstrations reproducible.
        var start = new DateTime(2026, 11, 1, 10, 0, 0, DateTimeKind.Utc);
        for (var i = 0; i < 3; i++)
        {
            station.TelemetryLogs.Add(new TelemetryLog
            {
                Timestamp = start.AddMinutes(i * 15), PowerOutputKw = capacity * (.5 + i * .1),
                BatteryChargePercent = 60 + offset * 5 + i * 5, GridExportKw = .2 + i * .1
            });
        }
        return station;
    }
}
