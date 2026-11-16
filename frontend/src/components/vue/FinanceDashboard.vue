<script setup lang="ts">
    import { computed, ref, watch } from 'vue';
    import { createFinanceEcoState } from '../../lib/financeEcoStore';

    const {
        params,
        metrics,
        isSmartGridApplied,
        isSavingsEnabled,
        isPaybackGaugeActive,
        isTariffsActive,
        isNetMeteringActive,
        isEditingTariffs,
        exportSharePercent,
        isApiConnected,
        apiStatusText,
        estimatedAppliancesMonthlyKwh,
        toggleSmartGridConsumption,
        toggleEditTariffs,
    } = createFinanceEcoState();

    function formatInt(val: number): string {
        return new Intl.NumberFormat('uk-UA', { maximumFractionDigits: 0 }).format(val);
    }

    const isTreePulsing = ref(false);

    // Блимає лише тоді, коли тумблер економії увімкнений (горить зеленим) і змінюються параметри
    watch(
        [isSavingsEnabled, () => params.value.electricityTariffUah, () => params.value.exportTariffUah],
        () => {
            if (isSavingsEnabled.value) {
                isTreePulsing.value = true;
                setTimeout(() => {
                    isTreePulsing.value = false;
                }, 800);
            }
        },
        { deep: true }
    );

    const gaugeDashOffset = computed(() => {
        const arcLength = 220;
        return Math.round(arcLength * (1 - metrics.value.paybackProgressPercent / 100));
    });
</script>

<template>
    <div class="sf-fullbleed">
        <section class="sf-shell">
            <!-- Верхня панель навігації: ідеальний центр для вкладок -->
            <header class="sf-topbar">
                <div class="sf-top-left">
                    <a href="/" class="sf-back-btn">← Назад до Головного Дашборду</a>
                </div>

                <div class="sf-center-nav">
                    <div class="sf-title">
                        <span class="brand">SolarFlow</span>
                        <span class="sep">/</span>
                        <span>System Config &amp; Controls</span>
                    </div>
                    <nav class="sf-tabs">
                        <a href="/configurator" class="sf-tab">[ Конфігуратор СЕС ]</a>
                        <a href="/smart-grid" class="sf-tab">[ Smart Grid &amp; Прилади ]</a>
                        <a href="/finance" class="sf-tab active">[ Фінанси &amp; Eco ]</a>
                    </nav>
                </div>

                <div class="sf-top-right">
                    <div class="sf-status-pill" :class="{ online: isApiConnected }">
                        <span class="dot"></span>
                        <span>{{ apiStatusText }}</span>
                    </div>
                </div>
            </header>

            <!-- Додатковий рядок з кнопкою Smart Grid під центром -->
            <div v-if="estimatedAppliancesMonthlyKwh > 0" class="sf-sub-topbar">
                <button type="button"
                        class="sf-sync-chip"
                        :class="{ applied: isSmartGridApplied }"
                        @click="toggleSmartGridConsumption">
                    {{
                        isSmartGridApplied
                        ? `Smart Grid споживання застосовано: ${estimatedAppliancesMonthlyKwh} кВт·год/міс (Повернути)`
                        : `Застосувати дані Smart Grid: ${estimatedAppliancesMonthlyKwh} кВт·год/міс`
                    }}
                </button>
            </div>

            <!-- Основна робоча сітка: дві ліві колонки + велика права 3D колонка -->
            <div class="sf-workspace">

                <!-- ЛІВА КОЛОНКА 1: Financial ROI & Payback -->
                <div class="sf-col">
                    <h2 class="sf-col-heading">Financial ROI &amp; Payback</h2>

                    <article class="sf-card" :class="{ dimmed: !isSavingsEnabled }">
                        <div class="sf-card-head">
                            <h3>Економія за місяць</h3>
                            <label class="sf-switch">
                                <input v-model="isSavingsEnabled" type="checkbox" />
                                <span class="sf-slider"></span>
                            </label>
                        </div>

                        <div class="sf-big-cyan">
                            +{{ formatInt(metrics.totalMonthlyBenefitUah) }} ₴ <span>/ міс</span>
                        </div>
                        <p class="sf-muted-center">
                            (економія {{ formatInt(metrics.monthlySavingsUah) }} ₴ + експорт {{ formatInt(metrics.monthlyExportIncomeUah) }} ₴)
                        </p>
                    </article>

                    <article class="sf-card" :class="{ dimmed: !isPaybackGaugeActive }">
                        <div class="sf-card-head">
                            <h3>Термін окупності СЕС</h3>
                            <label class="sf-switch">
                                <input v-model="isPaybackGaugeActive" type="checkbox" />
                                <span class="sf-slider"></span>
                            </label>
                        </div>

                        <div class="sf-gauge-wrap">
                            <svg viewBox="0 0 180 105" class="sf-gauge-svg">
                                <defs>
                                    <linearGradient id="roiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stop-color="#38bdf8" />
                                        <stop offset="100%" stop-color="#2dd4bf" />
                                    </linearGradient>
                                </defs>
                                <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="rgba(148, 163, 184, 0.22)" stroke-width="12" stroke-linecap="round" />
                                <path d="M 20 90 A 70 70 0 0 1 160 90" fill="none" stroke="url(#roiGrad)" stroke-width="12" stroke-linecap="round" stroke-dasharray="220" :stroke-dashoffset="gaugeDashOffset" />
                            </svg>

                            <div class="sf-gauge-center">
                                <div class="sf-gauge-num">
                                    {{ Number.isFinite(metrics.paybackYears) ? metrics.paybackYears : '—' }}
                                </div>
                                <div class="sf-gauge-unit">років</div>
                            </div>
                        </div>

                        <p class="sf-muted-center">
                            Інвестиція {{ formatInt(params.installationCostUah) }} ₴ • СЕС {{ params.systemPowerKw }} кВт
                        </p>
                    </article>

                    <article class="sf-card" :class="{ dimmed: !isTariffsActive }">
                        <div class="sf-card-head">
                            <h3>Тарифи та Валюта</h3>
                            <label class="sf-switch">
                                <input v-model="isTariffsActive" type="checkbox" />
                                <span class="sf-slider"></span>
                            </label>
                        </div>

                        <div class="sf-tariff-list">
                            <div class="sf-tariff-row">
                                <span>Тариф мережі:</span>
                                <div class="sf-tariff-box">
                                    <input v-model.number="params.electricityTariffUah" type="number" step="0.05" min="0" :disabled="!isEditingTariffs" />
                                    <small>₴/кВт·год</small>
                                </div>
                            </div>

                            <div class="sf-tariff-row">
                                <span>Зелений тариф:</span>
                                <div class="sf-tariff-box">
                                    <input v-model.number="params.exportTariffUah" type="number" step="0.05" min="0" :disabled="!isEditingTariffs" />
                                    <small>₴/кВт·год</small>
                                </div>
                            </div>

                            <template v-if="isEditingTariffs">
                                <div class="sf-tariff-row">
                                    <span>Потужність СЕС:</span>
                                    <div class="sf-tariff-box">
                                        <input v-model.number="params.systemPowerKw" type="number" step="0.5" min="0.5" />
                                        <small>кВт</small>
                                    </div>
                                </div>

                                <div class="sf-tariff-row">
                                    <span>Споживання/міс:</span>
                                    <div class="sf-tariff-box">
                                        <input v-model.number="params.monthlyConsumptionKwh" type="number" step="10" min="0" />
                                        <small>кВт·год</small>
                                    </div>
                                </div>

                                <div class="sf-tariff-row">
                                    <span>Вартість СЕС:</span>
                                    <div class="sf-tariff-box">
                                        <input v-model.number="params.installationCostUah" type="number" step="5000" min="0" />
                                        <small>₴</small>
                                    </div>
                                </div>
                            </template>
                        </div>

                        <button type="button" class="sf-action-btn" @click="toggleEditTariffs">
                            {{ isEditingTariffs ? 'Зберегти параметри' : 'Редагувати тарифи' }}
                        </button>
                    </article>
                </div>

                <!-- ЛІВА КОЛОНКА 2: Financial Flows & Block Analytics -->
                <div class="sf-col">
                    <h2 class="sf-col-heading">Financial Flows &amp; Energy Trade</h2>

                    <article class="sf-card" :class="{ dimmed: !isNetMeteringActive }">
                        <div class="sf-card-head">
                            <h3>Net Metering Баланс</h3>
                            <label class="sf-switch">
                                <input v-model="isNetMeteringActive" type="checkbox" />
                                <span class="sf-slider"></span>
                            </label>
                        </div>

                        <div class="sf-net-grid">
                            <div class="sf-net-side left">
                                <span class="sf-net-label">Експорт:</span>
                                <strong class="sf-net-val cyan">{{ metrics.monthlyExportKwh }} kWh</strong>
                                <small>(Зелений тариф)</small>
                            </div>

                            <div class="sf-ring-wrap">
                                <svg viewBox="0 0 120 120" class="sf-ring-svg">
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(56, 189, 248, 0.2)" stroke-width="10" />
                                    <circle cx="60" cy="60" r="50" fill="none" stroke="#2dd4bf" stroke-width="10" stroke-linecap="round"
                                            :stroke-dasharray="`${(exportSharePercent / 100) * 314} 314`"
                                            transform="rotate(-90 60 60)" />
                                </svg>
                                <div class="sf-ring-center-text">
                                    <span class="ring-val">{{ Math.round(exportSharePercent) }}%</span>
                                    <span class="ring-lbl">експорт</span>
                                </div>
                            </div>

                            <div class="sf-net-side right">
                                <span class="sf-net-label">Імпорт:</span>
                                <strong class="sf-net-val blue">{{ metrics.monthlyImportKwh }} kWh</strong>
                                <small>(Споживання)</small>
                            </div>
                        </div>
                    </article>

                    <!-- Блокова фінансова аналітика (на весь квадрат) -->
                    <article class="sf-card sf-analytics-card">
                        <div class="sf-card-head">
                            <h3>Фінансова Аналітика</h3>
                            <span class="sf-badge-sub">Місячний баланс</span>
                        </div>

                        <div class="sf-blocks-grid">
                            <div class="sf-stat-block income">
                                <span class="block-label">Загальний дохід (Експорт)</span>
                                <strong class="block-value cyan">+{{ formatInt(metrics.monthlyExportIncomeUah) }} ₴</strong>
                                <div class="block-sub">Зелений тариф активний</div>
                            </div>

                            <div class="sf-stat-block savings">
                                <span class="block-label">Збережені кошти</span>
                                <strong class="block-value green">+{{ formatInt(metrics.monthlySavingsUah) }} ₴</strong>
                                <div class="block-sub">Власна генерація</div>
                            </div>

                            <div class="sf-stat-block expense">
                                <span class="block-label">Витрати на мережу</span>
                                <strong class="block-value red">0 ₴</strong>
                                <div class="block-sub">Покривається батареєю</div>
                            </div>

                            <div class="sf-stat-block net-effect">
                                <span class="block-label">Чистий фінансовий ефект</span>
                                <strong class="block-value gold">+{{ formatInt(metrics.totalMonthlyBenefitUah) }} ₴/міс</strong>
                                <div class="block-sub">Рентабельність висока</div>
                            </div>
                        </div>
                    </article>
                </div>

                <!-- ПРАВА КОЛОНКА: Велике дерево з коригуванням висоти (translateY) -->
                <div class="sf-col sf-right-col">
                    <h2 class="sf-col-heading">Інтерактивний Екологічний Вплив (Dynamic Eco-Impact)</h2>

                    <article class="sf-card sf-eco-immersive-card">
                        <div class="sf-eco-bg-container">
                            <img src="/images/finance-eco-bg.jpg" alt="Eco Landscape 3D" class="sf-eco-bg-img" />

                            <!-- Суттєво збільшене дерево (width: 380px) + підняте вище на пагорб через translateY -->
                            <div class="sf-center-tree-wrapper" :class="{ 'tree-pulse-active': isTreePulsing && isSavingsEnabled }">
                                <img src="/images/eco-tree-glow.png" alt="Glowing Eco Tree" class="sf-center-tree-img" />
                            </div>

                            <!-- Написи на тлі без прямокутних блоків -->
                            <div class="sf-scene-label label-trees">
                                <strong class="scene-val cyan">{{ formatInt(metrics.ecoImpact.treesSavedPerMonth) }} дерев</strong>
                                <span class="scene-desc">збережено / посаджено</span>
                            </div>

                            <div class="sf-scene-label label-co2">
                                <strong class="scene-val cyan">+{{ formatInt(metrics.ecoImpact.co2SavedKgPerMonth) }} кг CO₂</strong>
                                <span class="scene-desc">збережено / місяць</span>
                            </div>

                            <div class="sf-scene-label label-car">
                                <strong class="scene-val cyan">{{ formatInt(metrics.ecoImpact.carKmAvoidedPerMonth) }} км</strong>
                                <span class="scene-desc">не проїхано на авто</span>
                            </div>

                            <div class="sf-eco-annual-banner">
                                Річний ефект: <strong>{{ metrics.ecoImpact.co2SavedTonsPerYear }} т CO₂</strong>
                            </div>
                        </div>
                    </article>
                </div>

            </div>
        </section>
    </div>
</template>

<style scoped>
    .sf-fullbleed {
        width: 100vw;
        min-height: 100vh;
        margin-left: calc(50% - 50vw);
        margin-right: calc(50% - 50vw);
        background: #081522;
        background-image: radial-gradient(circle at top right, #132a2e 0%, #0b131e 55%, #080e17 100%);
        box-sizing: border-box;
    }

    .sf-shell {
        max-width: 1560px;
        margin: 0 auto;
        padding: 1.15rem 2rem 2.5rem;
    }

    .sf-topbar {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 1rem;
        padding-bottom: 0.95rem;
        border-bottom: 1px solid rgba(56, 189, 248, 0.2);
        margin-bottom: 1rem;
    }

    .sf-top-left {
        display: flex;
        justify-content: flex-start;
    }

    .sf-top-right {
        display: flex;
        justify-content: flex-end;
    }

    .sf-back-btn {
        padding: 0.45rem 0.95rem;
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(15, 23, 42, 0.75);
        color: #cbd5e1;
        text-decoration: none;
        font-size: 0.84rem;
        transition: all 0.15s ease;
    }

        .sf-back-btn:hover {
            border-color: #38bdf8;
            color: #ffffff;
        }

    .sf-center-nav {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
    }

    .sf-title {
        font-size: 1.08rem;
        font-weight: 600;
        color: #f1f5f9;
    }

        .sf-title .brand {
            color: #2dd4bf;
        }

        .sf-title .sep {
            margin: 0 0.45rem;
            color: #64748b;
        }

    .sf-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
    }

    .sf-tab {
        color: #94a3b8;
        text-decoration: none;
        font-size: 0.85rem;
        padding: 0.25rem 0.7rem;
        border-radius: 6px;
        transition: color 0.15s;
    }

        .sf-tab:hover {
            color: #e2e8f0;
        }

        .sf-tab.active {
            color: #2dd4bf;
            background: rgba(45, 212, 191, 0.12);
            border-bottom: 2px solid #2dd4bf;
        }

    .sf-sub-topbar {
        display: flex;
        justify-content: center;
        margin-bottom: 1.2rem;
    }

    .sf-sync-chip {
        padding: 0.45rem 1.1rem;
        border-radius: 999px;
        border: 1px solid rgba(45, 212, 191, 0.45);
        background: rgba(45, 212, 191, 0.12);
        color: #2dd4bf;
        font-size: 0.82rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s;
    }

        .sf-sync-chip:hover {
            background: rgba(45, 212, 191, 0.25);
        }

        .sf-sync-chip.applied {
            background: rgba(45, 212, 191, 0.28);
            border-color: #2dd4bf;
            color: #ffffff;
        }

    .sf-status-pill {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.4rem 0.9rem;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.85);
        border: 1px solid rgba(45, 212, 191, 0.45);
        font-size: 0.82rem;
        color: #2dd4bf;
    }

        .sf-status-pill .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
            box-shadow: 0 0 8px currentColor;
        }

    .sf-workspace {
        display: grid;
        grid-template-columns: 1fr 1fr 1.35fr;
        gap: 20px;
        align-items: stretch;
    }

    @media (max-width: 1200px) {
        .sf-workspace {
            grid-template-columns: 1fr;
        }
    }

    .sf-col {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .sf-right-col {
        display: flex;
        flex-direction: column;
    }

    .sf-col-heading {
        margin: 0 0 4px;
        font-size: 1rem;
        font-weight: 600;
        color: #cbd5e1;
    }

    .sf-card {
        background: linear-gradient(165deg, rgba(16, 34, 53, 0.92), rgba(10, 22, 36, 0.94));
        border: 1px solid rgba(56, 189, 248, 0.22);
        border-radius: 16px;
        padding: 18px;
        box-shadow: 0 6px 20px rgba(2, 8, 18, 0.45);
        transition: border-color 0.2s ease;
    }

        .sf-card:hover {
            border-color: rgba(56, 189, 248, 0.4);
        }

        .sf-card.dimmed {
            opacity: 0.55;
        }

    .sf-card-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
    }

        .sf-card-head h3 {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 600;
            color: #f1f5f9;
        }

    .sf-switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 22px;
    }

        .sf-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

    .sf-slider {
        position: absolute;
        inset: 0;
        background: #334155;
        border-radius: 999px;
        cursor: pointer;
        transition: 0.2s;
    }

        .sf-slider::before {
            content: '';
            position: absolute;
            height: 16px;
            width: 16px;
            left: 3px;
            bottom: 3px;
            background: #f8fafc;
            border-radius: 50%;
            transition: 0.2s;
        }

    .sf-switch input:checked + .sf-slider {
        background: #2dd4bf;
    }

        .sf-switch input:checked + .sf-slider::before {
            transform: translateX(18px);
        }

    .sf-big-cyan {
        text-align: center;
        font-size: 1.9rem;
        font-weight: 700;
        color: #2dd4bf;
        margin: 6px 0;
    }

        .sf-big-cyan span {
            font-size: 1rem;
            font-weight: 500;
            color: #7dd3fc;
        }

    .sf-muted-center {
        margin: 4px 0 0;
        text-align: center;
        font-size: 0.78rem;
        color: #94a3b8;
    }

    .sf-gauge-wrap {
        position: relative;
        width: 170px;
        margin: 0 auto;
    }

    .sf-gauge-svg {
        width: 100%;
        display: block;
    }

    .sf-gauge-center {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 6px;
        text-align: center;
    }

    .sf-gauge-num {
        font-size: 1.7rem;
        font-weight: 700;
        line-height: 1;
        color: #f8fafc;
    }

    .sf-gauge-unit {
        font-size: 0.78rem;
        color: #94a3b8;
    }

    .sf-tariff-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 14px;
    }

    .sf-tariff-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        font-size: 0.85rem;
        color: #cbd5e1;
    }

    .sf-tariff-box {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(10, 24, 38, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 8px;
        padding: 4px 8px;
    }

        .sf-tariff-box input {
            width: 64px;
            background: transparent;
            border: none;
            color: #f8fafc;
            font-weight: 600;
            font-size: 0.88rem;
            text-align: right;
        }

            .sf-tariff-box input:focus {
                outline: none;
            }

        .sf-tariff-box small {
            color: #94a3b8;
            font-size: 0.72rem;
        }

    .sf-action-btn {
        width: 100%;
        padding: 9px 12px;
        border-radius: 10px;
        border: 1px solid rgba(45, 212, 191, 0.45);
        background: rgba(45, 212, 191, 0.12);
        color: #2dd4bf;
        font-weight: 600;
        font-size: 0.85rem;
        cursor: pointer;
        transition: background 0.15s, transform 0.1s;
    }

        .sf-action-btn:hover {
            background: rgba(45, 212, 191, 0.24);
            transform: translateY(-1px);
        }

    .sf-net-grid {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 10px;
        padding: 8px 0;
    }

    .sf-net-side {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

        .sf-net-side.right {
            text-align: right;
        }

    .sf-net-label {
        font-size: 0.8rem;
        color: #cbd5e1;
    }

    .sf-net-val {
        font-size: 1.1rem;
        font-weight: 700;
    }

        .sf-net-val.cyan {
            color: #2dd4bf;
        }

        .sf-net-val.blue {
            color: #38bdf8;
        }

    .sf-net-side small {
        font-size: 0.72rem;
        color: #94a3b8;
    }

    .sf-ring-wrap {
        position: relative;
        width: 115px;
        height: 115px;
    }

    .sf-ring-svg {
        width: 100%;
        height: 100%;
    }

    .sf-ring-center-text {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    }

        .sf-ring-center-text .ring-val {
            font-size: 1.25rem;
            font-weight: 700;
            color: #2dd4bf;
            line-height: 1;
        }

        .sf-ring-center-text .ring-lbl {
            font-size: 0.7rem;
            color: #94a3b8;
            margin-top: 2px;
        }

    .sf-analytics-card {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 250px;
    }

    .sf-badge-sub {
        font-size: 0.75rem;
        color: #2dd4bf;
        background: rgba(45, 212, 191, 0.12);
        padding: 2px 8px;
        border-radius: 999px;
        border: 1px solid rgba(45, 212, 191, 0.3);
    }

    .sf-blocks-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 14px;
        flex: 1;
        margin-top: 8px;
    }

    .sf-stat-block {
        background: rgba(8, 20, 34, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 12px;
        padding: 14px 16px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 5px;
        transition: border-color 0.15s;
    }

        .sf-stat-block:hover {
            border-color: rgba(45, 212, 191, 0.45);
        }

    .block-label {
        font-size: 0.78rem;
        color: #94a3b8;
    }

    .block-value {
        font-size: 1.25rem;
        font-weight: 700;
    }

        .block-value.cyan {
            color: #2dd4bf;
        }

        .block-value.green {
            color: #34d399;
        }

        .block-value.red {
            color: #94a3b8;
        }

        .block-value.gold {
            color: #fde68a;
        }

    .block-sub {
        font-size: 0.72rem;
        color: #64748b;
    }

    /* Іммерсивний правий 3D-блок */
    .sf-eco-immersive-card {
        flex: 1;
        padding: 0 !important;
        overflow: hidden;
        position: relative;
        min-height: 520px;
        border: 1px solid rgba(45, 212, 191, 0.35);
        box-shadow: 0 10px 30px rgba(45, 212, 191, 0.12);
    }

    .sf-eco-bg-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 520px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .sf-eco-bg-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.88;
    }


    .sf-center-tree-wrapper {
        position: relative;
        z-index: 5;
        width: 380px;
        transform: translateY(-55px);
        transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .sf-center-tree-img {
        width: 100%;
        height: auto;
        display: block;
        filter: drop-shadow(0 0 50px rgba(45, 212, 191, 0.88));
    }

    .tree-pulse-active {
        transform: translateY(-55px) scale(1.1);
    }

        .tree-pulse-active .sf-center-tree-img {
            filter: drop-shadow(0 0 70px rgba(45, 212, 191, 0.98)) brightness(1.25);
        }

    /* Написи на сцені */
    .sf-scene-label {
        position: absolute;
        z-index: 10;
        display: flex;
        flex-direction: column;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.8);
        pointer-events: none;
    }

    .scene-val {
        font-size: 1.05rem;
        font-weight: 700;
        line-height: 1.2;
    }

        .scene-val.cyan {
            color: #2dd4bf;
        }

    .scene-desc {
        font-size: 0.72rem;
        color: #94a3b8;
    }

    .label-trees {
        top: 35px;
        left: 35px;
    }

    .label-co2 {
        top: 35px;
        right: 45px;
        text-align: right;
    }

    .label-car {
        bottom: 85px;
        right: 35px;
        text-align: right;
    }

    .sf-eco-annual-banner {
        position: absolute;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
        background: rgba(45, 212, 191, 0.18);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(45, 212, 191, 0.45);
        padding: 6px 18px;
        border-radius: 999px;
        color: #7dd3fc;
        font-size: 0.82rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    }

        .sf-eco-annual-banner strong {
            color: #ffffff;
        }
</style>