using SolarFlow.Api.Dtos.Appliance;

namespace SolarFlow.Api.Services.Interfaces
{
    public interface IApplianceService
    {
        Task<IEnumerable<ApplianceDto>> GetAllAsync();
        Task<ApplianceDto?> GetByIdAsync(int id);
        Task<ApplianceDto> CreateAsync(CreateApplianceDto createDto);
        Task<ApplianceDto?> UpdateAsync(int id, UpdateApplianceDto updateDto);
        Task<bool> DeleteAsync(int id);
    }
}