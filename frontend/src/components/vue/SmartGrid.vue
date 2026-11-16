<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { useStore } from '@nanostores/vue';
    import * as energyStoreModule from '../../stores/energyStore';
    import ApplianceCard from './ApplianceCard.vue';
    import AutomationRules from './AutomationRules.vue';
    import LoadDiagram from './LoadDiagram.vue';

    const API_BASE_URL = 'http://localhost:5106/api/appliances';

    const storeAtom = energyStoreModule.$energySystem || energyStoreModule.energyStore || energyStoreModule.default;
    const system = storeAtom ? useStore(storeAtom) : ref(null);

    const appliances = ref([]);
    const isLoading = ref(false);
    const errorMessage = ref(null);

    const minPowerFilter = ref(undefined);
    const onlySmartGridFilter = ref(false);

    const batteryThreshold = ref(80);
    const isAutomationActive = ref(true);

    const newAppliance = ref({
        name: '',
        powerConsumptionWatts: 1000,
        priority: 2,
        isSmartGridEnabled: true,
        solarStationId: 1,
    });

    const activeStationId = computed(() => system.value?.stationId ?? 1);
    const currentBatteryLevel = computed(() => system.value?.metrics?.batteryLevel ?? 85);
    const solarGenerationWatts = computed(() => (system.value?.metrics?.solarPower ?? 3.5) * 1000);

    const isAutoTriggered = computed(
        () => isAutomationActive.value && currentBatteryLevel.value >= batteryThreshold.value
    );

    const totalConsumption = computed(() => {
        return appliances.value.reduce((sum, app) => {
            const power = app.powerConsumptionWatts ?? app.powerWatts ?? 0;
            const isActive = app.isSmartGridEnabled ?? app.isActive ?? true;
            return sum + (isActive ? power : 0);
        }, 0);
    });

    async function fetchAppliances() {
        isLoading.value = true;
        errorMessage.value = null;

        try {
            const params = new URLSearchParams();
            if (minPowerFilter.value && minPowerFilter.value > 0) {
                params.append('minPower', String(minPowerFilter.value));
            }
            if (onlySmartGridFilter.value) {
                params.append('isActive', 'true');
            }

            const query = params.toString();
            const url = query ? `${API_BASE_URL}?${query}` : API_BASE_URL;

            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP помилка: ${response.status}`);

            appliances.value = await response.json();
        } catch (err) {
            errorMessage.value = 'Не вдалося з’єднатися з .NET API. Відображено локальні тестові дані.';
            if (appliances.value.length === 0) {
                appliances.value = [
                    { id: 1, name: 'Холодильник', powerConsumptionWatts: 150, priority: 1, isSmartGridEnabled: true, solarStationId: 1 },
                    { id: 2, name: 'Електричний бойлер', powerConsumptionWatts: 2000, priority: 2, isSmartGridEnabled: true, solarStationId: 1 },
                    { id: 3, name: 'Зарядна станція EV', powerConsumptionWatts: 3500, priority: 3, isSmartGridEnabled: false, solarStationId: 1 },
                    { id: 4, name: 'Пральна машина', powerConsumptionWatts: 1200, priority: 3, isSmartGridEnabled: true, solarStationId: 1 },
                ];
            }
        } finally {
            isLoading.value = false;
        }
    }

    async function handleCreateAppliance() {
        if (!newAppliance.value.name.trim()) return;

        const payload = {
            ...newAppliance.value,
            solarStationId: activeStationId.value,
        };

        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                errorMessage.value = null;
                const text = await response.text();
                const created = text ? JSON.parse(text) : { id: Date.now(), ...payload };
                appliances.value = [...appliances.value, created];
            } else {
                const errText = await response.text();
                errorMessage.value = `Сервер відхилив збереження (${response.status}): ${errText}`;
                throw new Error(errText);
            }
        } catch {
            appliances.value = [
                ...appliances.value,
                {
                    id: Date.now(),
                    ...payload,
                },
            ];
        }

        newAppliance.value.name = '';
        newAppliance.value.powerConsumptionWatts = 1000;
    }

    async function updateApplianceState(appliance) {
        try {
            await fetch(`${API_BASE_URL}/${appliance.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: appliance.name,
                    powerConsumptionWatts: appliance.powerConsumptionWatts ?? appliance.powerWatts,
                    priority: appliance.priority,
                    isSmartGridEnabled: appliance.isSmartGridEnabled,
                    isActive: appliance.isSmartGridEnabled,
                }),
            });
        } catch {
            // Офлайн
        }
    }

    function handleToggleSmartGrid(id, newState) {
        const target = appliances.value.find((a) => a.id === id);
        if (!target) return;
        target.isSmartGridEnabled = newState;
        updateApplianceState(target);
    }

    function handleChangePriority(id, priority) {
        const target = appliances.value.find((a) => a.id === id);
        if (!target) return;
        target.priority = priority;
        updateApplianceState(target);
    }

    async function handleDeleteAppliance(id) {
        try {
            await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
        } catch {
            // Офлайн
        }
        appliances.value = appliances.value.filter((a) => a.id !== id);
    }

    onMounted(() => {
        fetchAppliances();
    });
</script>

<template>
    <div class="cfg-fullbleed">
        <section class="cfg-shell">

            <!-- ШАПКА -->
            <header class="cfg-topbar">
                <a href="/" class="cfg-back-btn">← Назад до Головного Дашборду</a>

                <div class="cfg-center-nav">
                    <div class="cfg-title">
                        <span class="brand">SolarFlow</span>
                        <span class="sep">/</span>
                        <span>System Config &amp; Controls</span>
                    </div>
                    <nav class="cfg-tabs">
                        <a href="/configurator" class="cfg-tab">[ Конфігуратор СЕС ]</a>
                        <a href="/smart-grid" class="cfg-tab active">[ Smart Grid &amp; Прилади ]</a>
                        <a href="/finance" class="cfg-tab">[ Фінанси &amp; Eco ]</a>
                    </nav>
                </div>

                <div class="cfg-status-pill online">
                    <span class="dot"></span>
                    <span>Система активна (Smart Grid)</span>
                </div>
            </header>

            <!-- БАНЕР ПОМИЛКИ -->
            <div v-if="errorMessage" class="cfg-card mb-4 text-amber-400 text-xs">
                {{ errorMessage }}
            </div>

            <!-- ГОЛОВНИЙ ДВОКОЛОНКОВИЙ МАКЕТ -->
            <div class="cfg-workspace">

                <!-- ЛІВА КОЛОНКА -->
                <div class="cfg-left">
                    <h2 class="cfg-section-heading">
                        Керування Smart Grid <span>(Automation &amp; Controls)</span>
                    </h2>

                    <div class="cfg-subcol">
                        <!-- Правила автоматизації -->
                        <div class="cfg-card">
                            <AutomationRules v-model:batteryThreshold="batteryThreshold"
                                             v-model:isAutomationActive="isAutomationActive"
                                             :currentBatteryLevel="currentBatteryLevel" />
                        </div>

                        <!-- Діаграма балансу -->
                        <div class="cfg-card">
                            <LoadDiagram :appliances="appliances"
                                         :solarGenerationWatts="solarGenerationWatts" />
                        </div>

                        <!-- Форма додавання приладів та фільтри -->
                        <div class="cfg-card">
                            <form class="appliance-form-group" @submit.prevent="handleCreateAppliance">
                                <input v-model="newAppliance.name" type="text" placeholder="Назва приладу (напр. Бойлер)" required class="cfg-select w-full" />
                                <input v-model.number="newAppliance.powerConsumptionWatts" type="number" min="10" step="10" placeholder="Вт" required class="cfg-select w-full" />
                                <select v-model.number="newAppliance.priority" class="cfg-select w-full">
                                    <option :value="1">P1: Критичний</option>
                                    <option :value="2">P2: Стандарт</option>
                                    <option :value="3">P3: Smart Grid</option>
                                </select>
                                <button type="submit" class="cfg-save-btn w-full py-2.5 text-xs">
                                    + Додати прилад
                                </button>
                            </form>

                            <div class="appliance-filter-group">
                                <input v-model.number="minPowerFilter"
                                       type="number"
                                       min="0"
                                       step="100"
                                       placeholder="Мін. Вт"
                                       @change="fetchAppliances"
                                       class="cfg-select w-full text-xs" />

                                <div class="flex items-center justify-between py-1">
                                    <label class="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                                        <input v-model="onlySmartGridFilter" type="checkbox" @change="fetchAppliances" class="accent-[#2dd4bf] w-4 h-4" />
                                        <span>Тільки Smart Grid</span>
                                    </label>
                                </div>

                                <button type="button" class="cfg-back-btn text-xs py-2 w-full text-center" :disabled="isLoading" @click="fetchAppliances">
                                    {{ isLoading ? 'Оновлення...' : 'Оновити API' }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ПРАВА КОЛОНКА (Збалансований блок візуалізації із суворим співвідношенням 16/9) -->
                <div class="cfg-right">
                    <div class="cfg-sim-header">
                        <h2>Інтерактивна Візуалізація Навантажень СЕС</h2>
                        <span class="eff-badge">Live Sync</span>
                    </div>

                    <div class="house-stage">
                        <div class="house-aspect-box">
                            <img src="/images/smart-grid-house-3d.jpg"
                                 alt="Smart Grid House 3D"
                                 class="house-base-img" />

                            <!-- SVG із точними оригінальними координатами -->
                            <svg viewBox="0 0 960 540" class="house-overlay-svg" preserveAspectRatio="xMidYMid meet">
                                <defs>
                                    <filter id="pulseGlow" x="-30%" y="-30%" width="160%" height="160%">
                                        <feGaussianBlur stdDeviation="3.2" result="blur" />
                                        <feMerge>
                                            <feMergeNode in="blur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                </defs>

                                <g fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#pulseGlow)">
                                    <!-- Лінія 1 -->
                                    <path d="M 260 385 L 413 436 L 479 420 L 466 405 L 463 331"
                                          stroke="#34d399" stroke-width="3" class="current-stream" />

                                    <!-- Лінія 2 -->
                                    <path d="M 473 328 L 474 403 L 485 411 L 656 366 L 650 361 L 648 352 L 632 347"
                                          stroke="#2dd4bf" stroke-width="3" class="current-stream" />

                                    <!-- Лінія 3 -->
                                    <path d="M 669 366 L 684 362 L 671 356 L 670 257 L 579 248"
                                          stroke="#38bdf8" stroke-width="3" class="current-stream" />

                                    <!-- Лінія 4 -->
                                    <path d="M 459 321 L 449 321 L 448 406 L 315 360 L 317 350 L 334 347"
                                          stroke="#34d399" stroke-width="2.8" class="current-stream" />

                                    <!-- Лінія 5 -->
                                    <path d="M 418 159 L 409 160 L 453 213 L 461 295"
                                          stroke="#34d399" stroke-width="2.8" class="current-stream" />
                                </g>
                            </svg>

                            <!-- Інформаційні плашки стану -->
                            <div class="house-overlay-content">
                                <div class="overlay-badge badge-consumption">
                                    <span>Загальне споживання:</span><br>
                                    <strong class="text-[#2dd4bf]">{{ totalConsumption }} W</strong>
                                </div>

                                <div class="overlay-badge badge-battery">
                                    <span>АКБ: {{ currentBatteryLevel }}% (Поріг: {{ batteryThreshold }}%)</span>
                                </div>

                                <div class="overlay-badge badge-inverter text-right">
                                    <span class="font-bold text-slate-200">Smart Grid Активний</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <!-- НИЖНЯ СЕКЦІЯ ДЛЯ ПРИЛАДІВ -->
            <div class="cfg-appliances-section">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-sm font-semibold text-slate-200">Підключені прилади та споживачі</h3>
                    <span class="text-xs text-slate-400">Всього: {{ appliances.length }}</span>
                </div>

                <div v-if="isLoading" class="text-center py-6 text-slate-400 text-xs">Завантаження приладів...</div>
                <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ApplianceCard v-for="item in appliances"
                                   :key="item.id"
                                   :appliance="item"
                                   :isAutoTriggered="isAutoTriggered"
                                   @toggle-smart-grid="handleToggleSmartGrid"
                                   @change-priority="handleChangePriority"
                                   @delete="handleDeleteAppliance" />
                </div>
            </div>

        </section>
    </div>
</template>

<style scoped>
    .cfg-fullbleed {
        width: 100vw;
        min-height: 100vh;
        background: #06111b;
        color: #f1f5f9;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 40;
        box-sizing: border-box;
        overflow-x: hidden;
    }

    .cfg-shell {
        max-width: 1520px;
        margin: 0 auto;
        padding: 1.15rem 1.75rem 3rem;
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
        border: 1px solid rgba(16, 185, 129, 0.45);
        font-size: 0.82rem;
        color: #6ee7b7;
    }

        .cfg-status-pill .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
            box-shadow: 0 0 8px currentColor;
        }

    .appliance-form-group {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
    }

    .appliance-filter-group {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        margin-top: 1rem;
        padding-top: 0.9rem;
        border-top: 1px solid rgba(56, 189, 248, 0.15);
    }

    /* Оптимальний збалансований грід (1fr 1.35fr) */
    .cfg-workspace {
        display: grid;
        grid-template-columns: 1fr 1.35fr;
        gap: 1.75rem;
        align-items: start;
        margin-bottom: 2rem;
    }

    @media (max-width: 1100px) {
        .cfg-workspace {
            grid-template-columns: 1fr;
        }
    }

    .cfg-left {
        display: flex;
        flex-direction: column;
    }

    .cfg-right {
        display: flex;
        flex-direction: column;
        position: sticky;
        top: 1.5rem;
    }

    /* Візуалізація з суворим співвідношенням 16/9, щоб усі лінії збігалися */
    .house-stage {
        position: relative;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        overflow: hidden;
        background: radial-gradient(circle at 50% 52%, #091d30 0%, #06121e 68%, #040c15 100%);
        border: 1px solid rgba(56, 189, 248, 0.28);
        box-shadow: 0 10px 30px rgba(2, 8, 18, 0.55);
    }

    .house-aspect-box {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 10;
    }

    .house-base-img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;
        user-select: none;
    }

    .house-overlay-svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
    }

    .current-stream {
        stroke-dasharray: 10 14;
        animation: electricFlow 1.5s linear infinite;
    }

    @keyframes electricFlow {
        from {
            stroke-dashoffset: 48;
        }

        to {
            stroke-dashoffset: 0;
        }
    }

    .house-overlay-content {
        position: absolute;
        inset: 0;
        pointer-events: none;
    }

    .overlay-badge {
        position: absolute;
        background: rgba(8, 21, 34, 0.9);
        backdrop-filter: blur(4px);
        border: 1px solid rgba(56, 189, 248, 0.3);
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 11px;
        font-family: monospace;
        color: #f1f5f9;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }

    .badge-consumption {
        bottom: 12px;
        left: 12px;
        font-size: 11.5px;
    }

    .badge-battery {
        bottom: 12px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
    }

    .badge-inverter {
        bottom: 12px;
        right: 12px;
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

    .cfg-save-btn {
        padding: 0.5rem 1rem;
        border-radius: 9px;
        border: none;
        background: linear-gradient(90deg, #14b8a6, #22d3ee);
        color: #04131c;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        box-shadow: 0 0 18px rgba(45, 212, 191, 0.35);
        transition: transform 0.12s, opacity 0.15s;
    }

        .cfg-save-btn:hover {
            opacity: 0.94;
            transform: translateY(-1px);
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

    .cfg-appliances-section {
        background: linear-gradient(165deg, rgba(14, 30, 48, 0.8), rgba(8, 18, 30, 0.85));
        border: 1px solid rgba(56, 189, 248, 0.22);
        border-radius: 14px;
        padding: 1.25rem;
        box-shadow: 0 8px 24px rgba(2, 8, 18, 0.4);
    }
</style>