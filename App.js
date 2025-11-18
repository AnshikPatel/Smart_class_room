

import React, { useEffect, useState } from 'react';
import { Layout } from './components/Layout.js';
import { Dashboard } from './pages/Dashboard.js';
import { Timetable } from './pages/Timetable.js';
import { Generator } from './pages/Generator.js';
import { DataManage } from './pages/DataManage.js';
import { loadState, saveState } from './services/dataService.js';
import htm from 'htm';

const html = htm.bind(React.createElement);

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [userRole, setUserRole] = useState('ADMIN');
  const [state, setState] = useState(null);

  useEffect(() => {
    const data = loadState();
    setState(data);
  }, []);

  const handleUpdateState = (newState) => {
    setState(newState);
    saveState(newState);
  };

  if (!state) return html`<div className="flex h-screen items-center justify-center text-slate-500">Loading System Resources...</div>`;

  const renderContent = () => {
    switch (activePage) {
      case 'dashboard':
        return html`<${Dashboard} state=${state} />`;
      case 'timetable':
        return html`<${Timetable} state=${state} userRole=${userRole} onUpdate=${handleUpdateState} />`;
      case 'faculty':
        return html`<${Timetable} state=${state} userRole=${userRole} onUpdate=${handleUpdateState} />`;
      case 'generator':
        if (userRole !== 'ADMIN') return html`<div className="text-red-500">Access Denied</div>`;
        return html`<${Generator} state=${state} onUpdate=${handleUpdateState} />`;
      case 'data':
        if (userRole !== 'ADMIN') return html`<div className="text-red-500">Access Denied</div>`;
        return html`<${DataManage} state=${state} onUpdate=${handleUpdateState} />`;
      default:
        return html`<${Dashboard} state=${state} />`;
    }
  };

  return html`
    <${Layout} 
      currentRole=${userRole} 
      onRoleChange=${setUserRole} 
      activePage=${activePage} 
      onNavigate=${setActivePage}
    >
      ${renderContent()}
    <//>
  `;
};

export default App;