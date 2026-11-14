import { ref, computed, onMounted } from 'vue';
import { getAppliances } from './applianceApi';
import {
    calculateFinanceAndEco,
    type FinanceParams,
} from './calculations/finance';

export interface ApplianceItem {
    id: number;
    name: string;
    powerConsumptionWatts?: number;
    powerWatts?: number;
    isSmartGridEnabled?: boolean;
    isActive?: boolean;
}

export function createFinanceEcoState() {
    const params = ref<FinanceParams>({
        systemPowerKw: 8.5,
        installationCostUah: 205000,
        electricityTariffUah: 4.32,
        exportTariffUah: 5.20,
        monthlyConsumptionKwh: 430,
        selfConsumptionRatio: 0.60,
        specificYieldKwhPerKw: 1150,
    });

    // Стан для перемикання даних Smart Grid (Застосувати / Повернути)
    const isSmartGridApplied = ref(false);
    const previousConsumptionKwh = ref<number | null>(null);

    const isSavingsEnabled = ref(true);
    const isPaybackGaugeActive = ref(true);
    const isTariffsActive = ref(true);
    const isNetMeteringActive = ref(true);
    const isEditingTariffs = ref(false);
    const analyticsPeriod = ref<'weekly' | 'monthly'>('weekly');

    const appliances = ref<ApplianceItem[]>([]);
    const isLoadingApi = ref(false);
    const isApiConnected = ref(false);
    const apiStatusText = ref('Підключення до сервера...');

    // Потужність активних приладів зі Smart Grid
    const activeAppliancesWatts = computed(() =>
        appliances.value
            .filter((item) => item.isSmartGridEnabled ?? item.isActive ?? true)
            .reduce((sum, item) => sum + (item.powerConsumptionWatts ?? item.powerWatts ?? 0), 0)
    );

    const estimatedAppliancesMonthlyKwh = computed(() => {
        if (activeAppliancesWatts.value <= 0) return 0;
        return Math.round((activeAppliancesWatts.value / 1000) * 4.5 * 30);
    });

    const metrics = computed(() => calculateFinanceAndEco(params.value));

    const currentAnalyticsSeries = computed(() =>
        analyticsPeriod.value === 'weekly'
            ? metrics.value.weeklyAnalytics
            : metrics.value.monthlyAnalytics
    );

    const exportSharePercent = computed(() => {
        const total = metrics.value.monthlyExportKwh + metrics.value.monthlyImportKwh;
        if (total <= 0) return 50;
        return Math.round((metrics.value.monthlyExportKwh / total) * 100);
    });

    async function syncWithBackend() {
        isLoadingApi.value = true;
        try {
            const data = await getAppliances();
            appliances.value = Array.isArray(data) ? (data as ApplianceItem[]) : [];
            isApiConnected.value = true;
            apiStatusText.value =
                appliances.value.length > 0
                    ? `Синхронізовано (${appliances.value.length} приладів)`
                    : 'API підключено (прилади відсутні)';
        } catch {
            isApiConnected.value = false;
            apiStatusText.value = 'Автономний режим (API недоступне)';
        } finally {
            isLoadingApi.value = false;
        }
    }

    // Перемикач: застосовує дані Smart Grid або повертає попереднє значення
    function toggleSmartGridConsumption() {
        if (estimatedAppliancesMonthlyKwh.value <= 0) return;

        if (!isSmartGridApplied.value) {
            previousConsumptionKwh.value = params.value.monthlyConsumptionKwh;
            params.value.monthlyConsumptionKwh = estimatedAppliancesMonthlyKwh.value;
            isSmartGridApplied.value = true;
        } else {
            params.value.monthlyConsumptionKwh = previousConsumptionKwh.value ?? 430;
            previousConsumptionKwh.value = null;
            isSmartGridApplied.value = false;
        }
    }

    function toggleEditTariffs() {
        isEditingTariffs.value = !isEditingTariffs.value;
    }

    onMounted(() => {
        syncWithBackend();
    });

    return {
        params,
        metrics,
        isSmartGridApplied,
        previousConsumptionKwh,
        isSavingsEnabled,
        isPaybackGaugeActive,
        isTariffsActive,
        isNetMeteringActive,
        isEditingTariffs,
        analyticsPeriod,
        currentAnalyticsSeries,
        exportSharePercent,
        appliances,
        isLoadingApi,
        isApiConnected,
        apiStatusText,
        estimatedAppliancesMonthlyKwh,
        syncWithBackend,
        toggleSmartGridConsumption,
        toggleEditTariffs,
    };
}