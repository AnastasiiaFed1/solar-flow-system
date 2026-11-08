using System.Collections.ObjectModel;
using System.Windows.Input;
using SolarFlow.Core.Models;
using SolarFlow.Core.Services;

namespace SolarFlow.Core.ViewModels;

public class StationsViewModel : BaseViewModel
{
    private readonly IApiService _apiService;

    public ObservableCollection<ApplianceModel> Stations { get; } = new();

    public StationsViewModel(IApiService apiService)
    {
        _apiService = apiService;
        Title = "Сонячні станції Smart Grid";
    }
}