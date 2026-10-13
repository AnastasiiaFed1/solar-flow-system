using System.ComponentModel.DataAnnotations;

namespace SolarFlow.Api.Dtos.Appliance
{
    public class CreateApplianceDto
    {
        [Required(ErrorMessage = "Назва приладу є обов'язковою")]
        [StringLength(100, ErrorMessage = "Назва не може перевищувати 100 символів")]
        public string Name { get; set; } = string.Empty;

        [Range(1, 15000, ErrorMessage = "Потужність має бути від 1 до 15000 Вт")]
        public double PowerConsumptionWatts { get; set; }

        [Range(1, 3, ErrorMessage = "Пріоритет має бути 1 (Критичний), 2 (Середній) або 3 (Гнучкий)")]
        public int Priority { get; set; }

        public bool IsSmartGridEnabled { get; set; } = false;

        [Required]
        public int SolarStationId { get; set; }
    }
}