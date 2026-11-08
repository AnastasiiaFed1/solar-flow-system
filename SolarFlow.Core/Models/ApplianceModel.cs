namespace SolarFlow.Core.Models;

public class ApplianceModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double PowerConsumptionWatts { get; set; }
    public bool IsActive { get; set; }
}