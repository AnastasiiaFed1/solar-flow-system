<script setup lang="ts">
    import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
    import 'leaflet/dist/leaflet.css';
    import SolarHouse3D from './SolarHouse3D.vue';
    import {
        createConfiguratorState,
        PANEL_OPTIONS,
        INVERTER_OPTIONS,
        CITY_OPTIONS,
    } from '../../lib/configuratorStore';

    const {
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
    } = createConfiguratorState();

    const mapContainer = ref<HTMLElement | null>(null);
    let mapInstance: any = null;
    let markerInstance: any = null;

    onMounted(async () => {
        if (!mapContainer.value) return;
        const L = await import('leaflet');

        mapInstance = L.map(mapContainer.value, {
            center: [params.value.latitude, params.value.longitude],
            zoom: 5,
            zoomControl: true,
            attributionControl: false,
        });

        // Темні тайли карти світу під стиль SolarFlow
        L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
            {
                maxZoom: 18,
            }
        ).addTo(mapInstance);

        // Кастомний неоново-бірюзовий пін
        const pinIcon = L.divIcon({
            className: 'sf-leaflet-pin',
            html: `<div class="sf-pin-pulse"></div><div class="sf-pin-core"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        });

        markerInstance = L.marker([params.value.latitude, params.value.longitude], {
            icon: pinIcon,
            draggable: true,
        }).addTo(mapInstance);

        // Клік у будь-яку точку світу
        mapInstance.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            const normalizedLng = ((((lng + 180) % 360) + 360) % 360) - 180;
            setCustomCoordinates(lat, normalizedLng);
        });

        // Перетягування маркера по карті
        markerInstance.on('dragend', () => {
            const pos = markerInstance.getLatLng();
            const normalizedLng = ((((pos.lng + 180) % 360) + 360) % 360) - 180;
            setCustomCoordinates(pos.lat, normalizedLng);
        });
    });

    // Синхронізуємо позицію маркера при зміні міста або координат
    watch(
        () => [params.value.latitude, params.value.longitude],
        ([lat, lng]) => {
            if (markerInstance && mapInstance) {
                markerInstance.setLatLng([lat, lng]);
                mapInstance.panTo([lat, lng], { animate: true });
            }
        }
    );

    onBeforeUnmount(() => {
        if (mapInstance) {
            mapInstance.remove();
            mapInstance = null;
        }
    });

    const isCustomOrientation = computed(() => {
        return (
            params.value.tiltAngle !== metrics.value.recommendedTilt ||
            params.value.azimuthAngle !== metrics.value.recommendedAzimuth
        );
    });
</script>

<template>
    <div class="cfg-fullbleed">
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

            <!-- Основна двоколонкова робоча область -->
            <div class="cfg-workspace">
                <!-- ЛІВА КОЛОНКА: Конфігуратор (введення даних) -->
                <div class="cfg-left">
                    <h2 class="cfg-section-heading">
                        Конфігуратор (введення даних) <span>(Inputs &amp; settings)</span>
                    </h2>

                    <div class="cfg-columns">
                        <!-- Підколонка 1 -->
                        <div class="cfg-subcol">
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

                            <!-- Картка 3: Орієнтація масиву -->
                            <div class="cfg-card">
                                <div class="card-head-inline">
                                    <h3>Орієнтація масиву</h3>
                                    <button v-if="isCustomOrientation"
                                            type="button"
                                            class="auto-orient-btn"
                                            title="Застосувати рекомендовані кути для обраної точки на карті"
                                            @click="applyRecommendedOrientation">
                                        Авто ({{ metrics.recommendedTilt }}° / {{ metrics.recommendedAzimuth }}°)
                                    </button>
                                </div>

                                <div class="rec-hint">
                                    Рекомендовано для широти {{ Math.abs(params.latitude).toFixed(1) }}°:
                                    <strong>{{ metrics.recommendedTilt }}°</strong> нахил,
                                    <strong>{{ recommendedAzimuthLabel }}</strong>
                                </div>

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
                                           min="-180"
                                           max="180"
                                           step="5"
                                           class="cfg-range" />
                                    <div class="range-scale">
                                        <span>-180° (Пн)</span>
                                        <span>0° (Пд)</span>
                                        <span>+180° (Пн)</span>
                                    </div>
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
                        </div>

                        <!-- Підколонка 2 -->
                        <div class="cfg-subcol">
                            <!-- Картка 2: Локація та Географія (Інтерактивна карта світу) -->
                            <div class="cfg-card">
                                <div class="card-head-inline">
                                    <h3>Локація та Географія</h3>
                                    <span class="yield-pill">{{ params.specificYield }} кВт·год/kWp</span>
                                </div>

                                <select class="cfg-select"
                                        :value="params.cityId"
                                        @change="selectCity(($event.target as HTMLSelectElement).value)">
                                    <option v-if="params.cityId === 'custom'" value="custom">
                                        {{ params.locationLabel }}
                                    </option>
                                    <option v-for="city in CITY_OPTIONS" :key="city.id" :value="city.id">
                                        {{ city.name }}
                                    </option>
                                </select>

                                <div class="cfg-world-map-wrap">
                                    <div ref="mapContainer" class="cfg-leaflet-map"></div>
                                    <div class="map-overlay-hint">Клікніть у будь-яку точку світу</div>
                                    <div class="map-coords">
                                        {{ Math.abs(params.latitude).toFixed(2) }}° {{ params.latitude >= 0 ? 'N' : 'S' }},
                                        {{ Math.abs(params.longitude).toFixed(2) }}° {{ params.longitude >= 0 ? 'E' : 'W' }}
                                    </div>
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
                </div>

                <!-- ПРАВА КОЛОНКА: Деталізована 3D-модель та інтерактивна симуляція -->
                <div class="cfg-right">
                    <div class="cfg-sim-header">
                        <h2>3D-модель та інтерактивна симуляція СЕС</h2>
                        <span class="eff-badge">
                            Ефективність орієнтації: {{ metrics.orientationEfficiencyPercent }}%
                        </span>
                    </div>

                    <SolarHouse3D :panel-count="params.panelCount"
                                  :tilt-angle="params.tiltAngle"
                                  :azimuth-angle="params.azimuthAngle"
                                  :azimuth-label="azimuthDirectionLabel"
                                  :peak-power-kwp="metrics.peakPowerKwp"
                                  :daily-generation-kwh="metrics.estimatedDailyGenerationKwh"
                                  :battery-type="params.batteryType"
                                  :usable-battery-kwh="metrics.usableBatteryKwh"
                                  :battery-dod-percent="params.batteryDodPercent"
                                  :inverter-nominal-kw="params.inverterNominalKw"
                                  :inverter-efficiency-percent="params.inverterEfficiencyPercent"
                                  :dc-ac-ratio="metrics.dcAcRatio" />
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
    .cfg-leaflet-map {
        width: 100%;
        height: 100%;
        z-index: 1;
        background: #081522;
    }

    :deep(.leaflet-tile-pane) {
        filter: invert(100%) hue-rotate(195deg) brightness(86%) contrast(94%) saturate(135%);
    }

    .cfg-shell {
        max-width: 1520px;
        margin: 0 auto;
        padding: 1.15rem 1.75rem 2rem;
    }

    .cfg-topbar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding-bottom: 0.95rem;
        border-bottom: 1px solid rgba(56, 189, 248, 0.2);
        margin-bottom: 1.25rem;
    }

    .cfg-back-btn {
        padding: 0.45rem 0.95rem;
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.35);
        background: rgba(15, 23, 42, 0.75);
        color: #cbd5e1;
        text-decoration: none;
        font-size: 0.84rem;
        transition: all 0.15s ease;
    }

        .cfg-back-btn:hover {
            border-color: #38bdf8;
            color: #ffffff;
        }

    .cfg-center-nav {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.4rem;
    }

    .cfg-title {
        font-size: 1.08rem;
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
        gap: 0.65rem;
    }

    .cfg-tab {
        color: #94a3b8;
        text-decoration: none;
        font-size: 0.85rem;
        padding: 0.25rem 0.7rem;
        border-radius: 6px;
        transition: color 0.15s;
    }

        .cfg-tab:hover {
            color: #e2e8f0;
        }

        .cfg-tab.active {
            color: #2dd4bf;
            background: rgba(45, 212, 191, 0.12);
            border-bottom: 2px solid #2dd4bf;
        }

    .cfg-status-pill {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.4rem 0.9rem;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.85);
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
            box-shadow: 0 0 8px currentColor;
        }

    .cfg-workspace {
        display: grid;
        grid-template-columns: 1fr 1.08fr;
        gap: 1.5rem;
        align-items: start;
    }

    @media (max-width: 1100px) {
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

    .cfg-columns {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.95rem;
    }

    @media (max-width: 640px) {
        .cfg-columns {
            grid-template-columns: 1fr;
        }
    }

    .cfg-subcol {
        display: flex;
        flex-direction: column;
        gap: 0.95rem;
    }

    .cfg-card {
        background: linear-gradient(165deg, rgba(16, 34, 53, 0.92), rgba(10, 22, 36, 0.94));
        border: 1px solid rgba(56, 189, 248, 0.26);
        border-radius: 12px;
        padding: 0.95rem 1.05rem;
        display: flex;
        flex-direction: column;
        gap: 0.62rem;
        box-shadow: 0 6px 20px rgba(2, 8, 18, 0.45), inset 0 1px 0 rgba(125, 211, 252, 0.12);
    }

    .card-head-inline {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
    }

    .cfg-card h3 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: #f8fafc;
    }

    .auto-orient-btn {
        background: rgba(45, 212, 191, 0.15);
        border: 1px solid rgba(45, 212, 191, 0.45);
        color: #2dd4bf;
        font-size: 0.72rem;
        font-weight: 600;
        padding: 0.18rem 0.55rem;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.15s;
    }

        .auto-orient-btn:hover {
            background: rgba(45, 212, 191, 0.28);
        }

    .rec-hint {
        font-size: 0.74rem;
        color: #94a3b8;
        background: rgba(8, 20, 34, 0.7);
        border-left: 2px solid #2dd4bf;
        padding: 0.28rem 0.55rem;
        border-radius: 4px;
    }

        .rec-hint strong {
            color: #6ee7b7;
        }

    .yield-pill {
        font-size: 0.72rem;
        color: #7dd3fc;
        background: rgba(56, 189, 248, 0.12);
        border: 1px solid rgba(56, 189, 248, 0.3);
        padding: 0.15rem 0.5rem;
        border-radius: 999px;
    }

    .cfg-select {
        width: 100%;
        padding: 0.45rem 0.65rem;
        border-radius: 8px;
        background: #0a1826;
        border: 1px solid #2b4d6e;
        color: #e2e8f0;
        font-size: 0.84rem;
        outline: none;
    }

        .cfg-select:focus {
            border-color: #2dd4bf;
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
        gap: 0.65rem;
        background: #0a1826;
        border: 1px solid #2b4d6e;
        border-radius: 8px;
        padding: 0.15rem 0.5rem;
    }

        .cfg-stepper button {
            background: transparent;
            border: none;
            color: #38bdf8;
            font-size: 1.05rem;
            cursor: pointer;
            padding: 0 0.25rem;
        }

            .cfg-stepper button:hover {
                color: #2dd4bf;
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
        font-size: 0.71rem;
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
        accent-color: #2dd4bf;
    }

    /* Інтерактивна карта світу Leaflet */
    .cfg-world-map-wrap {
        position: relative;
        border-radius: 9px;
        overflow: hidden;
        border: 1px solid #214666;
        height: 155px;
        background: #081522;
    }

    .cfg-leaflet-map {
        width: 100%;
        height: 100%;
        z-index: 1;
    }

    .map-overlay-hint {
        position: absolute;
        top: 6px;
        right: 7px;
        z-index: 500;
        font-size: 0.67rem;
        color: #cbd5e1;
        background: rgba(6, 17, 27, 0.82);
        padding: 2px 7px;
        border-radius: 4px;
        pointer-events: none;
    }

    .map-coords {
        position: absolute;
        bottom: 6px;
        right: 7px;
        z-index: 500;
        font-size: 0.7rem;
        font-weight: 600;
        color: #2dd4bf;
        background: rgba(6, 17, 27, 0.86);
        padding: 2px 7px;
        border-radius: 4px;
        pointer-events: none;
    }

    :deep(.sf-leaflet-pin) {
        background: transparent;
        border: none;
    }

    :deep(.sf-pin-core) {
        position: absolute;
        top: 5px;
        left: 5px;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: #2dd4bf;
        border: 2px solid #04131c;
        box-shadow: 0 0 10px #2dd4bf;
    }

    :deep(.sf-pin-pulse) {
        position: absolute;
        top: 0;
        left: 0;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: rgba(45, 212, 191, 0.35);
        animation: pulseRing 1.8s infinite;
    }

    @keyframes pulseRing {
        0% {
            transform: scale(0.7);
            opacity: 0.9;
        }

        100% {
            transform: scale(1.7);
            opacity: 0;
        }
    }

    .summary-card {
        border-color: rgba(45, 212, 191, 0.45);
    }

    .cfg-save-btn {
        margin-top: 0.3rem;
        padding: 0.6rem 1rem;
        border-radius: 9px;
        border: none;
        background: linear-gradient(90deg, #14b8a6, #22d3ee);
        color: #04131c;
        font-weight: 700;
        font-size: 0.92rem;
        cursor: pointer;
        box-shadow: 0 0 18px rgba(45, 212, 191, 0.35);
        transition: transform 0.12s, opacity 0.15s;
    }

        .cfg-save-btn:hover {
            opacity: 0.94;
            transform: translateY(-1px);
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
        height: 100%;
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
        border: 1px solid rgba(16, 185, 129, 0.38);
        padding: 0.25rem 0.7rem;
        border-radius: 999px;
    }

</style>