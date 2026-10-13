using Microsoft.AspNetCore.Mvc;
using SolarFlow.Api.Dtos.Appliance;
using SolarFlow.Api.Services.Interfaces;

namespace SolarFlow.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppliancesController : ControllerBase
    {
        private readonly IApplianceService _applianceService;

        public AppliancesController(IApplianceService applianceService)
        {
            _applianceService = applianceService;
        }

        [HttpGet("station/{stationId}")]
        public async Task<ActionResult<IEnumerable<ApplianceDto>>> GetByStation(
            int stationId,
            [FromQuery] int? priority,
            [FromQuery] string? search)
        {
            var result = await _applianceService.GetByStationIdAsync(stationId, priority, search);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ApplianceDto>> GetById(int id)
        {
            var result = await _applianceService.GetByIdAsync(id);
            if (result == null)
                return NotFound(new { message = $"Прилад з ID {id} не знайдено" });

            return Ok(result);
        }

        [HttpPost]
        public async Task<ActionResult<ApplianceDto>> Create([FromBody] CreateApplianceDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var created = await _applianceService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateApplianceDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updated = await _applianceService.UpdateAsync(id, dto);
            if (!updated)
                return NotFound(new { message = $"Прилад з ID {id} не знайдено" });

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _applianceService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = $"Прилад з ID {id} не знайдено" });

            return Ok(new { message = "Прилад успішно видалено" });
        }
    }
}