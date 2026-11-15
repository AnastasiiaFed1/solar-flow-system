<script setup lang="ts">
import {
  createConfiguratorState,
  PANEL_OPTIONS,
  INVERTER_OPTIONS,
  CITY_OPTIONS,
} from '../../lib/configuratorStore';

const {
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
} = createConfiguratorState();
</script>

<template>
    <section class="cfg-shell">
        <!-- Верхня панель навігації -->
        <header class="cfg-topbar">
            <a href="/" class="cfg-back-btn">← Назад до Головного Дашборду</a>

            <div class="cfg-center-nav">
                <div class="cfg-title">
                    <span class="brand">SolarFlow</span>
                    <span class="sep">/</span>
                    <span>System Config &amp; Controls</span>
                </div>
                <nav class="cfg-tabs">
                    <a href="/configurator" class="cfg-tab active">[ Конфігуратор СЕС ]</a>
                    <a href="/smart-grid" class="cfg-tab">[ Smart Grid &amp; Прилади ]</a>
                    <a href="/finance" class="cfg-tab">[ Фінанси &amp; Eco ]</a>
                </nav>
            </div>

            <div class="cfg-status-pill" :class="{ online: isApiOnline }">
                <span class="dot"></span>
                <span>{{ systemStatusText }}</span>
            </div>
        </header>

        <!-- Основна сітка: зліва параметри, справа інтерактивна модель -->
        <div class="cfg-workspace">
            <!-- ЛІВА КОЛОНКА -->
            <div class="cfg-left">
                <h2 class="cfg-section-heading">
                    Конфігуратор (введення даних) <span>(Inputs &amp; settings)</span>
                </h2>

                <div class="cfg-cards-grid">
                    <!-- Картка 1: Сонячні панелі -->
                    <div class="cfg-card">
                        <h3>Сонячні панелі</h3>
                        <select class="cfg-select"
                                :value="params.panelModelId"
                                @change="selectPanelModel(($event.target as HTMLSelectElement).value)">
                            <option v-for="opt in PANEL_OPTIONS" :key="opt.id" :value="opt.id">
                                {{ opt.label }}
                            </option>
                        </select>

                        <div class="cfg-row">
                            <span>Потужність Wp:</span>
                            <strong class="val-cyan">{{ params.panelWatts }}</strong>
                        </div>

                        <div class="cfg-row">
                            <span>Кількість:</span>
                            <div class="cfg-stepper">
                                <button type="button" @click="changePanelCount(-1)">−</button>
                                <span>{{ params.panelCount }}</span>
                                <button type="button" @click="changePanelCount(1)">+</button>
                            </div>
                        </div>

                        <div class="cfg-row">
                            <span>Площа масиву:</span>
                            <strong class="val-cyan">{{ metrics.totalAreaM2 }} m²</strong>
                        </div>
                    </div>

                    <!-- Картка 2: Локація та Географія -->
                    <div class="cfg-card">
                        <h3>Локація та Географія</h3>
                        <select class="cfg-select"
                                :value="params.cityId"
                                @change="selectCity(($event.target as HTMLSelectElement).value)">
                            <option v-for="city in CITY_OPTIONS" :key="city.id" :value="city.id">
                                {{ city.name }}
                            </option>
                        </select>

                        <div class="cfg-mini-map">
                            <svg viewBox="0 0 220 110" class="map-svg">
                                <rect width="220" height="110" rx="8" fill="#0d2235" />
                                <path d="M15,45 Q60,20 110,35 T205,40 M10,75 Q80,60 140,80 T210,70 M75,10 L90,100 M145,10 L135,100"
                                      stroke="#1e496b"
                                      stroke-width="1.5"
                                      fill="none" />
                                <path d="M25,52 L55,34 L105,30 L155,38 L190,54 L170,82 L115,88 L65,78 Z"
                                      fill="rgba(20, 184, 166, 0.14)"
                                      stroke="#2dd4bf"
                                      stroke-width="1" />
                            </svg>
                            <div class="map-pin"
                                 :style="{ left: `${selectedCity.mapX}%`, top: `${selectedCity.mapY}%` }">
                                <span class="pin-dot"></span>
                                <span class="pin-label">{{ selectedCity.name.split(',')[0] }}</span>
                            </div>
                            <div class="map-coords">
                                {{ params.latitude.toFixed(2) }}° N, {{ params.longitude.toFixed(2) }}° E
                            </div>
                        </div>
                    </div>

                    <!-- Картка 3: Орієнтація масиву -->
                    <div class="cfg-card">
                        <h3>Орієнтація масиву</h3>

                        <div class="cfg-slider-block">
                            <div class="cfg-row">
                                <span>Кут нахилу (Tilt):</span>
                                <strong class="val-cyan">{{ params.tiltAngle }}°</strong>
                            </div>
                            <input v-model.number="params.tiltAngle"
                                   type="range"
                                   min="0"
                                   max="90"
                                   step="1"
                                   class="cfg-range" />
                            <div class="range-scale"><span>0°</span><span>90°</span></div>
                        </div>

                        <div class="cfg-slider-block">
                            <div class="cfg-row">
                                <span>Азимут (Azimuth):</span>
                                <strong class="val-cyan">{{ azimuthDirectionLabel }}</strong>
                            </div>
                            <input v-model.number="params.azimuthAngle"
                                   type="range"
                                   min="-90"
                                   max="90"
                                   step="5"
                                   class="cfg-range" />
                            <div class="range-scale"><span>-90°</span><span>+90°</span></div>
                        </div>
                    </div>

                    <!-- Картка 4: Інвертор -->
                    <div class="cfg-card">
                        <h3>Інвертор</h3>
                        <select class="cfg-select"
                                :value="params.inverterModelId"
                                @change="selectInverter(($event.target as HTMLSelectElement).value)">
                            <option v-for="inv in INVERTER_OPTIONS" :key="inv.id" :value="inv.id">
                                {{ inv.label }}
                            </option>
                        </select>

                        <div class="cfg-row">
                            <span>Номінальна потужність:</span>
                            <strong class="val-cyan">{{ params.inverterNominalKw.toFixed(1) }} kW</strong>
                        </div>

                        <div class="cfg-slider-block">
                            <div class="cfg-row">
                                <span>ККД:</span>
                                <strong class="val-cyan">{{ params.inverterEfficiencyPercent }}%</strong>
                            </div>
                            <input v-model.number="params.inverterEfficiencyPercent"
                                   type="range"
                                   min="90"
                                   max="99"
                                   step="1"
                                   class="cfg-range" />
                        </div>
                    </div>

                    <!-- Картка 5: Акумуляторна батарея (АКБ) -->
                    <div class="cfg-card">
                        <h3>Акумуляторна батарея (АКБ)</h3>
                        <div class="cfg-radio-row">
                            <span>Тип:</span>
                            <label class="cfg-radio">
                                <input type="radio"
                                       name="batType"
                                       :checked="params.batteryType === 'LiFePO4'"
                                       @change="setBatteryType('LiFePO4')" />
                                <span>LiFePO4</span>
                            </label>
                            <label class="cfg-radio">
                                <input type="radio"
                                       name="batType"
                                       :checked="params.batteryType === 'AGM/GEL'"
                                       @change="setBatteryType('AGM/GEL')" />
                                <span>AGM/GEL</span>
                            </label>
                        </div>

                        <div class="cfg-slider-block">
                            <div class="cfg-row">
                                <span>Повна ємність:</span>
                                <strong class="val-cyan">{{ params.batteryCapacityKwh }} kWh</strong>
                            </div>
                            <input v-model.number="params.batteryCapacityKwh"
                                   type="range"
                                   min="2"
                                   max="40"
                                   step="1"
                                   class="cfg-range" />
                        </div>

                        <div class="cfg-slider-block">
                            <div class="cfg-row">
                                <span>Глибина розряду DoD:</span>
                                <strong class="val-cyan">{{ params.batteryDodPercent }}%</strong>
                            </div>
                            <input v-model.number="params.batteryDodPercent"
                                   type="range"
                                   min="40"
                                   max="95"
                                   step="5"
                                   class="cfg-range" />
                        </div>
                    </div>

                    <!-- Картка 6: Підсумок конфігурації -->
                    <div class="cfg-card summary-card">
                        <h3>Підсумок конфігурації</h3>

                        <div class="cfg-row">
                            <span>Пікова потужність:</span>
                            <strong class="val-accent">{{ metrics.peakPowerKwp.toFixed(1) }} kWp</strong>
                        </div>

                        <div class="cfg-row">
                            <span>Корисна ємність АКБ:</span>
                            <strong class="val-accent">{{ metrics.usableBatteryKwh.toFixed(1) }} kWh</strong>
                        </div>

                        <div class="cfg-row">
                            <span>Річна генерація:</span>
                            <strong class="val-cyan">~{{ metrics.estimatedAnnualGenerationKwh }} кВт·год</strong>
                        </div>

                        <button type="button"
                                class="cfg-save-btn"
                                :disabled="isSaving"
                                @click="saveConfiguration">
                            {{ isSaving ? 'Збереження...' : 'Зберегти конфіг' }}
                        </button>

                        <p v-if="saveFeedback" class="cfg-feedback">{{ saveFeedback }}</p>
                    </div>
                </div>
            </div>

            <!-- ПРАВА КОЛОНКА: Інтерактивна 3D-симуляція -->
            <div class="cfg-right">
                <div class="cfg-sim-header">
                    <h2>3D-модель та інтерактивна симуляція СЕС</h2>
                    <span class="eff-badge">
                        Ефективність орієнтації: {{ metrics.orientationEfficiencyPercent }}%
                    </span>
                </div>

                <div class="cfg-scene-box">
                    <svg viewBox="0 0 560 440" class="house-svg">
                        <defs>
                            <radialGradient id="sceneGlow" cx="55%" cy="45%" r="55%">
                                <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.22" />
                                <stop offset="100%" stop-color="#07131d" stop-opacity="0" />
                            </radialGradient>
                            <linearGradient id="panelGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#0284c7" />
                                <stop offset="100%" stop-color="#1e3a8a" />
                            </linearGradient>
                        </defs>

                        <rect width="560" height="440" rx="14" fill="#081622" />
                        <rect width="560" height="440" rx="14" fill="url(#sceneGlow)" />

                        <!-- Дуга азимута зверху -->
                        <path d="M 220 62 Q 330 36 445 78"
                              stroke="#34d399"
                              stroke-width="2"
                              stroke-dasharray="4 3"
                              fill="none" />
                        <polygon points="445,78 436,71 438,81" fill="#34d399" />
                        <text x="275" y="42" fill="#e2e8f0" font-size="13" font-weight="600">
                            Азимут: {{ params.azimuthAngle }}°
                        </text>

                        <!-- Кут нахилу зліва -->
                        <path d="M 115 175 L 155 175 L 145 142"
                              stroke="#38bdf8"
                              stroke-width="1.8"
                              fill="none" />
                        <text x="58" y="162" fill="#e2e8f0" font-size="13" font-weight="600">
                            Кут: {{ params.tiltAngle }}°
                        </text>

                        <!-- Ізометричний будинок -->
                        <!-- Ліва стіна -->
                        <polygon points="145,215 245,255 245,355 145,310" fill="#132638" stroke="#284663" />
                        <!-- Передня права стіна -->
                        <polygon points="245,255 430,205 430,310 245,355" fill="#1b354d" stroke="#33587a" />
                        <!-- Вікна з теплим світлом -->
                        <polygon points="275,272 308,263 308,295 275,304" fill="#fbbf24" opacity="0.85" />
                        <polygon points="325,259 358,250 358,282 325,291" fill="#fbbf24" opacity="0.85" />

                        <!-- Дах -->
                        <polygon points="130,210 245,115 445,165 330,245" fill="#0f2336" stroke="#38bdf8" stroke-width="1.2" />
                        <polygon points="130,210 245,115 245,255 145,215" fill="#0b1a29" />

                        <!-- Масив сонячних панелей на даху (динамічна кількість) -->
                        <g v-for="idx in Math.min(params.panelCount, 16)"
                           :key="idx"
                           :transform="`translate(${185 + ((idx - 1) % 4) * 48}, ${142 + Math.floor((idx - 1) / 4) * 20 - ((idx - 1) % 4) * 6}) skewY(-14)`">
                            <rect width="42"
                                  height="16"
                                  rx="2"
                                  fill="url(#panelGrad)"
                                  stroke="#7dd3fc"
                                  stroke-width="1" />
                        </g>

                        <!-- Інвертор на лівій стіні будинку -->
                        <rect x="178" y="255" width="32" height="44" rx="4" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5" />
                        <circle cx="194" cy="272" r="5" fill="#10b981" />
                        <text x="275" y="395" fill="#cbd5e1" font-size="13">
                            Інвертор СЕС ({{ params.inverterNominalKw }} kW)
                        </text>
                        <line x1="194" y1="302" x2="270" y2="388" stroke="#64748b" stroke-width="1" />

                        <!-- Акумуляторна батарея зліва -->
                        <g transform="translate(56, 268)">
                            <rect width="58" height="72" rx="6" fill="#0f293a" stroke="#2dd4bf" stroke-width="1.8" />
                            <rect x="14" y="-6" width="30" height="6" rx="2" fill="#2dd4bf" />
                            <polygon points="31,18 21,38 29,38 25,54 38,33 30,33" fill="#34d399" />
                        </g>
                        <text x="32" y="378" fill="#cbd5e1" font-size="13">
                            АКБ ({{ params.batteryType }})
                        </text>
                        <text x="32" y="396" fill="#34d399" font-size="12" font-weight="600">
                            Корисна: {{ metrics.usableBatteryKwh }} kWh
                        </text>

                        <!-- Потоки енергії (анімовані лінії) -->
                        <path d="M 220 205 L 194 255"
                              stroke="#38bdf8"
                              stroke-width="3"
                              stroke-dasharray="6 4"
                              fill="none" />
                        <path d="M 178 282 L 116 302"
                              stroke="#34d399"
                              stroke-width="3"
                              stroke-dasharray="6 4"
                              fill="none" />

                        <!-- Індикатор генерації СЕС справа -->
                        <g transform="translate(475, 195)">
                            <circle cx="25" cy="0" r="24" fill="rgba(16, 185, 129, 0.14)" stroke="#10b981" stroke-width="2" />
                            <text x="25" y="5" text-anchor="middle" fill="#34d399" font-size="12" font-weight="700">
                                {{ metrics.peakPowerKwp }} kWp
                            </text>
                            <text x="25" y="42" text-anchor="middle" fill="#cbd5e1" font-size="12">
                                Генерація СЕС
                            </text>
                            <text x="25" y="58" text-anchor="middle" fill="#38bdf8" font-size="11">
                                ~{{ metrics.estimatedDailyGenerationKwh }} кВт·год/день
                            </text>
                        </g>
                    </svg>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
    .cfg-shell {
        background: radial-gradient(circle at top right, #0e2438 0%, #07121c 65%);
        color: #e2e8f0;
        min-height: 100vh;
        padding: 1.25rem 1.75rem 2rem;
        font-family: system-ui, -apple-system, sans-serif;
    }

    .cfg-topbar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(56, 189, 248, 0.18);
        margin-bottom: 1.25rem;
    }

    .cfg-back-btn {
        padding: 0.45rem 0.9rem;
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.3);
        background: rgba(15, 23, 42, 0.7);
        color: #cbd5e1;
        text-decoration: none;
        font-size: 0.85rem;
    }

        .cfg-back-btn:hover {
            border-color: #38bdf8;
            color: #ffffff;
        }

    .cfg-center-nav {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.45rem;
    }

    .cfg-title {
        font-size: 1.05rem;
        font-weight: 600;
    }

        .cfg-title .brand {
            color: #34d399;
        }

        .cfg-title .sep {
            margin: 0 0.45rem;
            color: #64748b;
        }

    .cfg-tabs {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
    }

    .cfg-tab {
        color: #94a3b8;
        text-decoration: none;
        font-size: 0.85rem;
        padding: 0.25rem 0.65rem;
        border-radius: 6px;
    }

        .cfg-tab.active {
            color: #2dd4bf;
            background: rgba(45, 212, 191, 0.14);
            border: 1px solid rgba(45, 212, 191, 0.45);
        }

    .cfg-status-pill {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.4rem 0.85rem;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.8);
        border: 1px solid rgba(251, 191, 36, 0.4);
        font-size: 0.82rem;
        color: #fde68a;
    }

        .cfg-status-pill.online {
            border-color: rgba(16, 185, 129, 0.45);
            color: #6ee7b7;
        }

        .cfg-status-pill .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
        }

    .cfg-workspace {
        display: grid;
        grid-template-columns: 1.05fr 1fr;
        gap: 1.5rem;
    }

    @media (max-width: 1024px) {
        .cfg-workspace {
            grid-template-columns: 1fr;
        }
    }

    .cfg-section-heading {
        font-size: 1rem;
        font-weight: 600;
        margin: 0 0 0.85rem;
        color: #f1f5f9;
    }

        .cfg-section-heading span {
            color: #94a3b8;
            font-weight: 400;
        }

    .cfg-cards-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.95rem;
    }

    @media (max-width: 640px) {
        .cfg-cards-grid {
            grid-template-columns: 1fr;
        }
    }

    .cfg-card {
        background: rgba(13, 27, 42, 0.85);
        border: 1px solid rgba(56, 189, 248, 0.25);
        border-radius: 12px;
        padding: 0.95rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        box-shadow: 0 0 18px rgba(14, 165, 233, 0.06);
    }

        .cfg-card h3 {
            margin: 0;
            font-size: 0.95rem;
            color: #f8fafc;
        }

    .cfg-select {
        width: 100%;
        padding: 0.42rem 0.6rem;
        border-radius: 7px;
        background: #0b1929;
        border: 1px solid #294866;
        color: #e2e8f0;
        font-size: 0.84rem;
    }

    .cfg-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.85rem;
        color: #cbd5e1;
    }

    .val-cyan {
        color: #38bdf8;
    }

    .val-accent {
        color: #2dd4bf;
        font-size: 0.95rem;
    }

    .cfg-stepper {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        background: #0b1929;
        border: 1px solid #294866;
        border-radius: 7px;
        padding: 0.15rem 0.45rem;
    }

        .cfg-stepper button {
            background: transparent;
            border: none;
            color: #38bdf8;
            font-size: 1rem;
            cursor: pointer;
            padding: 0 0.25rem;
        }

    .cfg-slider-block {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .cfg-range {
        width: 100%;
        accent-color: #2dd4bf;
        cursor: pointer;
    }

    .range-scale {
        display: flex;
        justify-content: space-between;
        font-size: 0.72rem;
        color: #64748b;
    }

    .cfg-radio-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 0.84rem;
    }

    .cfg-radio {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        cursor: pointer;
    }

    .cfg-mini-map {
        position: relative;
        border-radius: 8px;
        overflow: hidden;
        border: 1px solid #1e3f5c;
        height: 105px;
    }

    .map-svg {
        width: 100%;
        height: 100%;
        display: block;
    }

    .map-pin {
        position: absolute;
        transform: translate(-50%, -50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
    }

    .pin-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #2dd4bf;
        box-shadow: 0 0 10px #2dd4bf;
    }

    .pin-label {
        font-size: 0.72rem;
        font-weight: 600;
        color: #ffffff;
        background: rgba(7, 18, 28, 0.8);
        padding: 0.05rem 0.35rem;
        border-radius: 4px;
        margin-top: 2px;
    }

    .map-coords {
        position: absolute;
        bottom: 4px;
        right: 6px;
        font-size: 0.68rem;
        color: #7dd3fc;
        background: rgba(7, 18, 28, 0.75);
        padding: 1px 5px;
        border-radius: 4px;
    }

    .summary-card {
        border-color: rgba(45, 212, 191, 0.45);
    }

    .cfg-save-btn {
        margin-top: 0.25rem;
        padding: 0.55rem 1rem;
        border-radius: 8px;
        border: none;
        background: linear-gradient(90deg, #14b8a6, #0ea5e9);
        color: #04131c;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        transition: opacity 0.15s;
    }

        .cfg-save-btn:hover {
            opacity: 0.92;
        }

    .cfg-feedback {
        margin: 0;
        font-size: 0.78rem;
        color: #34d399;
        text-align: center;
    }

    .cfg-right {
        display: flex;
        flex-direction: column;
    }

    .cfg-sim-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.85rem;
    }

        .cfg-sim-header h2 {
            margin: 0;
            font-size: 1rem;
            font-weight: 600;
        }

    .eff-badge {
        font-size: 0.8rem;
        color: #34d399;
        background: rgba(16, 185, 129, 0.14);
        border: 1px solid rgba(16, 185, 129, 0.35);
        padding: 0.25rem 0.65rem;
        border-radius: 999px;
    }

    .cfg-scene-box {
        flex: 1;
        border-radius: 14px;
        border: 1px solid rgba(56, 189, 248, 0.25);
        overflow: hidden;
        background: #081622;
        display: flex;
        align-items: center;
    }

    .house-svg {
        width: 100%;
        height: auto;
        display: block;
    }
</style>