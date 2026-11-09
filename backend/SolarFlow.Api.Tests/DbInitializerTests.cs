using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SolarFlow.Api.Data;
using SolarFlow.Api.Models;

namespace SolarFlow.Api.Tests;

public class DbInitializerTests
{
    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task SyncAndAsyncMigrationsSeedCompleteGraphOnlyOnce(bool asynchronous)
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using var context = CreateContext(connection, true);
        if (asynchronous) await context.Database.MigrateAsync();
        else context.Database.Migrate();
        await AssertDemoGraph(context);
        var station = await context.SolarStations.OrderBy(s => s.Id).FirstAsync();
        station.Name = "Edited by user";
        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();
        if (asynchronous) await context.Database.MigrateAsync();
        else context.Database.Migrate();
        Assert.Equal(2, await context.SolarStations.CountAsync());
        Assert.Equal(4, await context.Appliances.CountAsync());
        Assert.Equal(6, await context.Equipment.CountAsync());
        Assert.Equal(6, await context.TelemetryLogs.CountAsync());
        Assert.Contains(await context.SolarStations.Select(s => s.Name).ToListAsync(), name => name == "Edited by user");
    }

    [Theory]
    [InlineData(null, 0)]
    [InlineData("false", 0)]
    [InlineData("true", 2)]
    public async Task ConfigurationIsOptIn(string? setting, int expectedStations)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:SQLite"] = "Data Source=:memory:",
            ["Database:SeedDemoData"] = setting
        }).Build();
        using var services = new ServiceCollection().AddSolarDatabase(config).BuildServiceProvider();
        using var scope = services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SolarFlowDbContext>();
        await context.Database.OpenConnectionAsync();
        await context.Database.MigrateAsync();
        Assert.Equal(expectedStations, await context.SolarStations.CountAsync());
    }

    [Fact]
    public async Task ExistingUserDataIsNotChangedOrMixedWithDemoData()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using (var original = CreateContext(connection, false))
        {
            await original.Database.MigrateAsync();
            original.SolarStations.Add(new SolarStation
            {
                Name = "User station", UserId = "real-owner", TiltAngle = 20,
                Appliances = new List<Appliance> { new() { Name = "User lamp", PowerWatts = 12, Priority = 2 } }
            });
            await original.SaveChangesAsync();
        }
        await using var seeded = CreateContext(connection, true);
        await seeded.Database.MigrateAsync();
        var station = await seeded.SolarStations.SingleAsync();
        Assert.Equal("User station", station.Name);
        Assert.Equal("real-owner", station.UserId);
        var appliance = await seeded.Appliances.SingleAsync();
        Assert.Equal("User lamp", appliance.Name);
        Assert.Equal(12, appliance.PowerWatts);
        Assert.Equal(2, appliance.Priority);
        Assert.Empty(await seeded.Equipment.ToListAsync());
        Assert.Empty(await seeded.TelemetryLogs.ToListAsync());
    }

    [Fact]
    public async Task FailureRollsBackAllDemoRows()
    {
        using var connection = new SqliteConnection("Data Source=:memory:");
        await connection.OpenAsync();
        await using (var schema = CreateContext(connection, false))
        {
            await schema.Database.MigrateAsync();
            await schema.Database.ExecuteSqlRawAsync("""
                CREATE TRIGGER fail_demo_equipment BEFORE INSERT ON Equipment
                BEGIN SELECT RAISE(ABORT, 'Simulated seed failure'); END;
                """);
        }
        await using (var failing = CreateContext(connection, true))
        {
            await Assert.ThrowsAsync<DbUpdateException>(() => failing.Database.MigrateAsync());
        }
        await using var check = CreateContext(connection, false);
        Assert.Empty(await check.SolarStations.ToListAsync());
        Assert.Empty(await check.Appliances.ToListAsync());
        Assert.Empty(await check.Equipment.ToListAsync());
        Assert.Empty(await check.TelemetryLogs.ToListAsync());
    }

    internal static async Task AssertDemoGraph(SolarFlowDbContext context)
    {
        Assert.Equal(2, await context.SolarStations.CountAsync());
        Assert.Equal(4, await context.Appliances.CountAsync());
        Assert.Equal(6, await context.Equipment.CountAsync());
        Assert.Equal(6, await context.TelemetryLogs.CountAsync());
        var stationIds = await context.SolarStations.Select(s => s.Id).ToListAsync();
        Assert.All(await context.Appliances.ToListAsync(), a => Assert.Contains(a.SolarStationId, stationIds));
        Assert.All(await context.Equipment.ToListAsync(), e => Assert.Contains(e.SolarStationId, stationIds));
        Assert.All(await context.TelemetryLogs.ToListAsync(), t =>
        {
            Assert.Contains(t.SolarStationId, stationIds);
            Assert.InRange(t.BatteryChargePercent, 0, 100);
        });
    }

    private static SolarFlowDbContext CreateContext(SqliteConnection connection, bool enabled)
    {
        var options = new DbContextOptionsBuilder<SolarFlowDbContext>().UseSqlite(connection);
        DbInitializer.ConfigureDemoData(options, enabled);
        return new SolarFlowDbContext(options.Options);
    }
}
