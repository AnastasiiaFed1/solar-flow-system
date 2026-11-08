namespace SolarFlow.Core.Models;

public class SolarStationModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public double TotalCapacityKw { get; set; }
}