import React from 'react';
import { Calendar, Users, BookOpen, LayoutDashboard, Play, Menu } from 'lucide-react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const Layout = ({ children, currentRole, onRoleChange, activePage, onNavigate }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'FACULTY'] },
    { id: 'timetable', label: 'Timetable View', icon: Calendar, roles: ['ADMIN', 'FACULTY', 'STUDENT'] },
    { id: 'generator', label: 'Scheduler Engine', icon: Play, roles: ['ADMIN'] },
    { id: 'data', label: 'Data Management', icon: BookOpen, roles: ['ADMIN'] },
    { id: 'faculty', label: 'My Schedule', icon: Users, roles: ['FACULTY'] },
  ];

  return html`
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className=${`bg-slate-900 text-white transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col shadow-xl z-20`}>
        <div className="p-6 flex items-center justify-between">
          ${isSidebarOpen && html`
            <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">S</div>
              <span>SCTS</span>
            </div>
          `}
          <button onClick=${() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 hover:bg-slate-800 rounded"><${Menu} size=${20} /></button>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-2">
          ${menuItems.filter(item => item.roles.includes(currentRole)).map((item) => html`
            <button key=${item.id} onClick=${() => onNavigate(item.id)} className=${`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${activePage === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <${item.icon} size=${22} strokeWidth=${1.5} />
              ${isSidebarOpen && html`<span className="ml-3 font-medium">${item.label}</span>`}
            </button>
          `)}
        </nav>
        <div className="p-4 border-t border-slate-800">
            ${isSidebarOpen && html`<p className="text-xs text-slate-500 mb-2 uppercase font-semibold tracking-wider">Active Role</p>`}
            <select value=${currentRole} onChange=${(e) => onRoleChange(e.target.value)} className="w-full bg-slate-800 text-slate-200 text-sm rounded p-2 border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none">
                <option value="ADMIN">Administrator</option>
                <option value="FACULTY">Faculty</option>
                <option value="STUDENT">Student</option>
            </select>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-800 capitalize">${menuItems.find(i => i.id === activePage)?.label || 'SCTS'}</h1>
          <div className="flex items-center gap-4">
             <div className="text-right hidden sm:block"><p className="text-sm font-medium text-slate-900">Capstone User</p><p className="text-xs text-slate-500">${currentRole}</p></div>
             <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">CU</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8 scroll-smooth"><div className="max-w-7xl mx-auto">${children}</div></main>
      </div>
    </div>
  `;
};