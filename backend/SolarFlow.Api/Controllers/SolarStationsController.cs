using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SolarFlow.Api.Data;

namespace SolarFlow.Api.Controllers;

[ApiController]
[Route("api/stations")]
public sealed class SolarStationsController(SolarFlowDbContext database) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<StationSummary>>> GetAll(CancellationToken cancellationToken)
    {
        var stations = await database.SolarStations
            .AsNoTracking()
            .OrderBy(station => station.Name)
            .ThenBy(station => station.Id)
            .Select(station => new StationSummary(station.Id, station.Name, station.TiltAngle, station.AzimuthAngle))
            .ToListAsync(cancellationToken);

        return Ok(stations);
    }

    public sealed record StationSummary(int Id, string Name, double TiltAngle, double AzimuthAngle);
}
