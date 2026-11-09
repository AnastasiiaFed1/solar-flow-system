using Microsoft.EntityFrameworkCore;
using Npgsql;
using SolarFlow.Api.Data;
using SolarFlow.Api.Dtos.Appliance;
using SolarFlow.Api.Models;
using SolarFlow.Api.Services.Implementations;

namespace SolarFlow.Api.Tests;

public sealed class PostgreSqlFactAttribute : FactAttribute
{
    public PostgreSqlFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("SOLARFLOW_TEST_POSTGRES")))
            Skip = "Set SOLARFLOW_TEST_POSTGRES to run against a disposable PostgreSQL database.";
    }
}

public class PostgreSqlIntegrationTests
{
    [PostgreSqlFact]
    public async Task PostgreSqlMigrationsCrudConstraintsAndCascadeWork()
    {
        var connection = new NpgsqlConnectionStringBuilder(Environment.GetEnvironmentVariable("SOLARFLOW_TEST_POSTGRES"))
        {
            // Never migrate or delete a database supplied by the caller.
            Database = "solarflow_test_" + Guid.NewGuid().ToString("N"),
            Pooling = false
        };
        await using var context = new PostgreSqlDbContext(new DbContextOptionsBuilder<PostgreSqlDbContext>()
            .UseNpgsql(connection.ConnectionString).Options);
        try
        {
            await context.Database.MigrateAsync();
            await context.Database.MigrateAsync();
            Assert.Empty(await context.Database.GetPendingMigrationsAsync());
            context.SolarStations.Add(new SolarStation
            {
                Name = "PostgreSQL station", UserId = "test-owner", Latitude = 50.45,
                Longitude = 30.52, TiltAngle = 30, AzimuthAngle = 180
            });
            await context.SaveChangesAsync();
            var stationId = (await context.SolarStations.SingleAsync()).Id;
            var service = new ApplianceService(context);
            var appliance = await service.CreateAsync(new CreateApplianceDto
            {
                Name = "Fridge", PowerConsumptionWatts = 125, Priority = 2,
                SolarStationId = stationId, IsSmartGridEnabled = true
            });
            context.ChangeTracker.Clear();
            Assert.Equal(2, (await service.GetByIdAsync(appliance.Id))!.Priority);
            var updated = await service.UpdateAsync(appliance.Id, new UpdateApplianceDto
            {
                Name = "Updated fridge", PowerConsumptionWatts = 100, Priority = 3,
                SolarStationId = stationId, IsSmartGridEnabled = false
            });
            Assert.Equal(3, updated!.Priority);
            Assert.False(updated.IsSmartGridEnabled);
            Assert.Single(await service.GetAllAsync(minPower: 90, maxPower: 110));
            context.ChangeTracker.Clear();
            var timestamp = new DateTime(2026, 11, 9, 10, 0, 0, DateTimeKind.Utc);
            context.TelemetryLogs.Add(new TelemetryLog
            {
                SolarStationId = stationId, Timestamp = timestamp,
                BatteryChargePercent = 55, PowerOutputKw = 2, GridExportKw = .5
            });
            context.Equipment.Add(new Equipment
            {
                SolarStationId = stationId, Type = EquipmentType.Panel,
                ModelName = "Test panel", CapacityKw = .4, EfficiencyFactor = .2
            });
            await context.SaveChangesAsync();
            context.ChangeTracker.Clear();
            Assert.Equal(timestamp, (await context.TelemetryLogs.SingleAsync()).Timestamp);
            context.Appliances.Add(new Appliance { Name = "Bad priority", SolarStationId = stationId, Priority = 4 });
            await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
            context.ChangeTracker.Clear();
            context.Appliances.Add(new Appliance { Name = "Orphan", SolarStationId = int.MaxValue });
            await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
            context.ChangeTracker.Clear();
            context.SolarStations.Remove(await context.SolarStations.SingleAsync());
            await context.SaveChangesAsync();
            Assert.Empty(await context.Appliances.ToListAsync());
            Assert.Empty(await context.Equipment.ToListAsync());
            Assert.Empty(await context.TelemetryLogs.ToListAsync());
        }
        finally
        {
            await context.Database.EnsureDeletedAsync();
        }
    }
}
