namespace SolarFlow.Api.Models;

public class Appliance
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double PowerWatts { get; set; }
    public bool IsActive { get; set; }
}