using Moq;
using SolarFlow.Core.Models;
using SolarFlow.Core.Services;
using SolarFlow.Core.ViewModels;
using Xunit;

namespace SolarFlow.Mobile.Tests;

public class StationDetailViewModelTests
{
    [Fact]
    public async Task LoadAppliances_ShouldPopulateAppliancesCollection_WhenApiReturnsData()
    {
        // Arrange
        var mockApiService = new Mock<IApiService>();
        var fakeAppliances = new List<ApplianceModel>
        {
            new ApplianceModel { Id = 1, Name = "Inverter 1", PowerConsumptionWatts = 3500, IsActive = true },
            new ApplianceModel { Id = 2, Name = "Battery Bank", PowerConsumptionWatts = 1200, IsActive = true }
        };

        mockApiService
            .Setup(service => service.GetAppliancesAsync())
            .ReturnsAsync(fakeAppliances);

        var viewModel = new StationDetailViewModel(mockApiService.Object);

        // Act
        await viewModel.LoadAppliances();

        // Assert
        Assert.Equal(2, viewModel.Appliances.Count);
        Assert.Equal("Inverter 1", viewModel.Appliances[0].Name);
        mockApiService.Verify(service => service.GetAppliancesAsync(), Times.Once);
    }
}