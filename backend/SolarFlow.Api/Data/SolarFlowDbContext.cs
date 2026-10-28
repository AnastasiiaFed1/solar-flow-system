using Microsoft.EntityFrameworkCore;
using SolarFlow.Api.Models;

namespace SolarFlow.Api.Data;

public class SolarFlowDbContext : DbContext
{
    public SolarFlowDbContext(DbContextOptions<SolarFlowDbContext> options) : base(options)
    {
    }

    public DbSet<Appliance> Appliances => Set<Appliance>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Appliance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PowerWatts).IsRequired();
        });
    }
}