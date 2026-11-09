namespace SolarFlow.Api.Models;

public class TelemetryLog
{
    public int Id { get; set; }
    public int SolarStationId { get; set; }
    public SolarStation SolarStation { get; set; } = null!;
    // Store UTC values for consistent history across clients.
    public DateTime Timestamp { get; set; }
    public double PowerOutputKw { get; set; }
    public double BatteryChargePercent { get; set; }
    public double GridExportKw { get; set; }
}
