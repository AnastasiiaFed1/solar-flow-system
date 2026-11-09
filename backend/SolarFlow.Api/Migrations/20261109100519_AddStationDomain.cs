using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SolarFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStationDomain : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsSmartGridEnabled",
                table: "Appliances",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "Appliances",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "SolarStationId",
                table: "Appliances",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "SolarStations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Latitude = table.Column<double>(type: "REAL", nullable: false),
                    Longitude = table.Column<double>(type: "REAL", nullable: false),
                    TiltAngle = table.Column<double>(type: "REAL", nullable: false),
                    AzimuthAngle = table.Column<double>(type: "REAL", nullable: false),
                    UserId = table.Column<string>(type: "TEXT", maxLength: 450, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SolarStations", x => x.Id);
                    table.CheckConstraint("CK_SolarStations_AzimuthAngle", "\"AzimuthAngle\" >= 0 AND \"AzimuthAngle\" < 360");
                    table.CheckConstraint("CK_SolarStations_Latitude", "\"Latitude\" >= -90 AND \"Latitude\" <= 90");
                    table.CheckConstraint("CK_SolarStations_Longitude", "\"Longitude\" >= -180 AND \"Longitude\" <= 180");
                    table.CheckConstraint("CK_SolarStations_TiltAngle", "\"TiltAngle\" >= 0 AND \"TiltAngle\" <= 90");
                });

            migrationBuilder.CreateTable(
                name: "Equipment",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SolarStationId = table.Column<int>(type: "INTEGER", nullable: false),
                    Type = table.Column<int>(type: "INTEGER", nullable: false),
                    ModelName = table.Column<string>(type: "TEXT", maxLength: 150, nullable: false),
                    CapacityKw = table.Column<double>(type: "REAL", nullable: false),
                    EfficiencyFactor = table.Column<double>(type: "REAL", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Equipment", x => x.Id);
                    table.CheckConstraint("CK_Equipment_CapacityKw", "\"CapacityKw\" > 0");
                    table.CheckConstraint("CK_Equipment_EfficiencyFactor", "\"EfficiencyFactor\" >= 0 AND \"EfficiencyFactor\" <= 1");
                    table.CheckConstraint("CK_Equipment_Status", "\"Status\" >= 1 AND \"Status\" <= 3");
                    table.CheckConstraint("CK_Equipment_Type", "\"Type\" >= 1 AND \"Type\" <= 3");
                    table.ForeignKey(
                        name: "FK_Equipment_SolarStations_SolarStationId",
                        column: x => x.SolarStationId,
                        principalTable: "SolarStations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TelemetryLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    SolarStationId = table.Column<int>(type: "INTEGER", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "TEXT", nullable: false),
                    PowerOutputKw = table.Column<double>(type: "REAL", nullable: false),
                    BatteryChargePercent = table.Column<double>(type: "REAL", nullable: false),
                    GridExportKw = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TelemetryLogs", x => x.Id);
                    table.CheckConstraint("CK_TelemetryLogs_BatteryChargePercent", "\"BatteryChargePercent\" >= 0 AND \"BatteryChargePercent\" <= 100");
                    table.CheckConstraint("CK_TelemetryLogs_GridExportKw", "\"GridExportKw\" >= 0");
                    table.CheckConstraint("CK_TelemetryLogs_PowerOutputKw", "\"PowerOutputKw\" >= 0");
                    table.ForeignKey(
                        name: "FK_TelemetryLogs_SolarStations_SolarStationId",
                        column: x => x.SolarStationId,
                        principalTable: "SolarStations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Existing appliances had no station or persisted priority. Preserve them
            // under an explicitly unassigned station rather than inventing an owner.
            migrationBuilder.Sql("""
                INSERT INTO "SolarStations"
                    ("Id", "Name", "Latitude", "Longitude", "TiltAngle", "AzimuthAngle", "UserId")
                SELECT 1, 'Imported station (ownership unassigned)', 0, 0, 0, 0, 'legacy-unassigned'
                WHERE EXISTS (SELECT 1 FROM "Appliances");
                """);
            migrationBuilder.Sql("""
                UPDATE "Appliances"
                SET "SolarStationId" = 1, "Priority" = 1, "IsSmartGridEnabled" = "IsActive";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Appliances_SolarStationId_Priority",
                table: "Appliances",
                columns: new[] { "SolarStationId", "Priority" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_Appliances_PowerWatts",
                table: "Appliances",
                sql: "\"PowerWatts\" >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Appliances_Priority",
                table: "Appliances",
                sql: "\"Priority\" >= 1 AND \"Priority\" <= 3");

            migrationBuilder.CreateIndex(
                name: "IX_Equipment_SolarStationId",
                table: "Equipment",
                column: "SolarStationId");

            migrationBuilder.CreateIndex(
                name: "IX_SolarStations_UserId",
                table: "SolarStations",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_TelemetryLogs_SolarStationId_Timestamp",
                table: "TelemetryLogs",
                columns: new[] { "SolarStationId", "Timestamp" });

            migrationBuilder.AddForeignKey(
                name: "FK_Appliances_SolarStations_SolarStationId",
                table: "Appliances",
                column: "SolarStationId",
                principalTable: "SolarStations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Appliances_SolarStations_SolarStationId",
                table: "Appliances");

            migrationBuilder.DropTable(
                name: "Equipment");

            migrationBuilder.DropTable(
                name: "TelemetryLogs");

            migrationBuilder.DropTable(
                name: "SolarStations");

            migrationBuilder.DropIndex(
                name: "IX_Appliances_SolarStationId_Priority",
                table: "Appliances");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Appliances_PowerWatts",
                table: "Appliances");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Appliances_Priority",
                table: "Appliances");

            migrationBuilder.DropColumn(
                name: "IsSmartGridEnabled",
                table: "Appliances");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Appliances");

            migrationBuilder.DropColumn(
                name: "SolarStationId",
                table: "Appliances");
        }
    }
}
