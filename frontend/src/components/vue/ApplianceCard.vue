<script setup>
    defineProps({
        appliance: { type: Object, required: true },
        isAutoTriggered: { type: Boolean, default: false },
    });

    const emit = defineEmits(['toggle-smart-grid', 'change-priority', 'delete']);

    const priorityLabels = {
        1: { label: 'P1: Критичний', class: 'badge-critical' },
        2: { label: 'P2: Стандарт', class: 'badge-standard' },
        3: { label: 'P3: Надлишковий', class: 'badge-surplus' },
    };
</script>

<template>
    <article class="appliance-card" :class="{ 'auto-active': isAutoTriggered }">
        <div class="card-header">
            <div class="title-group">
                <h4>{{ appliance.name }}</h4>
                <span class="power-tag">{{ appliance.powerWatts ?? appliance.powerConsumptionWatts ?? 0 }} Вт</span>
            </div>
            <span class="priority-badge" :class="priorityLabels[appliance.priority]?.class || 'badge-standard'">
                {{ priorityLabels[appliance.priority]?.label || `P${appliance.priority}` }}
            </span>
        </div>

        <div class="card-body">
            <div class="control-row">
                <label :for="`priority-${appliance.id}`" class="text-slate-300 text-xs">Пріоритет:</label>
                <select :id="`priority-${appliance.id}`"
                        :value="appliance.priority"
                        @change="emit('change-priority', appliance.id, Number($event.target.value))"
                        class="card-select">
                    <option :value="1" class="bg-[#0d1520] text-slate-100">1 — Критичний</option>
                    <option :value="2" class="bg-[#0d1520] text-slate-100">2 — Стандартний</option>
                    <option :value="3" class="bg-[#0d1520] text-slate-100">3 — Smart Grid</option>
                </select>
            </div>

            <div class="control-row">
                <span class="text-slate-300 text-xs">Авто-керування Smart Grid:</span>
                <label class="switch">
                    <input type="checkbox"
                           :checked="appliance.isSmartGridEnabled"
                           @change="emit('toggle-smart-grid', appliance.id, $event.target.checked)" />
                    <span class="slider"></span>
                </label>
            </div>

            <p v-if="isAutoTriggered && appliance.isSmartGridEnabled" class="auto-notice">
                Автоматично активовано (АКБ > порогу)
            </p>
        </div>

        <footer class="card-footer">
            <button type="button" class="btn-delete" @click="emit('delete', appliance.id)">
                Видалити
            </button>
        </footer>
    </article>
</template>

<style scoped>
    .appliance-card {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 1.1rem;
        margin-bottom: 0.75rem; /* Додає надійний відступ знизу на випадок одноколонкового виведення */
        border: 1px solid rgba(56, 189, 248, 0.2);
        border-radius: 12px;
        background: linear-gradient(165deg, rgba(16, 34, 53, 0.92), rgba(10, 22, 36, 0.94));
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }

        .appliance-card:hover {
            border-color: rgba(56, 189, 248, 0.4);
        }

        .appliance-card.auto-active {
            border-color: #34d399;
            box-shadow: 0 0 12px rgba(52, 211, 153, 0.2);
        }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5rem;
        margin-bottom: 0.6rem;
    }

    .title-group h4 {
        margin: 0 0 0.15rem 0;
        font-size: 0.95rem;
        font-weight: 600;
        color: #f1f5f9;
    }

    .power-tag {
        font-size: 0.78rem;
        font-weight: 600;
        color: #38bdf8;
        font-family: monospace;
    }

    .priority-badge {
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        font-size: 0.7rem;
        font-weight: 600;
        white-space: nowrap;
    }

    .badge-critical {
        background: rgba(244, 63, 94, 0.15);
        color: #fb7185;
        border: 1px solid rgba(244, 63, 94, 0.3);
    }

    .badge-standard {
        background: rgba(56, 189, 248, 0.1);
        color: #38bdf8;
        border: 1px solid rgba(56, 189, 248, 0.2);
    }

    .badge-surplus {
        background: rgba(52, 211, 153, 0.15);
        color: #34d399;
        border: 1px solid rgba(52, 211, 153, 0.3);
    }

    .card-body {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        font-size: 0.82rem;
    }

    .control-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
    }

    .card-select {
        padding: 0.3rem 0.5rem;
        background: #0a1826;
        border: 1px solid #2b4d6e;
        border-radius: 6px;
        font-size: 0.78rem;
        color: #e2e8f0;
        outline: none;
        cursor: pointer;
    }

        .card-select:focus {
            border-color: #2dd4bf;
        }

    .auto-notice {
        margin: 0.15rem 0 0 0;
        padding: 0.35rem 0.5rem;
        background: rgba(52, 211, 153, 0.1);
        color: #34d399;
        border: 1px solid rgba(52, 211, 153, 0.2);
        border-radius: 6px;
        font-size: 0.72rem;
        font-weight: 500;
    }

    .card-footer {
        margin-top: 0.75rem;
        padding-top: 0.6rem;
        border-top: 1px solid rgba(56, 189, 248, 0.15);
        display: flex;
        justify-content: flex-end;
    }

    .btn-delete {
        background: transparent;
        border: 1px solid rgba(244, 63, 94, 0.3);
        color: #fb7185;
        padding: 0.25rem 0.65rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.72rem;
        transition: background 0.2s;
    }

        .btn-delete:hover {
            background: rgba(244, 63, 94, 0.1);
        }

    .switch {
        position: relative;
        display: inline-block;
        width: 34px;
        height: 18px;
    }

        .switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

    .slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background-color: #0a1826;
        border: 1px solid #2b4d6e;
        border-radius: 18px;
        transition: 0.2s;
    }

        .slider::before {
            content: "";
            position: absolute;
            height: 12px;
            width: 12px;
            left: 2px;
            bottom: 2px;
            background-color: #94a3b8;
            border-radius: 50%;
            transition: 0.2s;
        }

    input:checked + .slider {
        background-color: rgba(45, 212, 191, 0.2);
        border-color: #2dd4bf;
    }

        input:checked + .slider::before {
            background-color: #2dd4bf;
            transform: translateX(16px);
        }
</style>