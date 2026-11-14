export interface FinanceParams {
    systemPowerKw: number;         // Потужність СЕС, кВт
    installationCostUah: number;   // Вартість встановлення, грн
    electricityTariffUah: number;  // Тариф мережі, грн/кВт·год
    exportTariffUah: number;       // Зелений тариф / експорт, грн/кВт·год
    monthlyConsumptionKwh: number; // Місячне споживання будинку (Імпорт / навантаження), кВт·год
    selfConsumptionRatio: number;  // Частка власного споживання (0..1)
    specificYieldKwhPerKw: number; // Річна генерація з 1 кВт (~1150 кВт·год/кВт)
}

export interface AnalyticsPoint {
    label: string;
    incomeUah: number;
    expenseUah: number;
}

export interface MonthlyEcoImpact {
    treesSavedPerMonth: number;
    co2SavedKgPerMonth: number;
    carKmAvoidedPerMonth: number;
    co2SavedTonsPerYear: number;
}

export interface FinanceCalculationResult {
    monthlyGenerationKwh: number;
    monthlyExportKwh: number;
    monthlyImportKwh: number;
    monthlySelfConsumedKwh: number;
    monthlySavingsUah: number;
    monthlyExportIncomeUah: number;
    totalMonthlyBenefitUah: number;
    paybackYears: number;
    paybackProgressPercent: number;
    weeklyAnalytics: AnalyticsPoint[];
    monthlyAnalytics: AnalyticsPoint[];
    ecoImpact: MonthlyEcoImpact;
}

// Коефіцієнти перерахунку екологічного ефекту
const CO2_KG_PER_KWH = 0.42;
const CO2_KG_PER_TREE_MONTH = 1.82; // ~21.8 кг/рік на 1 доросле дерево
const CO2_KG_PER_CAR_KM = 0.2;    // ~200 г CO2 на 1 км авто

const WEEKLY_SHARES = [
    { label: 'Пн', genFactor: 0.95, loadFactor: 1.0 },
    { label: 'Вт', genFactor: 1.15, loadFactor: 0.9 },
    { label: 'Ср', genFactor: 1.05, loadFactor: 1.05 },
    { label: 'Чт', genFactor: 0.85, loadFactor: 1.1 },
    { label: 'Пт', genFactor: 1.10, loadFactor: 1.0 },
    { label: 'Сб', genFactor: 1.00, loadFactor: 0.95 },
    { label: 'Нд', genFactor: 0.90, loadFactor: 1.0 },
];

const MONTHLY_SHARES = [
    { label: 'Січ', share: 0.032 },
    { label: 'Лют', share: 0.048 },
    { label: 'Бер', share: 0.082 },
    { label: 'Кві', share: 0.104 },
    { label: 'Тра', share: 0.124 },
    { label: 'Чер', share: 0.130 },
    { label: 'Лип', share: 0.132 },
    { label: 'Сер', share: 0.118 },
    { label: 'Вер', share: 0.092 },
    { label: 'Жов', share: 0.064 },
    { label: 'Лис', share: 0.042 },
    { label: 'Гру', share: 0.032 },
];

export function calculateFinanceAndEco(params: FinanceParams): FinanceCalculationResult {
    const safePower = Math.max(0.5, params.systemPowerKw);
    const safeCost = Math.max(0, params.installationCostUah);
    const safeTariff = Math.max(0, params.electricityTariffUah);
    const safeExportTariff = Math.max(0, params.exportTariffUah);
    const safeMonthlyConsumption = Math.max(0, params.monthlyConsumptionKwh);
    const safeSelfRatio = Math.min(1, Math.max(0, params.selfConsumptionRatio));
    const specificYield = params.specificYieldKwhPerKw > 0 ? params.specificYieldKwhPerKw : 1150;

    const annualGenerationKwh = safePower * specificYield;
    const monthlyGenerationKwh = annualGenerationKwh / 12;

    const monthlySelfConsumedKwh = Math.min(
        monthlyGenerationKwh * safeSelfRatio,
        safeMonthlyConsumption
    );
    const monthlyExportKwh = Math.max(0, monthlyGenerationKwh - monthlySelfConsumedKwh);
    const monthlyImportKwh = Math.max(0, safeMonthlyConsumption - monthlySelfConsumedKwh);

    const monthlySavingsUah = monthlySelfConsumedKwh * safeTariff;
    const monthlyExportIncomeUah = monthlyExportKwh * safeExportTariff;
    const totalMonthlyBenefitUah = monthlySavingsUah + monthlyExportIncomeUah;

    const annualBenefitUah = totalMonthlyBenefitUah * 12;
    const paybackYears = annualBenefitUah > 0 ? safeCost / annualBenefitUah : Infinity;

    // Візуальний прогрес шкали окупності (орієнтир 10 років = 100%)
    const paybackProgressPercent = Number.isFinite(paybackYears)
        ? Math.min(100, Math.max(12, Math.round((1 - Math.min(paybackYears, 10) / 10) * 100)))
        : 10;

    // Тижнева аналітика (дохід vs витрати на імпорт у грн)
    const avgDailyBenefit = totalMonthlyBenefitUah / 30;
    const avgDailyImportCost = (monthlyImportKwh * safeTariff) / 30;

    const weeklyAnalytics: AnalyticsPoint[] = WEEKLY_SHARES.map((day) => ({
        label: day.label,
        incomeUah: Math.round(avgDailyBenefit * day.genFactor),
        expenseUah: Math.round(avgDailyImportCost * day.loadFactor),
    }));

    // Місячна аналітика за рік
    const monthlyAnalytics: AnalyticsPoint[] = MONTHLY_SHARES.map(({ label, share }) => {
        const gen = annualGenerationKwh * share;
        const selfCons = Math.min(gen * safeSelfRatio, safeMonthlyConsumption);
        const exp = Math.max(0, gen - selfCons);
        const imp = Math.max(0, safeMonthlyConsumption - selfCons);

        return {
            label,
            incomeUah: Math.round(selfCons * safeTariff + exp * safeExportTariff),
            expenseUah: Math.round(imp * safeTariff),
        };
    });

    // Екологічний ефект за місяць
    const co2SavedKgPerMonth = monthlyGenerationKwh * CO2_KG_PER_KWH;
    const ecoImpact: MonthlyEcoImpact = {
        treesSavedPerMonth: Math.max(1, Math.round(co2SavedKgPerMonth / CO2_KG_PER_TREE_MONTH)),
        co2SavedKgPerMonth: Math.round(co2SavedKgPerMonth),
        carKmAvoidedPerMonth: Math.round(co2SavedKgPerMonth / CO2_KG_PER_CAR_KM),
        co2SavedTonsPerYear: Number(((co2SavedKgPerMonth * 12) / 1000).toFixed(2)),
    };

    return {
        monthlyGenerationKwh: Math.round(monthlyGenerationKwh),
        monthlyExportKwh: Math.round(monthlyExportKwh),
        monthlyImportKwh: Math.round(monthlyImportKwh),
        monthlySelfConsumedKwh: Math.round(monthlySelfConsumedKwh),
        monthlySavingsUah: Math.round(monthlySavingsUah),
        monthlyExportIncomeUah: Math.round(monthlyExportIncomeUah),
        totalMonthlyBenefitUah: Math.round(totalMonthlyBenefitUah),
        paybackYears: Number.isFinite(paybackYears) ? Number(paybackYears.toFixed(1)) : Infinity,
        paybackProgressPercent,
        weeklyAnalytics,
        monthlyAnalytics,
        ecoImpact,
    };
}