import { ref, computed, watch } from 'vue';
import {
    calculateSolarSystemMetrics,
    calculateLocationSolarProfile,
    type SolarConfiguratorParams,
} from './calculations/configurator';
import {
    getAppliances,
    createAppliance,
    updateAppliance,
} from './applianceApi';

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
    defaultEfficiency: number;
}

export interface CityOption {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    specificYield: number;
}

export const PANEL_OPTIONS: PanelOption[] = [
    { id: 'tier1-450', label: 'Tier-1 Monocrystalline 450W', watts: 450, areaM2: 2.0 },
    { id: 'n-type-550', label: 'N-Type Bifacial 550W', watts: 550, areaM2: 2.58 },
    { id: 'perc-400', label: 'Mono PERC Black 400W', watts: 400, areaM2: 1.92 },
];

export const INVERTER_OPTIONS: InverterOption[] = [
    { id: 'deye-5kw', label: 'Deye Hybrid 5.0 kW (1F)', nominalKw: 5.0, defaultEfficiency: 97 },
    { id: 'deye-10kw', label: 'Deye Hybrid 10.0 kW (3F)', nominalKw: 10.0, defaultEfficiency: 98 },
    { id: 'huawei-8kw', label: 'Huawei SUN2000 8.0 kW', nominalKw: 8.0, defaultEfficiency: 98 },
];

export const CITY_OPTIONS: CityOption[] = [
    { id: 'kyiv', name: 'Київ, Україна', latitude: 50.45, longitude: 30.52, specificYield: 1120 },
    { id: 'lviv', name: 'Львів, Україна', latitude: 49.84, longitude: 24.03, specificYield: 1080 },
    { id: 'odesa', name: 'Одеса, Україна', latitude: 46.48, longitude: 30.72, specificYield: 1290 },
    { id: 'dnipro', name: 'Дніпро, Україна', latitude: 48.46, longitude: 35.05, specificYield: 1210 },
    { id: 'madrid', name: 'Мадрид, Іспанія', latitude: 40.42, longitude: -3.7, specificYield: 1580 },
    { id: 'sydney', name: 'Сідней, Австралія', latitude: -33.87, longitude: 151.21, specificYield: 1490 },
];

const STORAGE_KEY = 'solarflow_ses_config_v2';
const SYSTEM_CONFIG_RECORD_NAME = '__SOLARFLOW_SES_CONFIG__';

export const DEFAULT_CONFIG: SolarConfiguratorParams = {
    panelModelId: 'tier1-450',
    panelWatts: 450,
    panelCount: 12,
    panelAreaM2: 2.0,
    cityId: 'kyiv',
    locationLabel: 'Київ, Україна',
    latitude: 50.45,
    longitude: 30.52,
    specificYield: 1120,
    tiltAngle: 41,
    azimuthAngle: 0,
    inverterModelId: 'deye-5kw',
    inverterNominalKw: 5.0,
    inverterEfficiencyPercent: 97,
    batteryType: 'LiFePO4',
    batteryCapacityKwh: 10,
    batteryDodPercent: 80,
};

export function formatAzimuthDirection(deg: number): string {
    const abs = Math.abs(deg);
    if (abs <= 15) return `${deg}° (Південь)`;
    if (abs >= 165) return `${deg}° (Північ)`;
    if (deg < -15 && deg > -75) return `${deg}° (Пд-Схід)`;
    if (deg <= -75 && deg >= -105) return `${deg}° (Схід)`;
    if (deg < -105 && deg > -165) return `${deg}° (Пн-Схід)`;
    if (deg > 15 && deg < 75) return `${deg}° (Пд-Захід)`;
    if (deg >= 75 && deg <= 105) return `${deg}° (Захід)`;
    return `${deg}° (Пн-Захід)`;
}

export function createConfiguratorState() {
    let initial: SolarConfiguratorParams = { ...DEFAULT_CONFIG };
    if (typeof window !== 'undefined') {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (saved) {
                initial = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
            }
        } catch {
            // Ігноруємо пошкоджений localStorage
        }
    }

    const params = ref<SolarConfiguratorParams>(initial);
    const isApiOnline = ref<boolean>(false);
    const isSaving = ref<boolean>(false);
    const saveFeedback = ref<string>('');
    const backendConfigId = ref<number | null>(null);
    const defaultStationId = ref<number>(1);

    const metrics = computed(() => calculateSolarSystemMetrics(params.value));

    const azimuthDirectionLabel = computed(() =>
        formatAzimuthDirection(params.value.azimuthAngle)
    );

    const recommendedAzimuthLabel = computed(() =>
        formatAzimuthDirection(metrics.value.recommendedAzimuth)
    );

    const systemStatusText = computed(() =>
        isApiOnline.value ? 'Статус системи: API онлайн' : 'Статус системи: Локальний режим'
    );

    watch(
        params,
        (newVal) => {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(newVal));
            }
        },
        { deep: true }
    );

    async function syncWithBackend() {
        try {
            const list = await getAppliances();
            isApiOnline.value = true;
            if (list.length > 0 && typeof list[0].solarStationId === 'number') {
                defaultStationId.value = list[0].solarStationId;
            }
            const existing = list.find(
                (item) => item.name === SYSTEM_CONFIG_RECORD_NAME
            );
            if (existing) {
                backendConfigId.value = existing.id;
            }
        } catch {
            isApiOnline.value = false;
        }
    }

    function selectPanelModel(modelId: string) {
        const found = PANEL_OPTIONS.find((p) => p.id === modelId);
        if (!found) return;
        params.value.panelModelId = found.id;
        params.value.panelWatts = found.watts;
        params.value.panelAreaM2 = found.areaM2;
    }

    function changePanelCount(delta: number) {
        const next = params.value.panelCount + delta;
        if (next >= 1 && next <= 120) {
            params.value.panelCount = next;
        }
    }

    function selectCity(cityId: string) {
        if (cityId === 'custom') return;
        const found = CITY_OPTIONS.find((c) => c.id === cityId);
        if (!found) return;

        const profile = calculateLocationSolarProfile(found.latitude);
        params.value.cityId = found.id;
        params.value.locationLabel = found.name;
        params.value.latitude = found.latitude;
        params.value.longitude = found.longitude;
        params.value.specificYield = found.specificYield;
        params.value.tiltAngle = profile.recommendedTilt;
        params.value.azimuthAngle = profile.recommendedAzimuth;
    }

    async function setCustomCoordinates(lat: number, lng: number) {
        const roundedLat = Number(lat.toFixed(4));
        const roundedLng = Number(lng.toFixed(4));
        const profile = calculateLocationSolarProfile(roundedLat);

        const nearbyCity = CITY_OPTIONS.find(
            (c) => Math.abs(c.latitude - roundedLat) < 0.08 && Math.abs(c.longitude - roundedLng) < 0.08
        );

        params.value.cityId = nearbyCity ? nearbyCity.id : 'custom';
        params.value.latitude = roundedLat;
        params.value.longitude = roundedLng;
        params.value.specificYield = nearbyCity
            ? nearbyCity.specificYield
            : profile.estimatedSpecificYield;

        // Автоматично вираховуємо і застосовуємо рекомендований кут нахилу та азимут
        params.value.tiltAngle = profile.recommendedTilt;
        params.value.azimuthAngle = profile.recommendedAzimuth;

        if (nearbyCity) {
            params.value.locationLabel = nearbyCity.name;
            return;
        }

        // Поки завантажується назва міста, показуємо координати
        params.value.locationLabel = `${Math.abs(roundedLat).toFixed(2)}°${roundedLat >= 0 ? 'N' : 'S'}, ${Math.abs(roundedLng).toFixed(2)}°${roundedLng >= 0 ? 'E' : 'W'}`;

        // Визначаємо реальну назву міста та країни через безкоштовний OpenStreetMap Nominatim
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${roundedLat}&lon=${roundedLng}&zoom=10&accept-language=en`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const addr = data.address || {};
                const place =
                    addr.city ||
                    addr.town ||
                    addr.village ||
                    addr.state ||
                    addr.region;
                const country = addr.country;

                if (place && country) {
                    params.value.locationLabel = `${place}, ${country}`;
                } else if (country) {
                    params.value.locationLabel = country;
                }
            }
        } catch {
            // Якщо офлайн — залишаються координати
        }
    }

    function applyRecommendedOrientation() {
        params.value.tiltAngle = metrics.value.recommendedTilt;
        params.value.azimuthAngle = metrics.value.recommendedAzimuth;
    }

    function selectInverter(invId: string) {
        const found = INVERTER_OPTIONS.find((i) => i.id === invId);
        if (!found) return;
        params.value.inverterModelId = found.id;
        params.value.inverterNominalKw = found.nominalKw;
        params.value.inverterEfficiencyPercent = found.defaultEfficiency;
    }

    function setBatteryType(type: 'LiFePO4' | 'AGM/GEL') {
        params.value.batteryType = type;
        if (type === 'LiFePO4' && params.value.batteryDodPercent < 75) {
            params.value.batteryDodPercent = 80;
        }
        if (type === 'AGM/GEL' && params.value.batteryDodPercent > 60) {
            params.value.batteryDodPercent = 50;
        }
    }

    async function saveConfiguration() {
        isSaving.value = true;
        saveFeedback.value = '';
        try {
            if (typeof window !== 'undefined') {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(params.value));
            }

            const payload = {
                name: SYSTEM_CONFIG_RECORD_NAME,
                powerConsumptionWatts: Math.round(metrics.value.peakPowerKwp * 1000),
                priority: 1,
                isSmartGridEnabled: true,
                solarStationId: defaultStationId.value,
            };

            if (backendConfigId.value !== null) {
                await updateAppliance(backendConfigId.value, payload);
            } else {
                const created = await createAppliance(payload);
                backendConfigId.value = created.id;
            }

            isApiOnline.value = true;
            saveFeedback.value = 'Конфігурацію збережено у системі та синхронізовано з API!';
        } catch {
            isApiOnline.value = false;
            saveFeedback.value = 'Збережено локально у браузері (API недоступний).';
        } finally {
            isSaving.value = false;
            setTimeout(() => {
                saveFeedback.value = '';
            }, 4000);
        }
    }

    if (typeof window !== 'undefined') {
        syncWithBackend();
    }

    return {
        params,
        metrics,
        azimuthDirectionLabel,
        recommendedAzimuthLabel,
        isApiOnline,
        systemStatusText,
        isSaving,
        saveFeedback,
        selectPanelModel,
        changePanelCount,
        selectCity,
        setCustomCoordinates,
        applyRecommendedOrientation,
        selectInverter,
        setBatteryType,
        saveConfiguration,
    };
}