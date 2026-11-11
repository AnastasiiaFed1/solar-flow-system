
export interface Appliance {
    id: number;
    name: string;
    powerConsumptionWatts: number;
    priority: number;
    isSmartGridEnabled: boolean;
    solarStationId: number;
  }
  
  export interface CreateAppliance {
    name: string;
    powerConsumptionWatts: number;
    priority: number;
    isSmartGridEnabled: boolean;
    solarStationId: number;
  }
  
  export type UpdateAppliance = CreateAppliance;
  
  export interface ApplianceFilters {
    minPower?: number;
    maxPower?: number;
    isActive?: boolean;
  }
  