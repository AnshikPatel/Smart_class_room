import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, BookOpen, Monitor, AlertCircle, BrainCircuit } from 'lucide-react';
import { StatsCard } from '../components/StatsCard.js';
import { GoogleGenAI } from "@google/genai";
import htm from 'htm';

const html = htm.bind(React.createElement);

export const Dashboard = ({ state }) => {
    const [aiInsight, setAiInsight] = useState("");
    const [loadingAi, setLoadingAi] = useState(false);

    const totalClasses = state.schedule.length;
    const activeRooms = new Set(state.schedule.map(s => s.roomId)).size;
    const utilization = state.rooms.length > 0 ? Math.round((activeRooms / state.rooms.length) * 100) : 0;

    const subjectDistribution = state.schedule.reduce((acc, curr) => {
        const sub = state.subjects.find(s => s.id === curr.subjectId);
        if (sub) acc[sub.code] = (acc[sub.code] || 0) + 1;
        return acc;
    }, {});

    const barData = Object.keys(subjectDistribution).map(key => ({ name: key, sessions: subjectDistribution[key] }));

    const typeDistribution = state.schedule.reduce((acc, curr) => {
        const room = state.rooms.find(r => r.id === curr.roomId);
        if (room) acc[room.type] = (acc[room.type] || 0) + 1;
        return acc;
    }, {});

    const pieData = Object.keys(typeDistribution).map(key => ({ name: key, value: typeDistribution[key] }));
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    const generateInsight = async () => {
        if (!process.env.API_KEY) {
            setAiInsight("API Key not configured.");
            return;
        }
        setLoadingAi(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Analyze this academic schedule data. Total Classes: ${totalClasses}, Room Utilization: ${utilization}%, Total Faculty: ${state.faculty.length}. Provide 3 strategic insights.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setAiInsight(response.text || "No insights generated.");
        } catch (error) {
            setAiInsight("Failed to generate insights.");
            console.error(error);
        } finally {
            setLoadingAi(false);
        }
    };

    return html`
        <div className="space-y-6">
            <div className="flex justify-between items-end">
                <div><h2 className="text-2xl font-bold text-slate-900">Academic Overview</h2><p className="text-slate-500">Real-time metrics.</p></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <${StatsCard} title="Total Sessions" value=${totalClasses} icon=${BookOpen} color="blue" />
                <${StatsCard} title="Utilization" value=${`${utilization}%`} icon=${Monitor} color="green" />
                <${StatsCard} title="Faculty" value=${state.faculty.length} icon=${Users} color="purple" />
                <${StatsCard} title="Conflicts" value=${0} icon=${AlertCircle} color="orange" />
            </div>
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-indigo-800 font-bold"><${BrainCircuit} size=${24} /><h3>AI Assistant</h3></div>
                    <button onClick=${generateInsight} disabled=${loadingAi} className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">${loadingAi ? 'Thinking...' : 'Generate Insights'}</button>
                </div>
                <p className="text-indigo-900/80 text-sm leading-relaxed whitespace-pre-line">${aiInsight || "Click 'Generate Insights' to analyze using Gemini AI."}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Workload Distribution</h3>
                    <div className="h-80">
                        <${ResponsiveContainer} width="100%" height="100%">
                            <${BarChart} data=${barData}>
                                <${CartesianGrid} strokeDasharray="3 3" vertical=${false} />
                                <${XAxis} dataKey="name" />
                                <${YAxis} />
                                <${Tooltip} />
                                <${Bar} dataKey="sessions" fill="#3b82f6" radius=${[4, 4, 0, 0]} />
                            <//>
                        <//>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Resource Usage</h3>
                    <div className="h-80">
                        <${ResponsiveContainer} width="100%" height="100%">
                            <${PieChart}>
                                <${Pie} data=${pieData} cx="50%" cy="50%" innerRadius=${80} outerRadius=${110} paddingAngle=${5} dataKey="value">
                                    ${pieData.map((entry, index) => (html`<${Cell} key=${`cell-${index}`} fill=${COLORS[index % COLORS.length]} />`))}
                                <//>
                                <${Tooltip} />
                            <//>
                        <//>
                    </div>
                </div>
            </div>
        </div>
    `;
};