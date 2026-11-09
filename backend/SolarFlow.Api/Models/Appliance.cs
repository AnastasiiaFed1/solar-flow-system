namespace SolarFlow.Api.Models;

public class Appliance
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double PowerWatts { get; set; }
    public bool IsActive { get; set; }
    public int SolarStationId { get; set; }
    public SolarStation SolarStation { get; set; } = null!;
    public int Priority { get; set; } = 1;
    public bool IsSmartGridEnabled { get; set; }
}
