namespace SolarFlow.Api.Models;

public enum EquipmentType { Panel = 1, Inverter = 2, Battery = 3 }
public enum EquipmentStatus { Active = 1, Warning = 2, Critical = 3 }

public class Equipment
{
    public int Id { get; set; }
    public int SolarStationId { get; set; }
    public SolarStation SolarStation { get; set; } = null!;
    public EquipmentType Type { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public double CapacityKw { get; set; }
    // Ratio from 0 to 1.
    public double EfficiencyFactor { get; set; }
    public EquipmentStatus Status { get; set; } = EquipmentStatus.Active;
}
