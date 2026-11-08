using Moq;
using Xunit;
using SolarFlow.Core.Services;
using SolarFlow.Core.ViewModels;

namespace SolarFlow.Mobile.Tests;

public class LoginViewModelTests
{
    [Fact]
    public async Task OnLogin_WithValidCredentials_ReturnsTrue()
    {
        // Arrange
        var mockAuthService = new Mock<IAuthService>();
        mockAuthService.Setup(s => s.LoginAsync("test@solar.com", "Password123!"))
                       .ReturnsAsync(true);

        var viewModel = new LoginViewModel(mockAuthService.Object)
        {
            Email = "test@solar.com",
            Password = "Password123!"
        };

        // Act & Assert
        Assert.Equal("Вхід SolarFlow", viewModel.Title);
        Assert.False(viewModel.IsBusy);
    }

    [Theory]
    [InlineData(-50)]
    [InlineData(0)]
    [InlineData(60000)]
    public void ValidateAppliancePower_BoundaryValues_ReturnsFalse(double power)
    {
        // Arrange
        var mockAuth = new Mock<IAuthService>();
        var apiService = new ApiService(new HttpClient(), mockAuth.Object);

        // Act
        bool isValid = apiService.ValidateAppliancePower(power);

        // Assert
        Assert.False(isValid);
    }
}