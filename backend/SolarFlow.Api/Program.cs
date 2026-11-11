using Microsoft.EntityFrameworkCore;
using SolarFlow.Api.Data;
using SolarFlow.Api.Middleware;
using SolarFlow.Api.Services.Implementations;
using SolarFlow.Api.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// 1. Реєстрація сервісів у контейнері DI (ДО builder.Build())
builder.Services.AddControllers(); // Додаємо підтримку контролерів
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


// Select provider and validate database configuration before startup.
builder.Services.AddSolarDatabase(builder.Configuration);

// Реєстрація вашого сервісу для приладів
builder.Services.AddScoped<IApplianceService, ApplianceService>();

var app = builder.Build();

// Demo initialization is opt-in; production default never migrates or seeds on startup.
if (app.Configuration.GetValue<bool>("Database:SeedDemoData"))
{
    await using var scope = app.Services.CreateAsyncScope();
    var database = scope.ServiceProvider.GetRequiredService<SolarFlowDbContext>();
    await database.Database.MigrateAsync();
}

// 2. Налаштування конвеєра обробки HTTP-запитів (Middleware)
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}


app.UseHttpsRedirection();

app.UseCors("SolarFlowFrontend");

// Мапінг маршрутів для контролерів ([ApiController])
app.MapControllers();


app.Run();