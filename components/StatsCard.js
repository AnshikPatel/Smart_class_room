import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const StatsCard = ({ title, value, icon: Icon, trend, color = "blue" }) => {
    const colorClasses = {
        blue: "bg-blue-50 text-blue-600",
        green: "bg-green-50 text-green-600",
        purple: "bg-purple-50 text-purple-600",
        orange: "bg-orange-50 text-orange-600",
    };

    return html`
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wide">${title}</h3>
                <div className=${`p-2 rounded-lg ${colorClasses[color] || colorClasses.blue}`}>
                    <${Icon} size=${20} />
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">${value}</span>
                ${trend && html`<span className="text-xs font-medium text-green-600">${trend}</span>`}
            </div>
        </div>
    `;
};