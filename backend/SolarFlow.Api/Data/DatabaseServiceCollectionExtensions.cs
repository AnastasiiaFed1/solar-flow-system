using Microsoft.EntityFrameworkCore;

namespace SolarFlow.Api.Data;

public static class DatabaseServiceCollectionExtensions
{
    public static IServiceCollection AddSolarDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        var provider = (configuration["Database:Provider"] ?? "SQLite").Trim();
        var isSqlite = provider.Equals("SQLite", StringComparison.OrdinalIgnoreCase);
        var isPostgreSql = provider.Equals("PostgreSQL", StringComparison.OrdinalIgnoreCase);
        if (!isSqlite && !isPostgreSql)
        {
            throw new InvalidOperationException(
                $"Unsupported Database:Provider '{provider}'. Use SQLite or PostgreSQL.");
        }

        var connectionName = isSqlite ? "SQLite" : "PostgreSQL";
        // Retain explicit legacy overrides used by existing local setups.
        // appsettings.json no longer defines DefaultConnection.
        var connection = configuration.GetConnectionString("DefaultConnection")
            ?? configuration.GetConnectionString(connectionName);
        if (string.IsNullOrWhiteSpace(connection))
        {
            throw new InvalidOperationException($"ConnectionStrings:{connectionName} is required.");
        }

        if (isSqlite)
        {
            services.AddDbContext<SolarFlowDbContext>(options => options.UseSqlite(connection));
        }
        else
        {
            services.AddDbContext<PostgreSqlDbContext>(options => options.UseNpgsql(connection));
            services.AddScoped<SolarFlowDbContext>(sp => sp.GetRequiredService<PostgreSqlDbContext>());
        }
        return services;
    }
}
