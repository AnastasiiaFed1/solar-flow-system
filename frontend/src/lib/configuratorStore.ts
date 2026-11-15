import { ref, computed, onMounted } from 'vue';
import { getAppliances } from './applianceApi';
import {
    calculateConfiguratorMetrics,
    type SolarConfiguratorParams,
    type BatteryChemistry,
} from './calculations/configurator';

export interface PanelOption {
    id: string;
    label: string;
    watts: number;
    areaM2: number;
}

export interface InverterOption {
    id: string;
    label: string;
    nominalKw: number;
    efficiency: number;
}

export interface CityOption {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    specificYield: number;
    mapX: number; // Позиція піна на мінікарті (%)
    mapY: number;
}

export const PANEL_OPTIONS: PanelOption[] = [
    { id: 'tier1-450', label: 'Tier-1 Monocrystalline 450W', watts: 450, areaM2: 2.0 },
    { id: 'longi-550', label: 'Longi Hi-MO 550W Bifacial', watts: 550, areaM2: 2.4 },
    { id: 'jinko-415', label: 'Jinko Tiger Neo 415W N-Type', watts: 415, areaM2: 1.9 },
];

export const INVERTER_OPTIONS: InverterOption[] = [
    { id: 'deye-5kw', label: 'Deye Hybrid 5.0 kW (1F)', nominalKw: 5.0, efficiency: 97 },
    { id: 'huawei-8kw', label: 'Huawei SUN2000 8.0 kW (3F)', nominalKw: 8.0, efficiency: 98 },
    { id: 'deye-10kw', label: 'Deye Hybrid 10.0 kW (3F)', nominalKw: 10.0, efficiency: 98 },
];

export const CITY_OPTIONS: CityOption[] = [
    { id: 'kyiv', name: 'Київ, Україна', latitude: 50.45, longitude: 30.52, specificYield: 1150, mapX: 52, mapY: 36 },
    { id: 'lviv', name: 'Львів, Україна', latitude: 49.84, longitude: 24.03, specificYield: 1100, mapX: 22, mapY: 44 },
    { id: 'odesa', name: 'Одеса, Україна', latitude: 46.48, longitude: 30.72, specificYield: 1320, mapX: 54, mapY: 76 },
    { id: 'dnipro', name: 'Дніпро, Україна', latitude: 48.46, longitude: 35.04, specificYield: 1240, mapX: 72, mapY: 56 },
];

const STORAGE_KEY = 'solarflow_station_config_v1';

export function createConfiguratorState() {
    const params = ref<SolarConfiguratorParams>({
        panelModelId: 'tier1-450',
        panelWatts: 450,
        panelAreaM2: 2.0,
        panelCount: 12,
        tiltAngle: 30,
        azimuthAngle: 0,
        batteryType: 'LiFePO4',
        batteryCapacityKwh: 10,
        batteryDodPercent: 80,
        cityId: 'kyiv',
        cityName: 'Київ, Україна',
        latitude: 50.45,
        longitude: 30.52,
        specificYieldKwhPerKw: 1150,
        inverterModelId: 'deye-5kw',
        inverterNominalKw: 5.0,
        inverterEfficiencyPercent: 97,
    });

    const isApiOnline = ref(false);
    const systemStatusText = ref('Перевірка статусу системи...');
    const isSaving = ref(false);
    const saveFeedback = ref<string | null>(null);

    const selectedCity = computed(
        () => CITY_OPTIONS.find((c) => c.id === params.value.cityId) ?? CITY_OPTIONS[0]
    );

    const metrics = computed(() => calculateConfiguratorMetrics(params.value));

    const azimuthDirectionLabel = computed(() => {
        const a = params.value.azimuthAngle;
        if (a === 0) return '0° (Південь)';
        if (a < 0) return `${a}° (Пд-Схід)`;
        return `+${a}° (Пд-Захід)`;
    });

    function selectPanelModel(id: string) {
        const found = PANEL_OPTIONS.find((p) => p.id === id);
        if (!found) return;
        params.value.panelModelId = found.id;
        params.value.panelWatts = found.watts;
        params.value.panelAreaM2 = found.areaM2;
    }

    function changePanelCount(delta: number) {
        const next = params.value.panelCount + delta;
        if (next >= 2 && next <= 48) {
            params.value.panelCount = next;
        }
    }

    function selectCity(id: string) {
        const found = CITY_OPTIONS.find((c) => c.id === id);
        if (!found) return;
        params.value.cityId = found.id;
        params.value.cityName = found.name;
        params.value.latitude = found.latitude;
        params.value.longitude = found.longitude;
        params.value.specificYieldKwhPerKw = found.specificYield;
    }

    function selectInverter(id: string) {
        const found = INVERTER_OPTIONS.find((i) => i.id === id);
        if (!found) return;
        params.value.inverterModelId = found.id;
        params.value.inverterNominalKw = found.nominalKw;
        params.value.inverterEfficiencyPercent = found.efficiency;
    }

    function setBatteryType(type: BatteryChemistry) {
        params.value.batteryType = type;
        params.value.batteryDodPercent = type === 'LiFePO4' ? 80 : 50;
    }

    async function initSystemConnection() {
        // 1. Відновлюємо збережений конфіг із localStorage
        try {
            const savedRaw = localStorage.getItem(STORAGE_KEY);
            if (savedRaw) {
                const parsed = JSON.parse(savedRaw);
                params.value = { ...params.value, ...parsed };
            }
        } catch {
            // Ігноруємо помилку читання localStorage
        }

        // 2. Перевіряємо зв'язок із .NET API через робочий AppliancesController
        try {
            await getAppliances();
            isApiOnline.value = true;
            systemStatusText.value = 'Статус системи: API онлайн';
        } catch {
            isApiOnline.value = false;
            systemStatusText.value = 'Статус системи: автономний режим';
        }
    }

    async function saveConfiguration() {
        isSaving.value = true;
        saveFeedback.value = null;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(params.value));
            saveFeedback.value = 'Конфігурацію СЕС успішно збережено!';
        } catch {
            saveFeedback.value = 'Помилка збереження конфігурації у браузері';
        } finally {
            isSaving.value = false;
            setTimeout(() => {
                saveFeedback.value = null;
            }, 3500);
        }
    }

    onMounted(() => {
        initSystemConnection();
    });

    return {
        params,
        metrics,
        selectedCity,
        azimuthDirectionLabel,
        isApiOnline,
        systemStatusText,
        isSaving,
        saveFeedback,
        selectPanelModel,
        changePanelCount,
        selectCity,
        selectInverter,
        setBatteryType,
        saveConfiguration,
    };
}