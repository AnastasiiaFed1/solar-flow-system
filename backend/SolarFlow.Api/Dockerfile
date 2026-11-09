FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["SolarFlow.Api.csproj", "./"]
RUN dotnet restore "SolarFlow.Api.csproj"
COPY . .
RUN dotnet build "SolarFlow.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "SolarFlow.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=80
EXPOSE 80
EXPOSE 443
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "SolarFlow.Api.dll"]
