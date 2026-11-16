<script setup>
    import { computed } from 'vue';

    const props = defineProps({
        appliances: { type: Array, required: true },
        solarGenerationWatts: { type: Number, required: true },
    });

    const getWatts = (item) => item.powerWatts ?? item.powerConsumptionWatts ?? 0;

    // Перевіряємо чи прилад активний (увімкнений через Smart Grid або за замовчуванням)
    const isItemActive = (item) => item.isSmartGridEnabled ?? item.isActive ?? true;

    // Враховуємо лише активні прилади для загального навантаження
    const totalLoadWatts = computed(() =>
        props.appliances.reduce((sum, item) => sum + (isItemActive(item) ? getWatts(item) : 0), 0)
    );

    const loadByPriority = computed(() => {
        const groups = { p1: 0, p2: 0, p3: 0 };
        for (const item of props.appliances) {
            if (!isItemActive(item)) continue; // Вимкнені прилади не йдуть у баланс навантаження

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
                Навантаження: <strong class="text-[#38bdf8]">{{ (totalLoadWatts / 1000).toFixed(2) }} кВт</strong> /
                Генерація СЕС: <strong class="text-[#34d399]">{{ (solarGenerationWatts / 1000).toFixed(2) }} кВт</strong>
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
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .diagram-header {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.1rem;
    }

        .diagram-header h3 {
            margin: 0;
            font-size: 0.95rem;
            font-weight: 600;
            color: #f8fafc;
        }

    .totals {
        font-size: 0.78rem;
        color: #94a3b8;
    }

    .progress-bar {
        display: flex;
        height: 12px;
        width: 100%;
        background: #0a1826;
        border: 1px solid rgba(56, 189, 248, 0.2);
        border-radius: 6px;
        overflow: hidden;
        margin: 0.2rem 0;
    }

    .bar-segment {
        height: 100%;
        transition: width 0.3s ease;
    }

        .bar-segment.p1 {
            background: #f43f5e;
        }

        .bar-segment.p2 {
            background: #38bdf8;
        }

        .bar-segment.p3 {
            background: #34d399;
        }

    .legend {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        font-size: 0.76rem;
        color: #cbd5e1;
    }

    .dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        margin-right: 4px;
    }

        .dot.p1 {
            background: #f43f5e;
        }

        .dot.p2 {
            background: #38bdf8;
        }

        .dot.p3 {
            background: #34d399;
        }
</style>