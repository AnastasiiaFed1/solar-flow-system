using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SolarFlow.Api.Migrations.PostgreSQL
{
    /// <inheritdoc />
    public partial class InitialPostgreSql : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SolarStations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: false),
                    Longitude = table.Column<double>(type: "double precision", nullable: false),
                    TiltAngle = table.Column<double>(type: "double precision", nullable: false),
                    AzimuthAngle = table.Column<double>(type: "double precision", nullable: false),
                    UserId = table.Column<string>(type: "character varying(450)", maxLength: 450, nullable: false)
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
                name: "Appliances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    PowerWatts = table.Column<double>(type: "double precision", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    SolarStationId = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    IsSmartGridEnabled = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Appliances", x => x.Id);
                    table.CheckConstraint("CK_Appliances_PowerWatts", "\"PowerWatts\" >= 0");
                    table.CheckConstraint("CK_Appliances_Priority", "\"Priority\" >= 1 AND \"Priority\" <= 3");
                    table.ForeignKey(
                        name: "FK_Appliances_SolarStations_SolarStationId",
                        column: x => x.SolarStationId,
                        principalTable: "SolarStations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Equipment",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SolarStationId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    ModelName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    CapacityKw = table.Column<double>(type: "double precision", nullable: false),
                    EfficiencyFactor = table.Column<double>(type: "double precision", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false)
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
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    SolarStationId = table.Column<int>(type: "integer", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PowerOutputKw = table.Column<double>(type: "double precision", nullable: false),
                    BatteryChargePercent = table.Column<double>(type: "double precision", nullable: false),
                    GridExportKw = table.Column<double>(type: "double precision", nullable: false)
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

            migrationBuilder.CreateIndex(
                name: "IX_Appliances_SolarStationId_Priority",
                table: "Appliances",
                columns: new[] { "SolarStationId", "Priority" });

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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Appliances");

            migrationBuilder.DropTable(
                name: "Equipment");

            migrationBuilder.DropTable(
                name: "TelemetryLogs");

            migrationBuilder.DropTable(
                name: "SolarStations");
        }
    }
}
