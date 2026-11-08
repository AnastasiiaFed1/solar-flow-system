using System.Collections.ObjectModel;
using System.Windows.Input;
using SolarFlow.Core.Models;
using SolarFlow.Core.Services;

namespace SolarFlow.Core.ViewModels;

public class StationDetailViewModel : BaseViewModel
{
    private readonly IApiService _apiService;

    public ObservableCollection<ApplianceModel> Appliances { get; } = new();
    public ICommand LoadAppliancesCommand { get; }

    public StationDetailViewModel(IApiService apiService)
    {
        _apiService = apiService;
        Title = "Керування приладами Smart Grid";
        LoadAppliancesCommand = new Command(async () => await LoadAppliances());
    }

    public async Task LoadAppliances()
    {
        if (IsBusy) return;
        IsBusy = true;
        try
        {
            var data = await _apiService.GetAppliancesAsync();
            Appliances.Clear();
            foreach (var item in data)
            {
                Appliances.Add(item);
            }
        }
        catch (Exception ex)
        {
            if (Shell.Current != null)
            {
                await Shell.Current.DisplayAlert("Помилка", $"Не вдалося завантажити прилади: {ex.Message}", "OK");
            }
        }
        finally
        {
            IsBusy = false;
        }
    }
}