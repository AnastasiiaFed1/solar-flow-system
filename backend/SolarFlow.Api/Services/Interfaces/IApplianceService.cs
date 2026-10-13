using SolarFlow.Api.Dtos.Appliance;

namespace SolarFlow.Api.Services.Interfaces
{
    public interface IApplianceService
    {
        Task<IEnumerable<ApplianceDto>> GetByStationIdAsync(int stationId, int? priority = null, string? search = null);
        Task<ApplianceDto?> GetByIdAsync(int id);
        Task<ApplianceDto> CreateAsync(CreateApplianceDto dto);
        Task<bool> UpdateAsync(int id, CreateApplianceDto dto);
        Task<bool> DeleteAsync(int id);
    }
}