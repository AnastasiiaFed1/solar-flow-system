<script setup lang="ts">
    import { computed } from 'vue';

    const props = defineProps<{
        panelCount: number;
        tiltAngle: number;
        azimuthAngle: number;
        azimuthLabel: string;
        peakPowerKwp: number;
        dailyGenerationKwh: number;
        batteryType: 'LiFePO4' | 'AGM/GEL';
        usableBatteryKwh: number;
        batteryDodPercent: number;
        inverterNominalKw: number;
        inverterEfficiencyPercent: number;
        dcAcRatio: number;
    }>();

    // Азимут у верхньому вільному просторі неба
    const azimuthIndicatorPos = computed(() => {
        const t = (props.azimuthAngle + 180) / 360; // 0..1
        const x = 300 + t * 305;
        const y = 52 - t * 36;
        return { x, y };
    });

    // Геометрія дуги кута нахилу (без рамки)
    const tiltArcEnd = computed(() => {
        const clamped = Math.min(Math.max(props.tiltAngle, 5), 85);
        const rad = (clamped * Math.PI) / 180;
        const len = 52;
        return {
            x: 65 + Math.cos(rad) * len,
            y: 135 - Math.sin(rad) * len,
        };
    });
</script>

<template>
    <div class="house-stage">
        <div class="house-aspect-box">
            <img src="/images/solar-house-3d.jpg"
                 alt="3D-модель СЕС будинку"
                 class="house-base-img" />

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

                <!-- 1. АЗИМУТ (БЕЗ РАМКИ, ТЕКСТ ЗСУНУТИЙ ПРАВІШЕ ВІД СОНЦЯ) -->
                <g>
                    <line x1="300"
                          y1="52"
                          x2="605"
                          y2="16"
                          stroke="#34d399"
                          stroke-width="2.2"
                          stroke-dasharray="6 5"
                          opacity="0.9" />
                    <line x1="300" y1="42" x2="300" y2="68" stroke="#34d399" stroke-width="1.4" opacity="0.65" />
                    <line x1="605" y1="6" x2="605" y2="32" stroke="#34d399" stroke-width="1.4" opacity="0.65" />

                    <circle :cx="azimuthIndicatorPos.x"
                            :cy="azimuthIndicatorPos.y"
                            r="7.5"
                            fill="#fde047"
                            stroke="#f59e0b"
                            stroke-width="2"
                            filter="url(#pulseGlow)" />

                    <!-- Текст зміщено правіше вздовж лінії азимута без прямокутної плашки -->
                    <text x="630"
                          y="24"
                          text-anchor="start"
                          fill="#f1f5f9"
                          font-size="16.5"
                          font-weight="700"
                          letter-spacing="0.3px"
                          >
                        Азимут: {{ azimuthLabel }}
                    </text>
                </g>

                <!-- 2. КУТ НАХИЛУ (БЕЗ РАМКИ ТА ФОНУ) -->
                <g transform="translate(25, 25)">
                    <line x1="40" y1="135" x2="92" y2="135" stroke="#7dd3fc" stroke-width="2" />
                    <line x1="40"
                          y1="135"
                          :x2="40 + Math.cos((tiltAngle * Math.PI) / 180) * 45"
                          :y2="135 - Math.sin((tiltAngle * Math.PI) / 180) * 45"
                          stroke="#38bdf8"
                          stroke-width="2.6" />
                    <text x="84.5"
                          y="80"
                          text-anchor="middle"
                          fill="#f1f5f9"
                          font-size="18"
                          font-weight="700"
                          letter-spacing="0.5px"
                          >
                        Кут: {{ tiltAngle }}°
                    </text>
                </g>

                <!-- 3. ТОЧНІ АНІМОВАНІ ПОТОКИ СТРУМУ -->
                <g fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#pulseGlow)">
                    <path d="M 412 272 L 348 298 L 348 340"
                          stroke="#6ee7b7"
                          stroke-width="3"
                          class="current-stream" />
                    <path d="M 348 394 L 348 446 L 246 462 L 222 442"
                          stroke="#2dd4bf"
                          stroke-width="3"
                          class="current-stream" />
                    <path d="M 366 388 L 418 474 L 580 486 L 685 435 L 748 392"
                          stroke="#34d399"
                          stroke-width="3"
                          class="current-stream" />
                </g>

                <!-- 4. БЛОК ГЕНЕРАЦІЇ СЕС ПРАВОРУЧ -->
                <g transform="translate(862, 195)">
                    <circle cx="0"
                            cy="-12"
                            r="40"
                            fill="rgba(4, 12, 20, 0.86)"
                            stroke="#34d399"
                            stroke-width="3.2"
                            filter="url(#pulseGlow)" />
                    <text x="0" y="-7" text-anchor="middle" fill="#6ee7b7" font-size="16" font-weight="700">
                        {{ peakPowerKwp.toFixed(1) }} kWp
                    </text>
                    <text x="0" y="46" text-anchor="middle" fill="#f1f5f9" font-size="15.5" font-weight="700">
                        Генерація СЕС
                    </text>
                    <text x="0" y="67" text-anchor="middle" fill="#38bdf8" font-size="14" font-weight="600">
                        ~{{ dailyGenerationKwh }} кВт·год/день
                    </text>
                </g>

                <!-- 5. ПІДПИС АКБ ЗНИЗУ ЗЛІВА -->
                <g transform="translate(42, 502)">
                    <text x="0" y="0" fill="#f1f5f9" font-size="15.5" font-weight="700">
                        Акумуляторна батарея (АКБ)
                    </text>
                    <text x="0" y="20" fill="#2dd4bf" font-size="13.5" font-weight="600">
                        {{ batteryType }} · Корисна: {{ usableBatteryKwh }} kWh ({{ batteryDodPercent }}%)
                    </text>
                </g>

                <!-- 6. ПІДПИС ІНВЕРТОРА ЗНИЗУ ПО ЦЕНТРУ -->
                <g transform="translate(365, 506)">
                    <text x="0" y="0" fill="#f1f5f9" font-size="15.5" font-weight="700">
                        Інвертор СЕС ({{ inverterNominalKw.toFixed(1) }} kW)
                    </text>
                    <text x="0" y="19" fill="#38bdf8" font-size="13.5" font-weight="600">
                        ККД: {{ inverterEfficiencyPercent }}% · DC/AC: {{ dcAcRatio }} · {{ panelCount }} панелей
                    </text>
                </g>
            </svg>
        </div>
    </div>
</template>

<style scoped>
    .house-stage {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 495px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 14px;
        overflow: hidden;
        background: radial-gradient(circle at 50% 52%, #091d30 0%, #06121e 68%, #040c15 100%);
        border: 1px solid rgba(56, 189, 248, 0.28);
        box-shadow: 0 10px 30px rgba(2, 8, 18, 0.55);
    }

    .house-aspect-box {
        position: relative;
        width: 100%;
        aspect-ratio: 16 / 9;
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
        stroke-dasharray: 12 16;
        animation: electricFlow 1.25s linear infinite;
    }

    @keyframes electricFlow {
        from {
            stroke-dashoffset: 56;
        }

        to {
            stroke-dashoffset: 0;
        }
    }
</style>