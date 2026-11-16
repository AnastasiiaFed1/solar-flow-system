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
                       @change="emit('update:isAutomationActive', $event.target.checked)" />
                <span>{{ isAutomationActive ? 'Сценарій активний' : 'Вимкнено' }}</span>
            </label>
        </div>

        <div class="rule-box">
            <div class="rule-info">
                <span>Поріг заряду АКБ для ввімкнення навантаження (Бойлер / EV):</span>
                <strong class="text-[#2dd4bf]">{{ batteryThreshold }}%</strong>
            </div>

            <input type="range"
                   min="50"
                   max="95"
                   step="5"
                   :value="batteryThreshold"
                   :disabled="!isAutomationActive"
                   @input="emit('update:batteryThreshold', Number($event.target.value))" />

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
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .panel-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.25rem;
    }

        .panel-header h3 {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 600;
            color: #f8fafc;
        }

    .subtitle {
        margin: 0.15rem 0 0 0;
        font-size: 0.78rem;
        color: #94a3b8;
    }

    .toggle-label {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-weight: 600;
        font-size: 0.8rem;
        color: #cbd5e1;
        cursor: pointer;
    }

        .toggle-label input[type="checkbox"] {
            accent-color: #2dd4bf;
        }

    .rule-box {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }

    .rule-info {
        display: flex;
        justify-content: space-between;
        font-size: 0.82rem;
        color: #cbd5e1;
    }

    input[type="range"] {
        width: 100%;
        accent-color: #2dd4bf;
        cursor: pointer;
    }

    .status-indicator {
        padding: 0.45rem 0.7rem;
        border-radius: 8px;
        background: rgba(10, 24, 38, 0.8);
        border: 1px solid rgba(56, 189, 248, 0.2);
        color: #94a3b8;
        font-size: 0.78rem;
    }

        .status-indicator.triggered {
            background: rgba(45, 212, 191, 0.1);
            border-color: rgba(45, 212, 191, 0.3);
            color: #34d399;
        }
</style>