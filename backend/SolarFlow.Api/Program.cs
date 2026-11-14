using Microsoft.EntityFrameworkCore;
using SolarFlow.Api.Data;
using SolarFlow.Api.Middleware;
using SolarFlow.Api.Models; // якщо клас у Entities — заміни на SolarFlow.Api.Entities
using SolarFlow.Api.Services.Implementations;
using SolarFlow.Api.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// 1. Реєстрація сервісів у контейнері DI (ДО builder.Build())
builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("SolarFlowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4321")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddSolarDatabase(builder.Configuration);
builder.Services.AddScoped<IApplianceService, ApplianceService>();

var app = builder.Build();

// Ініціалізація бази даних та базової станції в Development або при увімкненому SeedDemoData
if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Database:SeedDemoData"))
{
    await using var scope = app.Services.CreateAsyncScope();
    var database = scope.ServiceProvider.GetRequiredService<SolarFlowDbContext>();
    await database.Database.MigrateAsync();

    if (!await database.SolarStations.AnyAsync())
    {
        database.SolarStations.Add(new SolarStation
        {
            Id = 1,
            Name = "SolarFlow Station #1",
            Latitude = 50.45,
            Longitude = 30.52,
            TiltAngle = 30,
            AzimuthAngle = 180,
            UserId = "default-user"
        });
        await database.SaveChangesAsync();
    }
}

// 2. Налаштування конвеєра обробки HTTP-запитів (Middleware)
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("SolarFlowFrontend");
app.MapControllers();

app.Run();