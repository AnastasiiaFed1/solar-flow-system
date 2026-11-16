<script setup>
    defineProps({
        batteryThreshold: { type: Number, required: true },
        isAutomationActive: { type: Boolean, required: true },
        currentBatteryLevel: { type: Number, required: true },
    });

    const emit = defineEmits(['update:batteryThreshold', 'update:isAutomationActive']);
</script>

<template>
    <section class="automation-panel">
        <div class="panel-header">
            <div>
                <h3>Сценарії Smart Grid</h3>
                <p class="subtitle">Автоматичний розподіл надлишкової енергії</p>
            </div>
            <label class="toggle-label">
                <input type="checkbox"
                       :checked="isAutomationActive"
                       @change="emit('update:isAutomationActive', $event.target.checked)"/>
                <span>{{ isAutomationActive ? 'Сценарій активний' : 'Вимкнено' }}</span>
            </label>
        </div>

        <div class="rule-box">
            <div class="rule-info">
                <span>Поріг заряду АКБ для ввімкнення навантаження (Бойлер / EV):</span>
                <strong>{{ batteryThreshold }}%</strong>
            </div>

            <input type="range"
                   min="50"
                   max="95"
                   step="5"
                   :value="batteryThreshold"
                   :disabled="!isAutomationActive"
                   @input="emit('update:batteryThreshold', Number($event.target.value))"/>

            <div class="status-indicator" :class="{ triggered: isAutomationActive && currentBatteryLevel >= batteryThreshold }">
                Поточний заряд АКБ: <strong>{{ currentBatteryLevel }}%</strong> —
                <span v-if="!isAutomationActive">Автоматика на паузі</span>
                <span v-else-if="currentBatteryLevel >= batteryThreshold">Умову виконано: Smart-прилади увімкнено</span>
                <span v-else>Очікування накопичення заряду до {{ batteryThreshold }}%</span>
            </div>
        </div>
    </section>
</template>

<style scoped>
    .automation-panel {
        padding: 1.25rem;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #f8fafc;
    }

    .panel-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1rem;
    }

        .panel-header h3 {
            margin: 0;
            font-size: 1.1rem;
            color: #0f172a;
        }

    .subtitle {
        margin: 0.15rem 0 0 0;
        font-size: 0.85rem;
        color: #64748b;
    }

    .toggle-label {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-weight: 600;
        font-size: 0.9rem;
        cursor: pointer;
    }

    .rule-box {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
    }

    .rule-info {
        display: flex;
        justify-content: space-between;
        font-size: 0.9rem;
    }

    input[type="range"] {
        width: 100%;
        accent-color: #0284c7;
    }

    .status-indicator {
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        background: #e2e8f0;
        color: #334155;
        font-size: 0.85rem;
    }

        .status-indicator.triggered {
            background: #dcfce7;
            color: #166534;
        }
</style>