<script setup>
    import { computed } from 'vue';

    const props = defineProps({
        appliances: { type: Array, required: true },
        solarGenerationWatts: { type: Number, required: true },
    });

    const getWatts = (item) => item.powerWatts ?? item.powerConsumptionWatts ?? 0;

    const totalLoadWatts = computed(() =>
        props.appliances.reduce((sum, item) => sum + getWatts(item), 0)
    );

    const loadByPriority = computed(() => {
        const groups = { p1: 0, p2: 0, p3: 0 };
        for (const item of props.appliances) {
            const watts = getWatts(item);
            if (item.priority === 1) groups.p1 += watts;
            else if (item.priority === 2) groups.p2 += watts;
            else groups.p3 += watts;
        }
        return groups;
    });

    const getPercent = (watts) => {
        if (totalLoadWatts.value === 0) return 0;
        return Math.round((watts / totalLoadWatts.value) * 100);
    };
</script>

<template>
    <section class="load-diagram">
        <div class="diagram-header">
            <h3>Баланс навантаження по пріоритетах</h3>
            <span class="totals">
                Навантаження: <strong>{{ (totalLoadWatts / 1000).toFixed(2) }} кВт</strong> /
                Генерація СЕС: <strong>{{ (solarGenerationWatts / 1000).toFixed(2) }} кВт</strong>
            </span>
        </div>

        <div class="progress-bar" role="img" aria-label="Розподіл потужності за пріоритетами">
            <div class="bar-segment p1" :style="{ width: `${getPercent(loadByPriority.p1)}%` }" title="P1: Критичні"></div>
            <div class="bar-segment p2" :style="{ width: `${getPercent(loadByPriority.p2)}%` }" title="P2: Стандартні"></div>
            <div class="bar-segment p3" :style="{ width: `${getPercent(loadByPriority.p3)}%` }" title="P3: Надлишкові"></div>
        </div>

        <div class="legend">
            <span><i class="dot p1"></i> P1 Критичні: {{ loadByPriority.p1 }} Вт ({{ getPercent(loadByPriority.p1) }}%)</span>
            <span><i class="dot p2"></i> P2 Стандартні: {{ loadByPriority.p2 }} Вт ({{ getPercent(loadByPriority.p2) }}%)</span>
            <span><i class="dot p3"></i> P3 Smart Grid: {{ loadByPriority.p3 }} Вт ({{ getPercent(loadByPriority.p3) }}%)</span>
        </div>
    </section>
</template>

<style scoped>
    .load-diagram {
        padding: 1.25rem;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        background: #ffffff;
    }

    .diagram-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.85rem;
    }

        .diagram-header h3 {
            margin: 0;
            font-size: 1.05rem;
            color: #0f172a;
        }

    .totals {
        font-size: 0.88rem;
        color: #475569;
    }

    .progress-bar {
        display: flex;
        height: 16px;
        width: 100%;
        background: #f1f5f9;
        border-radius: 8px;
        overflow: hidden;
        margin-bottom: 0.75rem;
    }

    .bar-segment {
        height: 100%;
        transition: width 0.3s ease;
    }

        .bar-segment.p1 {
            background: #ef4444;
        }

        .bar-segment.p2 {
            background: #0ea5e9;
        }

        .bar-segment.p3 {
            background: #10b981;
        }

    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        font-size: 0.82rem;
        color: #334155;
    }

    .dot {
        display: inline-block;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        margin-right: 4px;
    }

        .dot.p1 {
            background: #ef4444;
        }

        .dot.p2 {
            background: #0ea5e9;
        }

        .dot.p3 {
            background: #10b981;
        }
</style>