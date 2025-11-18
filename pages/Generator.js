import React, { useState } from 'react';
import { AlertCircle, CheckCircle, Play, RefreshCw, Settings, Trash2 } from 'lucide-react';
import { runScheduler } from '../services/schedulerEngine.js';
import { clearSchedule, saveState } from '../services/dataService.js';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const Generator = ({ state, onUpdate }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [logs, setLogs] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    const [success, setSuccess] = useState(false);

    const addLog = (msg) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const handleClear = () => {
        if(window.confirm("Are you sure? This will wipe the current timetable.")) {
            const newState = clearSchedule(state);
            onUpdate(newState);
            setLogs([]);
            setConflicts([]);
            setSuccess(false);
            addLog("Schedule cleared.");
        }
    };

    const handleGenerate = () => {
        setIsGenerating(true);
        setLogs([]);
        setConflicts([]);
        setSuccess(false);
        addLog("Initializing SCTS Engine v1.0...");

        setTimeout(() => {
            addLog(`Loaded ${state.batches.length} batches, ${state.faculty.length} faculty, ${state.rooms.length} rooms.`);
            addLog("Running Greedy Heuristic Allocation...");
            const result = runScheduler(state);
            addLog(`Process Complete. Scheduled ${result.schedule.length} sessions.`);
            
            const newState = { ...state, schedule: result.schedule };
            saveState(newState);
            onUpdate(newState);
            setConflicts(result.conflicts);
            setSuccess(result.conflicts.length === 0);
            setIsGenerating(false);
        }, 1000);
    };

    return html`
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-slate-900">Automatic Schedule Generator</h2>
                <p className="text-slate-500 max-w-xl mx-auto">The engine uses a constraint-satisfaction algorithm to optimize resource allocation.</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-8 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-center gap-6">
                    <button onClick=${handleGenerate} disabled=${isGenerating} className=${`flex items-center gap-3 px-8 py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all ${isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}>
                        ${isGenerating ? html`<${RefreshCw} className="animate-spin" />` : html`<${Play} fill="currentColor" />`}
                        ${isGenerating ? 'Optimizing...' : 'Run Scheduler'}
                    </button>
                    <button onClick=${handleClear} disabled=${isGenerating} className="flex items-center gap-2 px-6 py-4 rounded-xl bg-white border-2 border-red-100 text-red-600 font-semibold hover:bg-red-50"><${Trash2} size=${20} />Clear Data</button>
                </div>
                <div className="grid md:grid-cols-2 h-[400px]">
                    <div className="bg-slate-900 p-6 overflow-y-auto font-mono text-sm text-green-400 border-r border-slate-800">
                        <div className="flex items-center gap-2 text-slate-400 mb-4 pb-2 border-b border-slate-800"><${Settings} size=${14} /><span>System Logs</span></div>
                        ${logs.map((log, i) => html`<div key=${i}>${log}</div>`)}
                    </div>
                    <div className="p-6 overflow-y-auto bg-white">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                            <h3 className="font-bold text-slate-700">Result Summary</h3>
                            ${success && html`<span className="text-green-700 font-bold">OPTIMAL</span>`}
                            ${conflicts.length > 0 && html`<span className="text-red-700 font-bold">ERRORS</span>`}
                        </div>
                        ${success && html`<div className="flex flex-col items-center justify-center h-64 text-center space-y-4"><${CheckCircle} size=${32} className="text-green-600" /><h4>Optimization Complete</h4></div>`}
                        ${conflicts.map(c => html`<div key=${c.id} className="flex gap-3 p-3 bg-red-50 border border-red-100 rounded-lg"><${AlertCircle} className="text-red-500" /><div><h4 className="font-bold text-red-800">${c.type}</h4><p className="text-xs text-red-600">${c.description}</p></div></div>`)}
                    </div>
                </div>
            </div>
        </div>
    `;
};