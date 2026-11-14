import React, { useMemo } from 'react';
import ReactFlow, { Background, Controls, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import { PowerFlowNode } from './PowerFlowNode';
import { PowerFlowEdge } from './PowerFlowEdge';

interface PowerFlowDiagramProps {
    solarKW: number;
    inverterKW: number;
    homeKW: number;
    gridKW: number;
    batteryKW: number;
    onNodeClick?: (nodeId: string) => void;
}

const nodeTypes = { powerNode: PowerFlowNode };
const edgeTypes = { powerEdge: PowerFlowEdge };

export const PowerFlowDiagram: React.FC<PowerFlowDiagramProps> = ({
    solarKW = 4.8,
    inverterKW = 3.9,
    homeKW = 2.7,
    gridKW = 1.2,
    batteryKW = 1.2,
    onNodeClick,
}) => {
    const nodes: Node[] = useMemo(
        () => [
            {
                id: 'solar',
                type: 'powerNode',
                position: { x: 220, y: 20 },
                data: { title: 'Solar Panels', subtitle: '(DC)', value: `${solarKW} kW`, type: 'solar' },
            },
            {
                id: 'inverter',
                type: 'powerNode',
                position: { x: 220, y: 150 },
                data: { title: 'Inverter', subtitle: '(AC Output)', value: `${inverterKW} kW`, type: 'inverter' },
            },
            {
                id: 'grid',
                type: 'powerNode',
                position: { x: 20, y: 150 },
                data: { title: 'Grid', subtitle: '(Import)', value: `${gridKW} kW`, type: 'grid' },
            },
            {
                id: 'home',
                type: 'powerNode',
                position: { x: 420, y: 150 },
                data: { title: 'Home', subtitle: '(Consumption)', value: `${homeKW} kW`, type: 'home' },
            },
            {
                id: 'battery',
                type: 'powerNode',
                position: { x: 220, y: 280 },
                data: { title: 'Battery', subtitle: '(Charging)', value: `${batteryKW} kW`, type: 'battery' },
            },
        ],
        [solarKW, inverterKW, homeKW, gridKW, batteryKW]
    );

    const edges: Edge[] = useMemo(
        () => [
            {
                id: 'e-solar-inverter',
                source: 'solar',
                target: 'inverter',
                type: 'powerEdge',
                data: { powerKW: solarKW, color: '#fbbf24' },
            },
            {
                id: 'e-inverter-home',
                source: 'inverter',
                target: 'home',
                type: 'powerEdge',
                data: { powerKW: homeKW, color: '#22d3ee' },
            },
            {
                id: 'e-inverter-grid',
                source: 'inverter',
                target: 'grid',
                type: 'powerEdge',
                data: { powerKW: gridKW, color: '#fb7185' },
            },
            {
                id: 'e-inverter-battery',
                source: 'inverter',
                target: 'battery',
                type: 'powerEdge',
                data: { powerKW: batteryKW, color: '#2dd4bf' },
            },
        ],
        [solarKW, homeKW, gridKW, batteryKW]
    );

    return (
        <div className="w-full h-[380px] bg-[#131e2c]/95 rounded-2xl border border-cyan-500/25 p-2 relative overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
            <div className="absolute top-4 left-4 z-10">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
                    Power Flow (Live Energy Distribution)
                </h3>
            </div>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onNodeClick={(_, node) => onNodeClick && onNodeClick(node.id)}
                fitView
                proOptions={{ hideAttribution: true }}
            >
                <Background color="#1e3248" gap={20} size={1} />
                <Controls className="!bg-[#1a293b] !border-cyan-500/30 !text-cyan-300" />
            </ReactFlow>
        </div>
    );
};