using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using SolarFlow.Api.Data;
using SolarFlow.Api.Dtos.Appliance;
using SolarFlow.Api.Models;
using SolarFlow.Api.Services;
using SolarFlow.Api.Services.Implementations;

namespace SolarFlow.Api.Tests;

public sealed class DatabaseTests : IDisposable
{
    private readonly SqliteConnection _connection;
    private readonly SolarFlowDbContext _context;

    public DatabaseTests()
    {
        _connection = new SqliteConnection("Data Source=:memory:;Foreign Keys=True");
        _connection.Open();
        _context = new SolarFlowDbContext(new DbContextOptionsBuilder<SolarFlowDbContext>()
            .UseSqlite(_connection).Options);
    }

    [Fact]
    public async Task FreshDatabaseAppliesAllMigrationsAndCanBeMigratedAgain()
    {
        await _context.Database.MigrateAsync();
        await _context.Database.MigrateAsync();
        Assert.Empty(await _context.Database.GetPendingMigrationsAsync());
        Assert.False(_context.Database.HasPendingModelChanges());
        Assert.Empty(await _context.SolarStations.ToListAsync());
        Assert.Empty(await _context.Equipment.ToListAsync());
        Assert.Empty(await _context.TelemetryLogs.ToListAsync());
    }

    [Fact]
    public async Task UpgradePreservesLegacyAppliancesAndAssignsUnownedStation()
    {
        await _context.GetService<IMigrator>().MigrateAsync("20261028074517_InitialCreate");
        await _context.Database.ExecuteSqlRawAsync("""
            INSERT INTO "Appliances" ("Id", "Name", "PowerWatts", "IsActive")
            VALUES (7, 'Legacy fridge', 125.5, 1), (8, 'Legacy lamp', 12, 0);
            """);
        await _context.Database.MigrateAsync();
        var devices = await _context.Appliances.OrderBy(a => a.Id).ToListAsync();
        Assert.Equal(2, devices.Count);
        Assert.Equal(7, devices[0].Id);
        Assert.Equal("Legacy fridge", devices[0].Name);
        Assert.Equal(125.5, devices[0].PowerWatts);
        Assert.True(devices[0].IsActive);
        Assert.True(devices[0].IsSmartGridEnabled);
        Assert.False(devices[1].IsSmartGridEnabled);
        Assert.All(devices, a => { Assert.Equal(1, a.Priority); Assert.Equal(1, a.SolarStationId); });
        Assert.Equal("legacy-unassigned", (await _context.SolarStations.SingleAsync()).UserId);
        Assert.Empty(await ForeignKeyViolations());
    }

    [Fact]
    public async Task ServicePersistsStationPriorityAndSmartGridIndependentlyOfActiveState()
    {
        await InitializeStation();
        var service = new ApplianceService(_context);
        var created = await service.CreateAsync(new CreateApplianceDto
        {
            Name = "Heater", PowerConsumptionWatts = 1200, Priority = 3,
            SolarStationId = 1, IsSmartGridEnabled = true
        });
        _context.ChangeTracker.Clear();
        var entity = await _context.Appliances.SingleAsync();
        Assert.Equal(3, entity.Priority);
        Assert.True(entity.IsSmartGridEnabled);
        Assert.False(entity.IsActive);
        entity.IsActive = true;
        await _context.SaveChangesAsync();
        var updated = await service.UpdateAsync(created.Id, new UpdateApplianceDto
        {
            Name = "Heater updated", PowerConsumptionWatts = 1000, Priority = 2,
            SolarStationId = 1, IsSmartGridEnabled = false
        });
        _context.ChangeTracker.Clear();
        var loaded = await service.GetByIdAsync(created.Id);
        Assert.NotNull(updated);
        Assert.NotNull(loaded);
        Assert.Equal(2, loaded.Priority);
        Assert.Equal(1, loaded.SolarStationId);
        Assert.False(loaded.IsSmartGridEnabled);
        Assert.True((await _context.Appliances.SingleAsync()).IsActive);
        Assert.Single(await service.GetAllAsync(isActive: true));
    }

    [Fact]
    public async Task ServiceRejectsUnknownStationWithoutCreatingAppliance()
    {
        await _context.Database.MigrateAsync();
        var service = new ApplianceService(_context);
        await Assert.ThrowsAsync<InvalidSolarStationException>(() => service.CreateAsync(
            new CreateApplianceDto { Name = "Lamp", PowerConsumptionWatts = 10, Priority = 1, SolarStationId = 999 }));
        Assert.Empty(await _context.Appliances.ToListAsync());
        Assert.Null(await service.UpdateAsync(999, new UpdateApplianceDto { SolarStationId = 999 }));
    }

    [Theory]
    [InlineData("TiltAngle", -1)]
    [InlineData("TiltAngle", 91)]
    [InlineData("Latitude", 91)]
    [InlineData("Longitude", -181)]
    [InlineData("AzimuthAngle", 360)]
    public async Task DatabaseRejectsInvalidStationValues(string property, double value)
    {
        await _context.Database.MigrateAsync();
        var station = NewStation();
        _context.Entry(station).Property(property).CurrentValue = value;
        _context.SolarStations.Add(station);
        await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
    }

    [Theory]
    [InlineData(0)]
    [InlineData(4)]
    public async Task DatabaseRejectsInvalidAppliancePriority(int priority)
    {
        await InitializeStation();
        _context.Appliances.Add(new Appliance { Name = "Lamp", SolarStationId = 1, Priority = priority });
        await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
    }

    [Fact]
    public async Task ForeignKeyRejectsOrphanAndStationDeletionCascades()
    {
        await InitializeStation();
        _context.Appliances.Add(new Appliance { Name = "Orphan", SolarStationId = 999 });
        await Assert.ThrowsAsync<DbUpdateException>(() => _context.SaveChangesAsync());
        _context.ChangeTracker.Clear();
        _context.Appliances.Add(new Appliance { Name = "Lamp", SolarStationId = 1 });
        _context.Equipment.Add(new Equipment { SolarStationId = 1, ModelName = "Panel", Type = EquipmentType.Panel, CapacityKw = 1, EfficiencyFactor = .2 });
        _context.TelemetryLogs.Add(new TelemetryLog { SolarStationId = 1, Timestamp = DateTime.UtcNow, BatteryChargePercent = 50 });
        await _context.SaveChangesAsync();
        _context.ChangeTracker.Clear();
        _context.SolarStations.Remove(await _context.SolarStations.SingleAsync());
        await _context.SaveChangesAsync();
        Assert.Empty(await _context.Appliances.ToListAsync());
        Assert.Empty(await _context.Equipment.ToListAsync());
        Assert.Empty(await _context.TelemetryLogs.ToListAsync());
    }

    private async Task InitializeStation()
    {
        await _context.Database.MigrateAsync();
        _context.SolarStations.Add(NewStation());
        await _context.SaveChangesAsync();
    }

    private static SolarStation NewStation() => new()
    {
        Id = 1, Name = "Test station", UserId = "test-owner",
        Latitude = 50.45, Longitude = 30.52, TiltAngle = 30, AzimuthAngle = 180
    };

    private async Task<List<string>> ForeignKeyViolations()
    {
        using var command = _connection.CreateCommand();
        command.CommandText = "PRAGMA foreign_key_check;";
        using var reader = await command.ExecuteReaderAsync();
        var errors = new List<string>();
        while (await reader.ReadAsync()) errors.Add(reader.GetString(0));
        return errors;
    }

    public void Dispose() { _context.Dispose(); _connection.Dispose(); }
}
