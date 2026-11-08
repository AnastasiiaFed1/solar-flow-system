using SolarFlow.Core.ViewModels;

namespace SolarFlow.Mobile.Views;

public partial class StationsPage : ContentPage
{
    public StationsPage(StationsViewModel viewModel)
    {
        InitializeComponent();
        BindingContext = viewModel;
    }
}