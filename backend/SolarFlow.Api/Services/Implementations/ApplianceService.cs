using SolarFlow.Api.Dtos.Appliance;
using SolarFlow.Api.Services.Interfaces;

namespace SolarFlow.Api.Services.Implementations
{
    public class ApplianceService : IApplianceService
    {
        private static readonly List<ApplianceDto> _appliances = new()
        {
            new ApplianceDto { Id = 1, Name = "Холодильник", PowerConsumptionWatts = 150, Priority = 1, IsSmartGridEnabled = false, SolarStationId = 1 },
            new ApplianceDto { Id = 2, Name = "Бойлер", PowerConsumptionWatts = 2000, Priority = 2, IsSmartGridEnabled = true, SolarStationId = 1 },
            new ApplianceDto { Id = 3, Name = "Зарядка EV", PowerConsumptionWatts = 3500, Priority = 3, IsSmartGridEnabled = true, SolarStationId = 1 }
        };

        public async Task<IEnumerable<ApplianceDto>> GetByStationIdAsync(int stationId, int? priority = null, string? search = null)
        {
            var query = _appliances.Where(a => a.SolarStationId == stationId).AsQueryable();

            if (priority.HasValue)
            {
                query = query.Where(a => a.Priority == priority.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(a => a.Name.Contains(search, StringComparison.OrdinalIgnoreCase));
            }

            return await Task.FromResult(query.ToList());
        }

        public async Task<ApplianceDto?> GetByIdAsync(int id)
        {
            var item = _appliances.FirstOrDefault(a => a.Id == id);
            return await Task.FromResult(item);
        }

        public async Task<ApplianceDto> CreateAsync(CreateApplianceDto dto)
        {
            var newId = _appliances.Any() ? _appliances.Max(a => a.Id) + 1 : 1;
            var newAppliance = new ApplianceDto
            {
                Id = newId,
                Name = dto.Name,
                PowerConsumptionWatts = dto.PowerConsumptionWatts,
                Priority = dto.Priority,
                IsSmartGridEnabled = dto.IsSmartGridEnabled,
                SolarStationId = dto.SolarStationId
            };

            _appliances.Add(newAppliance);
            return await Task.FromResult(newAppliance);
        }

        public async Task<bool> UpdateAsync(int id, CreateApplianceDto dto)
        {
            var existing = _appliances.FirstOrDefault(a => a.Id == id);
            if (existing == null) return await Task.FromResult(false);

            existing.Name = dto.Name;
            existing.PowerConsumptionWatts = dto.PowerConsumptionWatts;
            existing.Priority = dto.Priority;
            existing.IsSmartGridEnabled = dto.IsSmartGridEnabled;

            return await Task.FromResult(true);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var existing = _appliances.FirstOrDefault(a => a.Id == id);
            if (existing == null) return await Task.FromResult(false);

            _appliances.Remove(existing);
            return await Task.FromResult(true);
        }
    }
}