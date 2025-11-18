
import React, { useState, useRef } from 'react';
import { Download, Users, BookOpen, MapPin, Layers, Search, Filter, Plus, Database, Upload, FileText } from 'lucide-react';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const DataManage = ({ state, onUpdate }) => {
    const [activeTab, setActiveTab] = useState('FACULTY');
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef(null);

    const tabs = [
        { id: 'FACULTY', label: 'Faculty Members', icon: Users },
        { id: 'SUBJECTS', label: 'Course Subjects', icon: BookOpen },
        { id: 'ROOMS', label: 'Classrooms & Labs', icon: MapPin },
        { id: 'BATCHES', label: 'Student Batches', icon: Layers },
    ];

    const getFilteredData = () => {
        const lowerTerm = searchTerm.toLowerCase();
        switch (activeTab) {
            case 'FACULTY':
                return state.faculty.filter(f => f.name.toLowerCase().includes(lowerTerm) || f.department.toLowerCase().includes(lowerTerm));
            case 'SUBJECTS':
                return state.subjects.filter(s => s.name.toLowerCase().includes(lowerTerm) || s.code.toLowerCase().includes(lowerTerm));
            case 'ROOMS':
                return state.rooms.filter(r => r.name.toLowerCase().includes(lowerTerm) || r.type.toLowerCase().includes(lowerTerm));
            case 'BATCHES':
                return state.batches.filter(b => b.name.toLowerCase().includes(lowerTerm));
            default: return [];
        }
    };

    const filteredData = getFilteredData();

    const handleExportView = () => {
        // Simple CSV export for the current view
        if (filteredData.length === 0) return;
        
        const keys = Object.keys(filteredData[0]).filter(k => k !== 'expertise' && k !== 'subjects'); // Exclude complex arrays for simple view export
        const header = keys.join(',');
        const rows = filteredData.map(obj => {
            return keys.map(key => {
                const val = obj[key];
                return `"${val}"`;
            }).join(',');
        }).join('\n');
        
        const csvContent = `data:text/csv;charset=utf-8,${header}\n${rows}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `SCTS_${activeTab}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportSchedule = () => {
        if (state.schedule.length === 0) {
            alert("No schedule data available to export.");
            return;
        }

        const header = "Day,Time,Subject Code,Subject Name,Faculty Name,Room Name,Batch Name,Type";
        const rows = state.schedule.map(entry => {
            const slot = state.slots.find(s => s.id === entry.slotId);
            const subject = state.subjects.find(s => s.id === entry.subjectId);
            const faculty = state.faculty.find(f => f.id === entry.facultyId);
            const room = state.rooms.find(r => r.id === entry.roomId);
            const batch = state.batches.find(b => b.id === entry.batchId);

            return [
                slot?.day || 'N/A',
                slot ? `${slot.startTime}-${slot.endTime}` : 'N/A',
                subject?.code || 'N/A',
                `"${subject?.name || 'N/A'}"`,
                `"${faculty?.name || 'N/A'}"`,
                `"${room?.name || 'N/A'}"`,
                `"${batch?.name || 'N/A'}"`,
                subject?.isLab ? 'LAB' : 'LECTURE'
            ].join(',');
        }).join('\n');

        const csvContent = `data:text/csv;charset=utf-8,${header}\n${rows}`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "SCTS_Master_Schedule.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportFacultyClick = () => {
        fileInputRef.current.click();
    };

    const handleFacultyFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const lines = text.split('\n');
            const newFaculty = [];
            
            // Expected CSV format: Name, Email (optional), Department (optional), MaxLoad (optional)
            // Simple parser skipping empty lines
            lines.forEach((line, index) => {
                const cleanLine = line.trim();
                if (!cleanLine) return;
                
                // Skip header if it looks like one
                if (index === 0 && cleanLine.toLowerCase().includes('name')) return;

                const parts = cleanLine.split(',');
                if (parts.length > 0) {
                    const name = parts[0].trim();
                    if(name) {
                        newFaculty.push({
                            id: `fac-imp-${Date.now()}-${index}`,
                            name: name,
                            email: parts[1]?.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@univ.edu`,
                            department: parts[2]?.trim() || 'General',
                            maxLoad: parseInt(parts[3]?.trim()) || 12,
                            expertise: [] // Importing expertise IDs via CSV is complex, initializing empty
                        });
                    }
                }
            });

            if (newFaculty.length > 0) {
                const newState = {
                    ...state,
                    faculty: [...state.faculty, ...newFaculty]
                };
                onUpdate(newState);
                alert(`Successfully imported ${newFaculty.length} faculty members.`);
            } else {
                alert("No valid faculty data found in file.");
            }
        };
        reader.readAsText(file);
        e.target.value = null; // Reset input
    };

    const renderFacultyRow = (item) => html`
        <tr key=${item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        ${item.name.charAt(0)}
                    </div>
                    <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">${item.name}</div>
                        <div className="text-sm text-slate-500">${item.email}</div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    ${item.department}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                ${item.maxLoad} Hours/Week
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                <div className="flex flex-wrap gap-1 max-w-xs">
                    ${item.expertise.length > 0 ? item.expertise.slice(0, 3).map(sid => {
                        const sub = state.subjects.find(s => s.id === sid);
                        return html`<span key=${sid} className="px-2 py-0.5 bg-slate-100 rounded text-xs border border-slate-200">${sub ? sub.code : sid}</span>`;
                    }) : html`<span className="text-xs text-slate-400 italic">None assigned</span>`}
                    ${item.expertise.length > 3 && html`<span className="px-2 py-0.5 bg-slate-100 rounded text-xs border border-slate-200">+${item.expertise.length - 3}</span>`}
                </div>
            </td>
        </tr>
    `;

    const renderSubjectRow = (item) => html`
        <tr key=${item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-bold text-slate-900">${item.code}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-slate-900">${item.name}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-slate-500 flex items-center gap-4">
                   <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-full"></span> ${item.lectureHours} Lec</span>
                   <span className="flex items-center gap-1"><span className="w-2 h-2 bg-purple-400 rounded-full"></span> ${item.labHours} Lab</span>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                ${item.isLab 
                    ? html`<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">Laboratory</span>`
                    : html`<span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-slate-100 text-slate-800">Theory</span>`
                }
            </td>
        </tr>
    `;

    const renderRoomRow = (item) => html`
        <tr key=${item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900">${item.name}</div>
                <div className="text-xs text-slate-500">ID: ${item.id}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className=${`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.type === 'LAB' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                    ${item.type}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                ${item.capacity} Seats
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                Active
            </td>
        </tr>
    `;

    const renderBatchRow = (item) => html`
        <tr key=${item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-slate-900">${item.name}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-slate-900">${item.program}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                ${item.size} Students
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                <span className="bg-slate-100 px-2 py-1 rounded border border-slate-200">${item.subjects.length} Subjects Enrolled</span>
            </td>
        </tr>
    `;

    return html`
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <${Database} className="text-blue-600" />
                        Data Management
                    </h2>
                    <p className="text-slate-500 mt-1">Manage university resources and curriculum data.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick=${handleExportSchedule} className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-all shadow-sm font-medium text-sm">
                        <${FileText} size=${16} />
                        Export Schedule
                    </button>

                    ${activeTab === 'FACULTY' && html`
                        <input 
                            type="file" 
                            accept=".csv" 
                            ref=${fileInputRef} 
                            className="hidden" 
                            onChange=${handleFacultyFileChange} 
                        />
                        <button onClick=${handleImportFacultyClick} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm font-medium text-sm">
                            <${Upload} size=${16} />
                            Import Faculty
                        </button>
                    `}

                    <button onClick=${handleExportView} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm font-medium text-sm">
                        <${Download} size=${16} />
                        Export View
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-blue-200 font-medium text-sm">
                        <${Plus} size=${16} />
                        Add New
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
                <div className="border-b border-slate-200 bg-slate-50/50 p-1 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex p-1 space-x-1 bg-slate-100 rounded-lg">
                        ${tabs.map(tab => html`
                            <button
                                key=${tab.id}
                                onClick=${() => { setActiveTab(tab.id); setSearchTerm(''); }}
                                className=${`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-white text-blue-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                            >
                                <${tab.icon} size=${16} />
                                ${tab.label}
                            </button>
                        `)}
                    </div>
                    <div className="relative w-full sm:w-72 mr-2">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <${Search} className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg leading-5 bg-white placeholder-slate-400 focus:outline-none focus:placeholder-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                            placeholder=${`Search ${activeTab.toLowerCase()}...`}
                            value=${searchTerm}
                            onChange=${(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            ${activeTab === 'FACULTY' && html`
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Faculty Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Department</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Max Load</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Expertise Areas</th>
                                </tr>
                            `}
                            ${activeTab === 'SUBJECTS' && html`
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Code</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Subject Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Credit Hours</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                </tr>
                            `}
                            ${activeTab === 'ROOMS' && html`
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Room Info</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Capacity</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                </tr>
                            `}
                            ${activeTab === 'BATCHES' && html`
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Batch Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Program</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Size</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Curriculum</th>
                                </tr>
                            `}
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            ${filteredData.length > 0 ? filteredData.map(item => {
                                switch(activeTab) {
                                    case 'FACULTY': return renderFacultyRow(item);
                                    case 'SUBJECTS': return renderSubjectRow(item);
                                    case 'ROOMS': return renderRoomRow(item);
                                    case 'BATCHES': return renderBatchRow(item);
                                    default: return null;
                                }
                            }) : html`
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <${Filter} size=${48} className="mb-4 opacity-20" />
                                            <h3 className="text-lg font-medium text-slate-900">No records found</h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                No ${activeTab.toLowerCase()} match your search criteria.
                                            </p>
                                            <button onClick=${() => setSearchTerm('')} className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium">
                                                Clear filters
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
                    <div className="text-sm text-slate-500">
                        Showing <span className="font-medium">${filteredData.length}</span> results
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 text-sm border border-slate-200 rounded bg-white text-slate-400 cursor-not-allowed">Previous</button>
                        <button className="px-3 py-1 text-sm border border-slate-200 rounded bg-white text-slate-400 cursor-not-allowed">Next</button>
                    </div>
                </div>
            </div>
        </div>
    `;
};
