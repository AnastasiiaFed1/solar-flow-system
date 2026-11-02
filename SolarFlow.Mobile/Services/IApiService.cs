using SolarFlow.Mobile.Models;

namespace SolarFlow.Mobile.Services;

public interface IApiService
{
    Task<List<SolarStationModel>> GetStationsAsync();
}