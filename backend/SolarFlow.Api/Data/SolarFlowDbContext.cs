using Microsoft.EntityFrameworkCore;
using SolarFlow.Api.Models;

namespace SolarFlow.Api.Data;

public class SolarFlowDbContext : DbContext
{
    public SolarFlowDbContext(DbContextOptions<SolarFlowDbContext> options) : base(options) { }

    protected SolarFlowDbContext(DbContextOptions options) : base(options) { }

    public DbSet<Appliance> Appliances => Set<Appliance>();
    public DbSet<SolarStation> SolarStations => Set<SolarStation>();
    public DbSet<Equipment> Equipment => Set<Equipment>();
    public DbSet<TelemetryLog> TelemetryLogs => Set<TelemetryLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<SolarStation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.UserId).IsRequired().HasMaxLength(450);
            entity.HasIndex(e => e.UserId);
            entity.ToTable("SolarStations", table =>
            {
                table.HasCheckConstraint("CK_SolarStations_Latitude", "\"Latitude\" >= -90 AND \"Latitude\" <= 90");
                table.HasCheckConstraint("CK_SolarStations_Longitude", "\"Longitude\" >= -180 AND \"Longitude\" <= 180");
                table.HasCheckConstraint("CK_SolarStations_TiltAngle", "\"TiltAngle\" >= 0 AND \"TiltAngle\" <= 90");
                // Azimuth is measured clockwise from north, in [0, 360).
                table.HasCheckConstraint("CK_SolarStations_AzimuthAngle", "\"AzimuthAngle\" >= 0 AND \"AzimuthAngle\" < 360");
            });
        });

        modelBuilder.Entity<Appliance>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.PowerWatts).IsRequired();
            entity.HasOne(e => e.SolarStation).WithMany(e => e.Appliances)
                .HasForeignKey(e => e.SolarStationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.SolarStationId, e.Priority });
            entity.ToTable("Appliances", table =>
            {
                table.HasCheckConstraint("CK_Appliances_PowerWatts", "\"PowerWatts\" >= 0");
                table.HasCheckConstraint("CK_Appliances_Priority", "\"Priority\" >= 1 AND \"Priority\" <= 3");
            });
        });

        modelBuilder.Entity<Equipment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ModelName).IsRequired().HasMaxLength(150);
            entity.HasOne(e => e.SolarStation).WithMany(e => e.Equipment)
                .HasForeignKey(e => e.SolarStationId).OnDelete(DeleteBehavior.Cascade);
            entity.ToTable("Equipment", table =>
            {
                table.HasCheckConstraint("CK_Equipment_CapacityKw", "\"CapacityKw\" > 0");
                table.HasCheckConstraint("CK_Equipment_EfficiencyFactor", "\"EfficiencyFactor\" >= 0 AND \"EfficiencyFactor\" <= 1");
                table.HasCheckConstraint("CK_Equipment_Type", "\"Type\" >= 1 AND \"Type\" <= 3");
                table.HasCheckConstraint("CK_Equipment_Status", "\"Status\" >= 1 AND \"Status\" <= 3");
            });
        });

        modelBuilder.Entity<TelemetryLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasOne(e => e.SolarStation).WithMany(e => e.TelemetryLogs)
                .HasForeignKey(e => e.SolarStationId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(e => new { e.SolarStationId, e.Timestamp });
            entity.ToTable("TelemetryLogs", table =>
            {
                table.HasCheckConstraint("CK_TelemetryLogs_PowerOutputKw", "\"PowerOutputKw\" >= 0");
                table.HasCheckConstraint("CK_TelemetryLogs_BatteryChargePercent", "\"BatteryChargePercent\" >= 0 AND \"BatteryChargePercent\" <= 100");
                table.HasCheckConstraint("CK_TelemetryLogs_GridExportKw", "\"GridExportKw\" >= 0");
            });
        });
    }
}
