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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ApplianceDto>>> GetAll()
        {
            var appliances = await _applianceService.GetAllAsync();
            return Ok(appliances);
        }

        [HttpGet("{id:int}")]
        public async Task<ActionResult<ApplianceDto>> GetById(int id)
        {
            var appliance = await _applianceService.GetByIdAsync(id);
            if (appliance == null)
            {
                return NotFound(new { message = $"Appliance with ID {id} not found." });
            }
            return Ok(appliance);
        }

        [HttpPost]
        public async Task<ActionResult<ApplianceDto>> Create([FromBody] CreateApplianceDto createDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var created = await _applianceService.CreateAsync(createDto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<ApplianceDto>> Update(int id, [FromBody] UpdateApplianceDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var updated = await _applianceService.UpdateAsync(id, updateDto);
            if (updated == null)
            {
                return NotFound(new { message = $"Appliance with ID {id} not found." });
            }

            return Ok(updated);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _applianceService.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound(new { message = $"Appliance with ID {id} not found." });
            }

            return NoContent();
        }
    }
}