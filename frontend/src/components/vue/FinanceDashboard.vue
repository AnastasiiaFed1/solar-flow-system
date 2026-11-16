<script setup lang="ts">
    import { computed } from 'vue';
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
        analyticsPeriod,
        currentAnalyticsSeries,
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

    // Координати для SVG-графіка фінансової аналітики (Weekly / Monthly)
    const chartGeometry = computed(() => {
        const series = currentAnalyticsSeries.value;
        const width = 340;
        const height = 130;
        const midY = 65;

        const maxVal = Math.max(
            ...series.map((s) => Math.max(s.incomeUah, s.expenseUah)),
            10
        );

        const stepX = series.length > 1 ? width / (series.length - 1) : width;

        const incomePoints = series.map((item, idx) => {
            const x = Math.round(idx * stepX);
            const y = Math.round(midY - (item.incomeUah / maxVal) * 52);
            return `${x},${y}`;
        });

        const expensePoints = series.map((item, idx) => {
            const x = Math.round(idx * stepX);
            const y = Math.round(midY + (item.expenseUah / maxVal) * 52);
            return `${x},${y}`;
        });

        return {
            width,
            height,
            midY,
            incomePolyline: incomePoints.join(' '),
            incomeArea: `0,${midY} ${incomePoints.join(' ')} ${width},${midY}`,
            expensePolyline: expensePoints.join(' '),
            expenseArea: `0,${midY} ${expensePoints.join(' ')} ${width},${midY}`,
        };
    });

    // Кут для напівкруглої шкали окупності (stroke-dashoffset)
    const gaugeDashOffset = computed(() => {
        const arcLength = 220;
        return Math.round(arcLength * (1 - metrics.value.paybackProgressPercent / 100));
    });
</script>

<template>
    <section class="sf-finance-shell">
        <!-- Верхній рядок статусу синхронізації з бекендом -->
        <div class="sf-topbar">
            <div class="sf-breadcrumb">
                <a href="/smart-grid" class="sf-back-link">← Smart Grid</a>
                <span class="sf-sep">/</span>
                <span class="sf-title-crumb">Фінанси &amp; Eco</span>
            </div>

            <div class="sf-status-group">
                <button v-if="estimatedAppliancesMonthlyKwh > 0"
                        type="button"
                        class="sf-sync-chip"
                        :class="{ applied: isSmartGridApplied }"
                        title="Перемкнути використання даних зі Smart Grid"
                        @click="toggleSmartGridConsumption">
                    {{
                        isSmartGridApplied
                        ? `Smart Grid застосовано: ${estimatedAppliancesMonthlyKwh} кВт·год/міс (Повернути)`
                        : `Smart Grid: ${estimatedAppliancesMonthlyKwh} кВт·год/міс (Застосувати)`
                    }}
                </button>

                <div class="sf-api-pill" :class="{ online: isApiConnected }">
                    <span class="sf-status-dot"></span>
                    <span>{{ apiStatusText }}</span>
                </div>
            </div>
        </div>

        <!-- Основна 3-колонкова сітка за макетом -->
        <div class="sf-columns">
            <!-- КОЛОНКА 1: Financial ROI & Payback -->
            <div class="sf-col">
                <h2 class="sf-col-heading">Financial ROI &amp; Payback</h2>

                <!-- Картка 1: Економія за місяць -->
                <article class="sf-card" :class="{ dimmed: !isSavingsEnabled }">
                    <div class="sf-card-head">
                        <h3>Економія за місяць</h3>
                        <label class="sf-switch">
                            <input v-model="isSavingsEnabled" type="checkbox" />
                            <span class="sf-slider"></span>
                        </label>
                    </div>

                    <div class="sf-big-green">
                        +{{ formatInt(metrics.totalMonthlyBenefitUah) }} ₴ <span>/ міс</span>
                    </div>
                    <p class="sf-muted-center">
                        (економія {{ formatInt(metrics.monthlySavingsUah) }} ₴ + експорт {{ formatInt(metrics.monthlyExportIncomeUah) }} ₴)
                    </p>
                </article>

                <!-- Картка 2: Термін окупності СЕС -->
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
                                    <stop offset="0%" stop-color="#10b981" />
                                    <stop offset="100%" stop-color="#38bdf8" />
                                </linearGradient>
                            </defs>
                            <!-- Фонова дуга -->
                            <path d="M 20 90 A 70 70 0 0 1 160 90"
                                  fill="none"
                                  stroke="rgba(148, 163, 184, 0.22)"
                                  stroke-width="12"
                                  stroke-linecap="round" />
                            <!-- Активна дуга -->
                            <path d="M 20 90 A 70 70 0 0 1 160 90"
                                  fill="none"
                                  stroke="url(#roiGrad)"
                                  stroke-width="12"
                                  stroke-linecap="round"
                                  stroke-dasharray="220"
                                  :stroke-dashoffset="gaugeDashOffset" />
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

                <!-- Картка 3: Тарифи та Валюта -->
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
                                <input v-model.number="params.electricityTariffUah"
                                       type="number"
                                       step="0.05"
                                       min="0"
                                       :disabled="!isEditingTariffs" />
                                <small>₴/кВт·год</small>
                            </div>
                        </div>

                        <div class="sf-tariff-row">
                            <span>Зелений тариф:</span>
                            <div class="sf-tariff-box">
                                <input v-model.number="params.exportTariffUah"
                                       type="number"
                                       step="0.05"
                                       min="0"
                                       :disabled="!isEditingTariffs" />
                                <small>₴/кВт·год</small>
                            </div>
                        </div>

                        <!-- Додаткові параметри при натисканні "Редагувати тарифи" -->
                        <template v-if="isEditingTariffs">
                            <div class="sf-tariff-row">
                                <span>Потужність СЕС:</span>
                                <div class="sf-tariff-box">
                                    <input v-model.number="params.systemPowerKw"
                                           type="number"
                                           step="0.5"
                                           min="0.5" />
                                    <small>кВт</small>
                                </div>
                            </div>

                            <div class="sf-tariff-row">
                                <span>Споживання/міс:</span>
                                <div class="sf-tariff-box">
                                    <input v-model.number="params.monthlyConsumptionKwh"
                                           type="number"
                                           step="10"
                                           min="0" />
                                    <small>кВт·год</small>
                                </div>
                            </div>

                            <div class="sf-tariff-row">
                                <span>Вартість СЕС:</span>
                                <div class="sf-tariff-box">
                                    <input v-model.number="params.installationCostUah"
                                           type="number"
                                           step="5000"
                                           min="0" />
                                    <small>₴</small>
                                </div>
                            </div>
                        </template>
                    </div>

                    <button type="button" class="sf-action-btn" @click="toggleEditTariffs">
                        {{ isEditingTariffs ? '[ Зберегти параметри ]' : '[ Редагувати тарифи ]' }}
                    </button>
                </article>
            </div>

            <!-- КОЛОНКА 2: Financial Flows & Energy Trade -->
            <div class="sf-col">
                <h2 class="sf-col-heading">Financial Flows &amp; Energy Trade</h2>

                <!-- Картка 1: Net Metering Баланс -->
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
                            <strong class="sf-net-val green">{{ metrics.monthlyExportKwh }} kWh</strong>
                            <small>(Зелений тариф)</small>
                        </div>

                        <!-- Кільцевий індикатор обміну енергією -->
                        <div class="sf-ring-wrap">
                            <svg viewBox="0 0 120 120" class="sf-ring-svg">
                                <circle cx="60"
                                        cy="60"
                                        r="44"
                                        fill="none"
                                        stroke="#38bdf8"
                                        stroke-width="11"
                                        stroke-opacity="0.35" />
                                <circle cx="60"
                                        cy="60"
                                        r="44"
                                        fill="none"
                                        stroke="#10b981"
                                        stroke-width="11"
                                        stroke-linecap="round"
                                        :stroke-dasharray="`${(exportSharePercent / 100) * 276} 276`"
                                        transform="rotate(-90 60 60)" />
                            </svg>
                            <div class="sf-ring-bolt">⚡</div>
                        </div>

                        <div class="sf-net-side right">
                            <span class="sf-net-label">Імпорт:</span>
                            <strong class="sf-net-val blue">{{ metrics.monthlyImportKwh }} kWh</strong>
                            <small>(Споживання)</small>
                        </div>
                    </div>
                </article>

                <!-- Картка 2: Фінансова Аналітика -->
                <article class="sf-card sf-analytics-card">
                    <div class="sf-card-head">
                        <h3>Фінансова Аналітика</h3>
                        <div class="sf-period-pills">
                            <button type="button"
                                    :class="{ active: analyticsPeriod === 'weekly' }"
                                    @click="analyticsPeriod = 'weekly'">
                                Weekly
                            </button>
                            <button type="button"
                                    :class="{ active: analyticsPeriod === 'monthly' }"
                                    @click="analyticsPeriod = 'monthly'">
                                Monthly
                            </button>
                        </div>
                    </div>

                    <div class="sf-legend-row">
                        <span><i class="dot green"></i> Надходження / економія (₴)</span>
                        <span><i class="dot blue"></i> Витрати на імпорт (₴)</span>
                    </div>

                    <div class="sf-chart-box">
                        <svg :viewBox="`0 0 ${chartGeometry.width} ${chartGeometry.height}`"
                             preserveAspectRatio="none"
                             class="sf-area-svg">
                            <line x1="0"
                                  :y1="chartGeometry.midY"
                                  :x2="chartGeometry.width"
                                  :y2="chartGeometry.midY"
                                  stroke="rgba(148, 163, 184, 0.25)"
                                  stroke-dasharray="4 4" />
                            <polygon :points="chartGeometry.incomeArea" fill="rgba(16, 185, 129, 0.22)" />
                            <polyline :points="chartGeometry.incomePolyline"
                                      fill="none"
                                      stroke="#10b981"
                                      stroke-width="2.5" />
                            <polygon :points="chartGeometry.expenseArea" fill="rgba(56, 189, 248, 0.20)" />
                            <polyline :points="chartGeometry.expensePolyline"
                                      fill="none"
                                      stroke="#38bdf8"
                                      stroke-width="2" />
                        </svg>

                        <div class="sf-x-labels">
                            <span v-for="pt in currentAnalyticsSeries" :key="pt.label">{{ pt.label }}</span>
                        </div>
                    </div>
                </article>
            </div>

            <!-- КОЛОНКА 3: Інтерактивний Екологічний Вплив -->
            <div class="sf-col">
                <h2 class="sf-col-heading">Інтерактивний Екологічний Вплив (Dynamic Eco-Impact)</h2>

                <article class="sf-card sf-eco-panel">
                    <div class="sf-eco-grid-visual">
                        <!-- Метрика 1: Дерева -->
                        <div class="sf-eco-node">
                            <div class="sf-eco-icon-circle green">🌳</div>
                            <div class="sf-eco-metric">{{ formatInt(metrics.ecoImpact.treesSavedPerMonth) }} дерев</div>
                            <div class="sf-eco-sub">збережено / посаджено за міс.</div>
                        </div>

                        <!-- Метрика 2: CO2 -->
                        <div class="sf-eco-node">
                            <div class="sf-eco-icon-circle cyan">CO₂</div>
                            <div class="sf-eco-metric">+{{ formatInt(metrics.ecoImpact.co2SavedKgPerMonth) }} кг CO₂</div>
                            <div class="sf-eco-sub">збережено / місяць</div>
                        </div>

                        <!-- Центральна візуалізація -->
                        <div class="sf-eco-center-art">
                            <div class="sf-glow-tree">🌲</div>
                            <div class="sf-eco-annual-pill">
                                Річний ефект: <strong>{{ metrics.ecoImpact.co2SavedTonsPerYear }} т CO₂</strong>
                            </div>
                        </div>

                        <!-- Метрика 3: Пробіг авто -->
                        <div class="sf-eco-node">
                            <div class="sf-eco-icon-circle emerald">🚗</div>
                            <div class="sf-eco-metric">{{ formatInt(metrics.ecoImpact.carKmAvoidedPerMonth) }} км</div>
                            <div class="sf-eco-sub">не проїхано на авто</div>
                        </div>
                    </div>
                </article>
            </div>
        </div>
    </section>
</template>

<style scoped>
    .sf-finance-shell {
        background: radial-gradient(circle at top right, #132a2e 0%, #0b131e 55%, #080e17 100%);
        border: 1px solid rgba(56, 189, 248, 0.2);
        border-radius: 20px;
        padding: 24px;
        color: #e2e8f0;
        box-shadow: 0 20px 45px rgba(2, 6, 23, 0.45);
    }

    .sf-topbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
        padding-bottom: 16px;
        margin-bottom: 20px;
        border-bottom: 1px solid rgba(148, 163, 184, 0.16);
    }

    .sf-breadcrumb {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.92rem;
    }

    .sf-back-link {
        color: #38bdf8;
        text-decoration: none;
        font-weight: 600;
    }

        .sf-back-link:hover {
            text-decoration: underline;
        }

    .sf-sep {
        color: #64748b;
    }

    .sf-title-crumb {
        font-weight: 700;
        color: #f8fafc;
    }

    .sf-status-group {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
    }

    .sf-sync-chip {
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid rgba(16, 185, 129, 0.45);
        background: rgba(16, 185, 129, 0.14);
        color: #6ee7b7;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
    }

        .sf-sync-chip:hover {
            background: rgba(16, 185, 129, 0.25);
        }

        .sf-sync-chip.applied {
            background: rgba(16, 185, 129, 0.32);
            border-color: #34d399;
            color: #ffffff;
        }

    .sf-api-pill {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 6px 12px;
        border-radius: 999px;
        background: rgba(30, 41, 59, 0.85);
        border: 1px solid rgba(148, 163, 184, 0.22);
        font-size: 0.8rem;
        color: #94a3b8;
    }

        .sf-api-pill.online {
            color: #a7f3d0;
            border-color: rgba(16, 185, 129, 0.35);
        }

    .sf-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #64748b;
    }

    .sf-api-pill.online .sf-status-dot {
        background: #10b981;
        box-shadow: 0 0 8px #10b981;
    }

    .sf-columns {
        display: grid;
        grid-template-columns: 1fr 1.15fr 1.25fr;
        gap: 20px;
        align-items: stretch;
    }

    @media (max-width: 1120px) {
        .sf-columns {
            grid-template-columns: 1fr;
        }
    }

    .sf-col {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .sf-col-heading {
        margin: 0;
        font-size: 1.02rem;
        font-weight: 600;
        color: #cbd5e1;
    }

    .sf-card {
        background: rgba(15, 28, 42, 0.82);
        border: 1px solid rgba(56, 189, 248, 0.18);
        border-radius: 16px;
        padding: 18px;
        transition: opacity 0.2s ease, border-color 0.2s ease;
    }

        .sf-card:hover {
            border-color: rgba(56, 189, 248, 0.36);
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
            font-size: 0.98rem;
            font-weight: 600;
            color: #f1f5f9;
        }

    /* Тумблер */
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
        background: #10b981;
    }

        .sf-switch input:checked + .sf-slider::before {
            transform: translateX(18px);
        }

    .sf-big-green {
        text-align: center;
        font-size: 1.95rem;
        font-weight: 700;
        color: #34d399;
        margin: 6px 0;
    }

        .sf-big-green span {
            font-size: 1.05rem;
            font-weight: 500;
            color: #a7f3d0;
        }

    .sf-muted-center {
        margin: 4px 0 0;
        text-align: center;
        font-size: 0.8rem;
        color: #94a3b8;
    }

    /* Gauge */
    .sf-gauge-wrap {
        position: relative;
        width: 180px;
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
        font-size: 1.75rem;
        font-weight: 700;
        line-height: 1;
        color: #f8fafc;
    }

    .sf-gauge-unit {
        font-size: 0.8rem;
        color: #94a3b8;
    }

    /* Тарифи */
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
        font-size: 0.86rem;
        color: #cbd5e1;
    }

    .sf-tariff-box {
        display: flex;
        align-items: center;
        gap: 6px;
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.25);
        border-radius: 8px;
        padding: 4px 8px;
    }

        .sf-tariff-box input {
            width: 68px;
            background: transparent;
            border: none;
            color: #f8fafc;
            font-weight: 600;
            font-size: 0.9rem;
            text-align: right;
        }

            .sf-tariff-box input:focus {
                outline: none;
            }

        .sf-tariff-box small {
            color: #94a3b8;
            font-size: 0.75rem;
        }

    .sf-action-btn {
        width: 100%;
        padding: 9px 12px;
        border-radius: 10px;
        border: 1px solid rgba(56, 189, 248, 0.45);
        background: rgba(56, 189, 248, 0.12);
        color: #7dd3fc;
        font-weight: 600;
        font-size: 0.86rem;
        cursor: pointer;
    }

        .sf-action-btn:hover {
            background: rgba(56, 189, 248, 0.22);
        }

    /* Net Metering */
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
        font-size: 0.82rem;
        color: #cbd5e1;
    }

    .sf-net-val {
        font-size: 1.15rem;
        font-weight: 700;
    }

        .sf-net-val.green {
            color: #34d399;
        }

        .sf-net-val.blue {
            color: #38bdf8;
        }

    .sf-net-side small {
        font-size: 0.74rem;
        color: #94a3b8;
    }

    .sf-ring-wrap {
        position: relative;
        width: 112px;
        height: 112px;
    }

    .sf-ring-svg {
        width: 100%;
        height: 100%;
    }

    .sf-ring-bolt {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        color: #34d399;
    }

    /* Фінансова аналітика */
    .sf-analytics-card {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .sf-period-pills {
        display: inline-flex;
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 8px;
        padding: 2px;
    }

        .sf-period-pills button {
            padding: 4px 10px;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: #94a3b8;
            font-size: 0.78rem;
            font-weight: 600;
            cursor: pointer;
        }

            .sf-period-pills button.active {
                background: rgba(56, 189, 248, 0.22);
                color: #f8fafc;
            }

    .sf-legend-row {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        font-size: 0.76rem;
        color: #94a3b8;
        margin-bottom: 10px;
    }

    .dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 5px;
    }

        .dot.green {
            background: #10b981;
        }

        .dot.blue {
            background: #38bdf8;
        }

    .sf-chart-box {
        margin-top: auto;
    }

    .sf-area-svg {
        width: 100%;
        height: 145px;
        display: block;
    }

    .sf-x-labels {
        display: flex;
        justify-content: space-between;
        margin-top: 6px;
        font-size: 0.72rem;
        color: #94a3b8;
    }

    /* Екологічний блок */
    .sf-eco-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        background: radial-gradient(circle at center, rgba(16, 185, 129, 0.16) 0%, rgba(15, 28, 42, 0.92) 72%);
    }

    .sf-eco-grid-visual {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        height: 100%;
        align-items: center;
    }

    .sf-eco-node {
        background: rgba(11, 22, 34, 0.75);
        border: 1px solid rgba(52, 211, 153, 0.22);
        border-radius: 14px;
        padding: 14px;
        text-align: center;
    }

    .sf-eco-icon-circle {
        width: 44px;
        height: 44px;
        margin: 0 auto 8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 1.05rem;
    }

        .sf-eco-icon-circle.green {
            background: rgba(16, 185, 129, 0.2);
            border: 1px solid #10b981;
        }

        .sf-eco-icon-circle.cyan {
            background: rgba(56, 189, 248, 0.2);
            border: 1px solid #38bdf8;
            color: #7dd3fc;
        }

        .sf-eco-icon-circle.emerald {
            background: rgba(52, 211, 153, 0.2);
            border: 1px solid #34d399;
        }

    .sf-eco-metric {
        font-size: 1.15rem;
        font-weight: 700;
        color: #f8fafc;
    }

    .sf-eco-sub {
        margin-top: 3px;
        font-size: 0.76rem;
        color: #94a3b8;
    }

    .sf-eco-center-art {
        grid-column: 1 / -1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 18px 12px;
        border-radius: 16px;
        border: 1px dashed rgba(52, 211, 153, 0.35);
        background: rgba(16, 185, 129, 0.06);
    }

    .sf-glow-tree {
        font-size: 3.4rem;
        filter: drop-shadow(0 0 18px rgba(16, 185, 129, 0.65));
    }

    .sf-eco-annual-pill {
        margin-top: 10px;
        padding: 5px 14px;
        border-radius: 999px;
        background: rgba(16, 185, 129, 0.18);
        color: #a7f3d0;
        font-size: 0.82rem;
    }
</style>