
export interface EnergyMetrics {
    // Поточна генерація сонячних панелей, кВт
    solarPower: number;
  
    // Поточне споживання електроенергії, кВт
    consumptionPower: number;
  
    // Рівень заряду акумулятора, %
    batteryLevel: number;
  
    // Поточна потужність акумулятора, кВт
    // Додатне значення — заряджання
    // Від'ємне значення — розряджання
    batteryPower: number;
  
    // Обмін потужністю із зовнішньою мережею, кВт
    // Додатне значення — імпорт
    // Від'ємне значення — експорт
    gridPower: number;
  
    // Час останнього оновлення даних
    lastUpdated: string;
  }
  
  export type SystemStatus =
    | 'online'
    | 'offline'
    | 'warning';
  
  export interface EnergySystemState {
    metrics: EnergyMetrics;
    status: SystemStatus;
  }
  