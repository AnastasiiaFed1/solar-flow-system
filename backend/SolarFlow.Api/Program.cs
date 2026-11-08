using Microsoft.EntityFrameworkCore;
using SolarFlow.Api.Data;
using SolarFlow.Api.Services.Implementations;
using SolarFlow.Api.Services.Interfaces;

var builder = WebApplication.CreateBuilder(args);

// 1. Реєстрація сервісів у контейнері DI (ДО builder.Build())
builder.Services.AddControllers(); // Додаємо підтримку контролерів
builder.Services.AddOpenApi();

// Реєстрація DbContext із Scoped lifetime для SQLite
builder.Services.AddDbContext<SolarFlowDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Реєстрація вашого сервісу для приладів
builder.Services.AddScoped<IApplianceService, ApplianceService>();

var app = builder.Build();

// 2. Налаштування конвеєра обробки HTTP-запитів (Middleware)
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Мапінг маршрутів для контролерів ([ApiController])
app.MapControllers();

app.Run();