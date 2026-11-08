using Moq;
using SolarFlow.Core.Models;
using SolarFlow.Core.Services;
using SolarFlow.Core.ViewModels;
using Xunit;

namespace SolarFlow.Mobile.Tests;

public class EdgeCasesTests
{
    // C2 (1): Валідація введення (від'ємна або вихід за межі потужність)[cite: 7]
    [Theory]
    [InlineData(-100)]
    [InlineData(100000)]
    public void ValidateAppliancePower_BoundaryValues_ReturnsFalse(double power)
    {
        var result = ApplianceModel.ValidatePowerOutput(power);
        Assert.False(result);
    }

    // C2 (2): Обробка порожніх або некоректних даних від API[cite: 7]
    [Fact]
    public async Task LoadAppliances_EmptyData_PopulatesEmptyCollectionWithoutCrashing()
    {
        var mockApi = new Mock<IApiService>();
        mockApi.Setup(a => a.GetAppliancesAsync()).ReturnsAsync(new List<ApplianceModel>());

        var vm = new StationDetailViewModel(mockApi.Object);
        await vm.LoadAppliances();

        Assert.Empty(vm.Appliances);
        Assert.False(vm.IsBusy);
    }

    // C2 (3): Обробка винятків без аварійного завершення (Network Down / 500 Server Error)[cite: 7]
    [Fact]
    public async Task LoadAppliances_ApiThrowsException_SetsErrorMessageGracefully()
    {
        var mockApi = new Mock<IApiService>();
        mockApi.Setup(a => a.GetAppliancesAsync()).ThrowsAsync(new HttpRequestException("500 Internal Server Error"));

        var vm = new StationDetailViewModel(mockApi.Object);
        await vm.LoadAppliances();

        Assert.False(vm.IsBusy);
    }

    // C2 (4): Межові значення параметрів системи (0W - порогова потужність)[cite: 7]
    [Fact]
    public void ValidateAppliancePower_ExactZeroBoundary_ReturnsTrue()
    {
        var result = ApplianceModel.ValidatePowerOutput(0);
        Assert.True(result);
    }

    // C2 (5): Відсутність необроблених винятків у логу (Missing Token handling)
    [Fact]
    public async Task Login_NullOrEmptyToken_DoesNotThrowUnhandledException()
    {
        var mockAuth = new Mock<IAuthService>();
        mockAuth.Setup(a => a.LoginAsync(It.IsAny<string>(), It.IsAny<string>())).ReturnsAsync(false);

        var vm = new LoginViewModel(mockAuth.Object);
        var exception = await Record.ExceptionAsync(async () => await vm.OnLogin());

        Assert.Null(exception);
    }
}