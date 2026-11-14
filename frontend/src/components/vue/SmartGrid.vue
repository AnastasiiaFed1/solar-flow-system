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
                    { id: 1, name: 'Холодильник та роутер', powerConsumptionWatts: 250, priority: 1, isSmartGridEnabled: false, solarStationId: 1 },
                    { id: 2, name: 'Електричний бойлер', powerConsumptionWatts: 2000, priority: 3, isSmartGridEnabled: true, solarStationId: 1 },
                    { id: 3, name: 'Зарядна станція EV', powerConsumptionWatts: 3500, priority: 3, isSmartGridEnabled: true, solarStationId: 1 },
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
            // Ігноруємо мережеву помилку в офлайн-режимі
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
            // Офлайн-фолбек
        }
        appliances.value = appliances.value.filter((a) => a.id !== id);
    }

    onMounted(() => {
        fetchAppliances();
    });
</script>

<template>
    <div class="smart-grid-hub">
        <header class="hub-header">
            <h2>Appliance Control Hub & Smart Grid</h2>
            <p>Керування споживачами та автоматичні сценарії навантаження</p>
        </header>

        <div v-if="errorMessage" class="api-banner">
            {{ errorMessage }}
        </div>

        <div class="top-widgets">
            <AutomationRules v-model:batteryThreshold="batteryThreshold"
                             v-model:isAutomationActive="isAutomationActive"
                             :currentBatteryLevel="currentBatteryLevel" />
            <LoadDiagram :appliances="appliances"
                         :solarGenerationWatts="solarGenerationWatts" />
        </div>

        <div class="controls-bar">
            <form class="add-form" @submit.prevent="handleCreateAppliance">
                <input v-model="newAppliance.name" type="text" placeholder="Назва приладу (напр. Бойлер)" required />
                <input v-model.number="newAppliance.powerConsumptionWatts" type="number" min="10" step="10" placeholder="Вт" required />
                <select v-model.number="newAppliance.priority">
                    <option :value="1">P1: Критичний</option>
                    <option :value="2">P2: Стандарт</option>
                    <option :value="3">P3: Smart Grid</option>
                </select>
                <button type="submit" class="btn-primary">+ Додати прилад</button>
            </form>

            <div class="filter-group">
                <input v-model.number="minPowerFilter"
                       type="number"
                       min="0"
                       step="100"
                       placeholder="Мін. потужність (Вт)"
                       @change="fetchAppliances" />
                <label class="checkbox-filter">
                    <input v-model="onlySmartGridFilter" type="checkbox" @change="fetchAppliances" />
                    Тільки Smart Grid
                </label>
                <button type="button" class="btn-secondary" :disabled="isLoading" @click="fetchAppliances">
                    {{ isLoading ? 'Оновлення...' : 'Оновити (API)' }}
                </button>
            </div>
        </div>

        <div v-if="isLoading" class="loading-state">Завантаження списку приладів...</div>

        <div v-else class="appliances-grid">
            <ApplianceCard v-for="item in appliances"
                           :key="item.id"
                           :appliance="item"
                           :isAutoTriggered="isAutoTriggered"
                           @toggle-smart-grid="handleToggleSmartGrid"
                           @change-priority="handleChangePriority"
                           @delete="handleDeleteAppliance" />
        </div>
    </div>
</template>

<style scoped>
    .smart-grid-hub {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        margin-top: 1.5rem;
    }

    .hub-header h2 {
        margin: 0;
        font-size: 1.4rem;
        color: #0f172a;
    }

    .hub-header p {
        margin: 0.25rem 0 0 0;
        color: #64748b;
        font-size: 0.95rem;
    }

    .api-banner {
        padding: 0.65rem 1rem;
        background: #fef3c7;
        color: #92400e;
        border-radius: 8px;
        font-size: 0.85rem;
    }

    .top-widgets {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1rem;
    }

    .controls-bar {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
    }

    .add-form, .filter-group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
    }

        .add-form input, .add-form select, .filter-group input[type="number"] {
            padding: 0.45rem 0.65rem;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-size: 0.88rem;
        }

    .btn-primary {
        background: #0284c7;
        color: #ffffff;
        border: none;
        padding: 0.48rem 0.9rem;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
    }

        .btn-primary:hover {
            background: #0369a1;
        }

    .btn-secondary {
        background: #ffffff;
        border: 1px solid #cbd5e1;
        padding: 0.45rem 0.75rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        transition: background-color 0.15s, transform 0.1s;
    }

        .btn-secondary:hover {
            background: #f1f5f9;
            border-color: #94a3b8;
        }

        .btn-secondary:active {
            transform: scale(0.97);
        }

    .checkbox-filter {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.88rem;
    }

    .appliances-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
    }
</style>