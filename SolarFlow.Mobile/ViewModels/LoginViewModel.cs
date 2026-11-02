using System.Windows.Input;
using SolarFlow.Mobile.Services;

namespace SolarFlow.Mobile.ViewModels;

public class LoginViewModel : BaseViewModel
{
    private readonly IAuthService _authService;
    private string _email = string.Empty;
    private string _password = string.Empty;

    public string Email { get => _email; set { _email = value; OnPropertyChanged(); } }
    public string Password { get => _password; set { _password = value; OnPropertyChanged(); } }
    public ICommand LoginCommand { get; }

    public LoginViewModel(IAuthService authService)
    {
        _authService = authService;
        Title = "Вхід SolarFlow";
        LoginCommand = new Command(async () => await OnLogin());
    }

    private async Task OnLogin()
    {
        if (IsBusy) return;
        IsBusy = true;
        bool ok = await _authService.LoginAsync(Email, Password);
        IsBusy = false;

        if (ok) await Shell.Current.GoToAsync("//StationsPage");
        else await Shell.Current.DisplayAlert("Помилка", "Невірно введені дані", "OK");
    }
}