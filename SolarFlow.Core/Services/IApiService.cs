using SolarFlow.Core.Models;

namespace SolarFlow.Core.Services;

public interface IApiService
{
    Task<List<ApplianceModel>> GetAppliancesAsync();
}