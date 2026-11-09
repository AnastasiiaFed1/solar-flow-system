using Microsoft.EntityFrameworkCore;
using Npgsql;
using SolarFlow.Api.Data;
using SolarFlow.Api.Models;

namespace SolarFlow.Api.Tests;

public class PostgreSqlInitializerTests
{
    [PostgreSqlFact]
    public async Task SeedsPostgreSqlAndPreservesEditsOnRepeatedMigration()
    {
        await WithDatabase(async connection =>
        {
            await using var context = CreateContext(connection, true);
            await context.Database.MigrateAsync();
            await DbInitializerTests.AssertDemoGraph(context);
            var station = await context.SolarStations.OrderBy(s => s.Id).FirstAsync();
            station.Name = "Edited station";
            await context.SaveChangesAsync();
            context.ChangeTracker.Clear();
            // Exercise the synchronous CLI path as well as async startup.
            context.Database.Migrate();
            await DbInitializerTests.AssertDemoGraph(context);
            Assert.Equal("Edited station", (await context.SolarStations.OrderBy(s => s.Id).FirstAsync()).Name);
            Assert.All(await context.TelemetryLogs.ToListAsync(), t => Assert.Equal(DateTimeKind.Utc, t.Timestamp.Kind));
        });
    }

    [PostgreSqlFact]
    public async Task ExistingPostgreSqlUserDataIsPreserved()
    {
        await WithDatabase(async connection =>
        {
            await using (var original = CreateContext(connection, false))
            {
                await original.Database.MigrateAsync();
                original.SolarStations.Add(new SolarStation { Name = "User station", UserId = "real-owner" });
                await original.SaveChangesAsync();
            }
            await using var seeded = CreateContext(connection, true);
            await seeded.Database.MigrateAsync();
            Assert.Equal("real-owner", (await seeded.SolarStations.SingleAsync()).UserId);
            Assert.Empty(await seeded.Equipment.ToListAsync());
            Assert.Empty(await seeded.Appliances.ToListAsync());
            Assert.Empty(await seeded.TelemetryLogs.ToListAsync());
        });
    }

    [PostgreSqlFact]
    public async Task PostgreSqlSeedFailureRollsBackAllRows()
    {
        await WithDatabase(async connection =>
        {
            await using (var schema = CreateContext(connection, false))
            {
                await schema.Database.MigrateAsync();
                await schema.Database.ExecuteSqlRawAsync("""
                    CREATE FUNCTION reject_demo_equipment() RETURNS trigger LANGUAGE plpgsql AS $$
                    BEGIN RAISE EXCEPTION 'Simulated seed failure'; END; $$;
                    CREATE TRIGGER reject_demo_equipment BEFORE INSERT ON "Equipment"
                    FOR EACH ROW EXECUTE FUNCTION reject_demo_equipment();
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
        });
    }

    private static PostgreSqlDbContext CreateContext(string connection, bool enabled)
    {
        var options = new DbContextOptionsBuilder<PostgreSqlDbContext>().UseNpgsql(connection);
        DbInitializer.ConfigureDemoData(options, enabled);
        return new PostgreSqlDbContext(options.Options);
    }

    private static async Task WithDatabase(Func<string, Task> test)
    {
        var builder = new NpgsqlConnectionStringBuilder(Environment.GetEnvironmentVariable("SOLARFLOW_TEST_POSTGRES"))
        {
            Database = "solarflow_test_" + Guid.NewGuid().ToString("N"), Pooling = false
        };
        try { await test(builder.ConnectionString); }
        finally
        {
            await using var cleanup = CreateContext(builder.ConnectionString, false);
            await cleanup.Database.EnsureDeletedAsync();
        }
    }
}
