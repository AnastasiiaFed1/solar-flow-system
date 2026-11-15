import React from 'react';
import { getSmoothStepPath, EdgeProps } from 'reactflow';

export interface PowerFlowEdgeData {
    powerKW: number;
    status?: 'active' | 'idle' | 'warning';
    color?: string;
    isReversed?: boolean;
}

export const PowerFlowEdge: React.FC<EdgeProps<PowerFlowEdgeData>> = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    data,
    markerEnd,
}) => {
    const [edgePath] = getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 16,
    });

    const power = data?.powerKW ?? 0;
    const isActive = power > 0.05;
    const color = data?.color || (isActive ? '#22d3ee' : '#334155');
    const duration = isActive ? Math.max(0.6, 3 - Math.min(power, 5) * 0.4) : 0;

    return (
        <>
            <path
                id={id}
                className="react-flow__edge-path"
                d={edgePath}
                strokeWidth={3}
                stroke="#1e3248"
                markerEnd={markerEnd}
            />
            {isActive && (
                <path
                    d={edgePath}
                    fill="none"
                    stroke={color}
                    strokeWidth={3.5}
                    strokeDasharray="6, 6"
                    className="power-flow-animated-line"
                    style={{
                        animation: `dashdraw ${duration}s linear infinite ${data?.isReversed ? 'reverse' : 'normal'}`,
                        ...style,
                    }}
                />
            )}
            <style>{`
        @keyframes dashdraw {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
        </>
    );
};