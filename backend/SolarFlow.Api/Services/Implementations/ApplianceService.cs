using Microsoft.EntityFrameworkCore;
using SolarFlow.Api.Data;
using SolarFlow.Api.Dtos.Appliance;
using SolarFlow.Api.Models;
using SolarFlow.Api.Services.Interfaces;

namespace SolarFlow.Api.Services.Implementations
{
    public class ApplianceService : IApplianceService
    {
        private readonly SolarFlowDbContext _context;

        public ApplianceService(SolarFlowDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ApplianceDto>> GetAllAsync(double? minPower = null, double? maxPower = null, bool? isActive = null)
        {
            var query = _context.Appliances.AsNoTracking().AsQueryable();

            // LINQ-фільтрація
            if (minPower.HasValue)
            {
                query = query.Where(a => a.PowerWatts >= minPower.Value);
            }

            if (maxPower.HasValue)
            {
                query = query.Where(a => a.PowerWatts <= maxPower.Value);
            }

            if (isActive.HasValue)
            {
                query = query.Where(a => a.IsActive == isActive.Value);
            }

            return await query
                .Select(a => MapToDto(a))
                .ToListAsync();
        }

        public async Task<ApplianceDto?> GetByIdAsync(int id)
        {
            var appliance = await _context.Appliances.FindAsync(id);
            return appliance == null ? null : MapToDto(appliance);
        }

        public async Task<ApplianceDto> CreateAsync(CreateApplianceDto createDto)
        {
            var appliance = new Appliance
            {
                Name = createDto.Name,
                PowerWatts = createDto.PowerConsumptionWatts,
                IsActive = createDto.IsSmartGridEnabled
            };

            _context.Appliances.Add(appliance);
            await _context.SaveChangesAsync();

            return MapToDto(appliance);
        }

        public async Task<ApplianceDto?> UpdateAsync(int id, UpdateApplianceDto updateDto)
        {
            var appliance = await _context.Appliances.FindAsync(id);
            if (appliance == null) return null;

            appliance.Name = updateDto.Name;
            appliance.PowerWatts = updateDto.PowerConsumptionWatts;
            appliance.IsActive = updateDto.IsSmartGridEnabled;

            await _context.SaveChangesAsync();
            return MapToDto(appliance);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var appliance = await _context.Appliances.FindAsync(id);
            if (appliance == null) return false;

            _context.Appliances.Remove(appliance);
            await _context.SaveChangesAsync();
            return true;
        }

        private static ApplianceDto MapToDto(Appliance appliance)
        {
            return new ApplianceDto
            {
                Id = appliance.Id,
                Name = appliance.Name,
                PowerConsumptionWatts = appliance.PowerWatts,
                Priority = 1, // Значення за замовчуванням для DTO
                IsSmartGridEnabled = appliance.IsActive,
                SolarStationId = 1 // Значення за замовчуванням для DTO
            };
        }
    }
}