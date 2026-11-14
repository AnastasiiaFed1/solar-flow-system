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
                <label :for="`priority-${appliance.id}`">Пріоритет:</label>
                <select :id="`priority-${appliance.id}`"
                        :value="appliance.priority"
                        @change="emit('change-priority', appliance.id, Number($event.target.value))">
                    <option :value="1">1 — Критичний (завжди живити)</option>
                    <option :value="2">2 — Стандартний</option>
                    <option :value="3">3 — Надлишковий (Smart Grid)</option>
                </select>
            </div>

            <div class="control-row">
                <span>Авто-керування Smart Grid:</span>
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
        padding: 1rem;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        background: #ffffff;
        transition: border-color 0.2s, box-shadow 0.2s;
    }

        .appliance-card.auto-active {
            border-color: #10b981;
            box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
        }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.5rem;
        margin-bottom: 0.75rem;
    }

    .title-group h4 {
        margin: 0 0 0.25rem 0;
        font-size: 1.05rem;
        color: #0f172a;
    }

    .power-tag {
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
    }

    .priority-badge {
        padding: 0.2rem 0.5rem;
        border-radius: 6px;
        font-size: 0.75rem;
        font-weight: 600;
        white-space: nowrap;
    }

    .badge-critical {
        background: #fee2e2;
        color: #991b1b;
    }

    .badge-standard {
        background: #e0f2fe;
        color: #075985;
    }

    .badge-surplus {
        background: #dcfce7;
        color: #166534;
    }

    .card-body {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        font-size: 0.9rem;
    }

    .control-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
    }

        .control-row select {
            padding: 0.3rem 0.5rem;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            font-size: 0.85rem;
        }

    .auto-notice {
        margin: 0.25rem 0 0 0;
        padding: 0.35rem 0.5rem;
        background: #ecfdf5;
        color: #047857;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 500;
    }

    .card-footer {
        margin-top: 1rem;
        padding-top: 0.65rem;
        border-top: 1px solid #f1f5f9;
        display: flex;
        justify-content: flex-end;
    }

    .btn-delete {
        background: transparent;
        border: 1px solid #fca5a5;
        color: #dc2626;
        padding: 0.3rem 0.7rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.8rem;
    }

        .btn-delete:hover {
            background: #fef2f2;
        }

    .switch {
        position: relative;
        display: inline-block;
        width: 40px;
        height: 22px;
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
        background-color: #cbd5e1;
        border-radius: 22px;
        transition: 0.2s;
    }

        .slider::before {
            content: "";
            position: absolute;
            height: 16px;
            width: 16px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            border-radius: 50%;
            transition: 0.2s;
        }

    input:checked + .slider {
        background-color: #10b981;
    }

        input:checked + .slider::before {
            transform: translateX(18px);
        }
</style>