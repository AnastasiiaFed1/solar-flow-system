namespace SolarFlow.Api.Models;

public class SolarStation
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public double TiltAngle { get; set; }
    public double AzimuthAngle { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ICollection<Equipment> Equipment { get; set; } = new List<Equipment>();
    public ICollection<Appliance> Appliances { get; set; } = new List<Appliance>();
    public ICollection<TelemetryLog> TelemetryLogs { get; set; } = new List<TelemetryLog>();
}
