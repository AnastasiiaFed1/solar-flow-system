using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SolarFlow.Api.Data;

namespace SolarFlow.Api.Tests;

public class DatabaseProviderTests
{
    [Theory]
    [InlineData("SQLite", "Microsoft.EntityFrameworkCore.Sqlite")]
    [InlineData("sqlite", "Microsoft.EntityFrameworkCore.Sqlite")]
    [InlineData(" PostgreSQL ", "Npgsql.EntityFrameworkCore.PostgreSQL")]
    public void ConfigurationSelectsExpectedProvider(string provider, string expected)
    {
        using var container = CreateServices(provider);
        using var scope = container.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<SolarFlowDbContext>();
        Assert.Equal(expected, context.Database.ProviderName);
        if (expected.Contains("Npgsql"))
        {
            Assert.Same(context, scope.ServiceProvider.GetRequiredService<PostgreSqlDbContext>());
            Assert.Single(context.Database.GetMigrations());
            Assert.False(context.Database.HasPendingModelChanges());
        }
        else
        {
            Assert.Equal(2, context.Database.GetMigrations().Count());
        }
    }

    [Theory]
    [InlineData("MySQL")]
    [InlineData("")]
    public void UnknownProviderFailsBeforeDatabaseAccess(string provider)
    {
        var error = Assert.Throws<InvalidOperationException>(() => CreateServices(provider));
        Assert.Contains("Database:Provider", error.Message);
    }

    [Theory]
    [InlineData("SQLite")]
    [InlineData("PostgreSQL")]
    public void MissingConnectionFailsBeforeDatabaseAccess(string provider)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(
            new Dictionary<string, string?> { ["Database:Provider"] = provider }).Build();
        Assert.Throws<InvalidOperationException>(() => new ServiceCollection().AddSolarDatabase(config));
    }

    [Fact]
    public void ExplicitLegacyConnectionOverrideStillWorks()
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["ConnectionStrings:SQLite"] = "Data Source=default.db",
            ["ConnectionStrings:DefaultConnection"] = "Data Source=override.db"
        }).Build();
        using var services = new ServiceCollection().AddSolarDatabase(config).BuildServiceProvider();
        using var scope = services.CreateScope();
        Assert.Equal("Data Source=override.db", scope.ServiceProvider.GetRequiredService<SolarFlowDbContext>().Database.GetConnectionString());
    }

    private static ServiceProvider CreateServices(string provider)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Database:Provider"] = provider,
            ["ConnectionStrings:SQLite"] = "Data Source=:memory:",
            ["ConnectionStrings:PostgreSQL"] = "Host=localhost;Database=solarflow_test;Username=test"
        }).Build();
        return new ServiceCollection().AddSolarDatabase(config).BuildServiceProvider();
    }
}
