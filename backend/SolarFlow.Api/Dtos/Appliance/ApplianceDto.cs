namespace SolarFlow.Api.Dtos.Appliance
{
    public class ApplianceDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public double PowerConsumptionWatts { get; set; }
        public int Priority { get; set; }
        public bool IsSmartGridEnabled { get; set; }
        public int SolarStationId { get; set; }
    }
}