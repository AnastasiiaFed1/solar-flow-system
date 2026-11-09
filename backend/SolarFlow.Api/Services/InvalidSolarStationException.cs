namespace SolarFlow.Api.Services;

public sealed class InvalidSolarStationException : Exception
{
    public InvalidSolarStationException(int stationId)
        : base($"Solar station with ID {stationId} does not exist.") { }
}
