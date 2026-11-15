import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const mockData = [
    { time: '00:00', power: 0.2 },
    { time: '04:00', power: 0.1 },
    { time: '08:00', power: 1.8 },
    { time: '12:00', power: 4.8 },
    { time: '16:00', power: 3.2 },
    { time: '20:00', power: 0.9 },
    { time: '24:00', power: 0.1 },
];

export const TelemetryChart: React.FC = () => {
    return (
        <div className="w-full h-48 bg-[#0e1724]/80 rounded-xl p-2 border border-cyan-500/20">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData}>
                    <defs>
                        <linearGradient id="powerGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e3248" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} unit=" kW" />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#131e2c',
                            borderColor: 'rgba(34, 211, 238, 0.3)',
                            borderRadius: '8px',
                            color: '#f1f5f9',
                        }}
                    />
                    <Area type="monotone" dataKey="power" stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#powerGrad)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};