using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using SolarFlow.Api.Middleware;
using SolarFlow.Api.Services;

namespace SolarFlow.Api.Tests;

public class ErrorHandlingTests
{
    [Fact]
    public async Task UnknownStationProducesValidationProblemInsteadOfServerError()
    {
        var context = new DefaultHttpContext();
        context.Request.Path = "/api/appliances";
        context.Response.Body = new MemoryStream();
        var middleware = new ExceptionHandlingMiddleware(
            _ => throw new InvalidSolarStationException(999),
            NullLogger<ExceptionHandlingMiddleware>.Instance);
        await middleware.InvokeAsync(context);
        Assert.Equal(400, context.Response.StatusCode);
        Assert.StartsWith("application/problem+json", context.Response.ContentType);
        context.Response.Body.Position = 0;
        using var body = await System.Text.Json.JsonDocument.ParseAsync(context.Response.Body);
        Assert.True(body.RootElement.GetProperty("errors").TryGetProperty("SolarStationId", out _));
    }
}
