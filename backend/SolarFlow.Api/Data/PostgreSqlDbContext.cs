using Microsoft.EntityFrameworkCore;

namespace SolarFlow.Api.Data;

// A separate context type keeps PostgreSQL migrations apart from SQLite history.
// Domain configuration is inherited from SolarFlowDbContext.
public sealed class PostgreSqlDbContext : SolarFlowDbContext
{
    public PostgreSqlDbContext(DbContextOptions<PostgreSqlDbContext> options) : base(options) { }
}
