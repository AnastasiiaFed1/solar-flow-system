using System.Net;
using Microsoft.AspNetCore.Mvc;

namespace SolarFlow.Api.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (SolarFlow.Api.Services.InvalidSolarStationException ex)
            {
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new ValidationProblemDetails(
                    new Dictionary<string, string[]>
                    {
                        ["SolarStationId"] = new[] { ex.Message }
                    })
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "One or more validation errors occurred.",
                    Instance = context.Request.Path
                }, options: (System.Text.Json.JsonSerializerOptions?)null, contentType: "application/problem+json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            context.Response.ContentType = "application/problem+json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var problemDetails = new ProblemDetails
            {
                Status = context.Response.StatusCode,
                Title = "An unexpected error occurred",
                Detail = exception.Message,
                Instance = context.Request.Path
            };

            return context.Response.WriteAsJsonAsync(problemDetails);
        }
    }
}
