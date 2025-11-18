

import React, { useState } from 'react';
import { DAYS } from '../constants.js';
import { X, Users, MapPin, GraduationCap, Clock, Plus, AlertCircle } from 'lucide-react';
import { addScheduleEntry } from '../services/dataService.js';
import htm from 'htm';

const html = htm.bind(React.createElement);

export const Timetable = ({ state, userRole, onUpdate }) => {
    const [viewMode, setViewMode] = useState('BATCH');
    const [selectedEntityId, setSelectedEntityId] = useState(state.batches[0]?.id || '');
    const [modalEntry, setModalEntry] = useState(null);
    const [bookingSlot, setBookingSlot] = useState(null);
    const [bookingForm, setBookingForm] = useState({
        subjectId: '',
        batchId: '',
        facultyId: '',
        roomId: ''
    });
    const [bookingError, setBookingError] = useState(null);

    const getCellData = (slotId) => {
        return state.schedule.find(entry => {
            if (entry.slotId !== slotId) return false;
            if (viewMode === 'BATCH') return entry.batchId === selectedEntityId;
            if (viewMode === 'FACULTY') return entry.facultyId === selectedEntityId;
            if (viewMode === 'ROOM') return entry.roomId === selectedEntityId;
            return false;
        });
    };

    const handleSlotClick = (slotId) => {
        if (userRole === 'STUDENT') return;
        const slot = state.slots.find(s => s.id === slotId);
        
        // Pre-fill based on current view and selected entity
        const initialForm = {
            subjectId: '',
            batchId: viewMode === 'BATCH' ? selectedEntityId : '',
            facultyId: viewMode === 'FACULTY' ? selectedEntityId : '',
            roomId: viewMode === 'ROOM' ? selectedEntityId : '',
        };

        setBookingSlot(slot);
        setBookingForm(initialForm);
        setBookingError(null);
    };

    const handleBookingSubmit = () => {
        if(!bookingForm.subjectId || !bookingForm.batchId || !bookingForm.facultyId || !bookingForm.roomId) {
            setBookingError("Please fill all fields");
            return;
        }

        const result = addScheduleEntry(state, {
            slotId: bookingSlot.id,
            subjectId: bookingForm.subjectId,
            batchId: bookingForm.batchId,
            facultyId: bookingForm.facultyId,
            roomId: bookingForm.roomId
        });

        if(result.success) {
            onUpdate(result.newState);
            setBookingSlot(null); // Close modal
        } else {
            setBookingError(result.message);
        }
    };

    const renderCell = (entry, slotId) => {
        if (!entry) {
            if (userRole === 'STUDENT') return html`<div className="h-full w-full"></div>`;
            return html`
                <div onClick=${() => handleSlotClick(slotId)} className="h-full w-full flex items-center justify-center opacity-50 hover:opacity-100 bg-slate-50 hover:bg-blue-50 transition-all cursor-pointer rounded-md border-2 border-dashed border-slate-200 hover:border-blue-300 group min-h-[80px]">
                     <div className="hidden group-hover:flex flex-col items-center text-blue-500">
                        <${Plus} size=${20} />
                        <span className="text-[10px] font-medium">Add Class</span>
                     </div>
                </div>
            `;
        }
        const subject = state.subjects.find(s => s.id === entry.subjectId);
        const room = state.rooms.find(r => r.id === entry.roomId);
        const faculty = state.faculty.find(f => f.id === entry.facultyId);
        const batch = state.batches.find(b => b.id === entry.batchId);

        return html`
            <div onClick=${() => setModalEntry(entry)} className=${`h-full w-full p-2 rounded-md border-l-4 text-xs flex flex-col gap-1 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer min-h-[80px] ${subject?.isLab ? 'bg-purple-50 border-purple-500 text-purple-900' : 'bg-blue-50 border-blue-500 text-blue-900'}`}>
                <span className="font-bold truncate">${subject?.code} - ${subject?.name}</span>
                ${viewMode !== 'FACULTY' && html`<div className="flex items-center gap-1 text-slate-500"><span className="font-medium">${faculty?.name}</span></div>`}
                ${viewMode !== 'ROOM' && html`<div className="flex items-center gap-1 text-slate-500"><span className="bg-white px-1 rounded border border-slate-200">${room?.name}</span></div>`}
                ${viewMode !== 'BATCH' && html`<div className="flex items-center gap-1 text-slate-500"><span className="italic">${batch?.name}</span></div>`}
            </div>
        `;
    };

    const uniqueTimes = Array.from(new Set(state.slots.map(s => s.startTime))).sort();

    return html`
        <div className="flex flex-col h-full relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-slate-900">Master Schedule</h2>
                <div className="flex flex-wrap gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex gap-1">
                        ${['BATCH', 'FACULTY', 'ROOM'].map(mode => (
                            html`<button key=${mode} onClick=${() => {
                                setViewMode(mode);
                                if (mode === 'BATCH') setSelectedEntityId(state.batches[0]?.id || '');
                                if (mode === 'FACULTY') setSelectedEntityId(state.faculty[0]?.id || '');
                                if (mode === 'ROOM') setSelectedEntityId(state.rooms[0]?.id || '');
                            }} className=${`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${viewMode === mode ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>${mode}</button>`
                        ))}
                    </div>
                    <select value=${selectedEntityId} onChange=${(e) => setSelectedEntityId(e.target.value)} className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-md focus:ring-blue-500 outline-none min-w-[200px]">
                        ${viewMode === 'BATCH' && state.batches.map(b => html`<option key=${b.id} value=${b.id}>${b.name}</option>`)}
                        ${viewMode === 'FACULTY' && state.faculty.map(f => html`<option key=${f.id} value=${f.id}>${f.name}</option>`)}
                        ${viewMode === 'ROOM' && state.rooms.map(r => html`<option key=${r.id} value=${r.id}>${r.name}</option>`)}
                    </select>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
                <div className="grid grid-cols-6 border-b border-slate-200 bg-slate-50">
                    <div className="p-4 font-semibold text-slate-400 text-center border-r border-slate-200">Time / Day</div>
                    ${DAYS.map(day => (html`<div key=${day} className="p-4 font-bold text-slate-700 text-center border-r border-slate-200 last:border-r-0">${day}</div>`))}
                </div>
                <div className="overflow-y-auto flex-1">
                    ${uniqueTimes.map((startTime, timeIndex) => (
                        html`<div key=${timeIndex} className="grid grid-cols-6 border-b border-slate-100 last:border-0">
                            <div className="p-4 text-sm font-medium text-slate-500 text-center border-r border-slate-200 bg-slate-50 flex flex-col justify-center"><span>${startTime}</span></div>
                            ${DAYS.map(day => {
                                const slot = state.slots.find(s => s.day === day && s.startTime === startTime);
                                const entry = slot ? getCellData(slot.id) : undefined;
                                return (html`<div key=${`${day}-${startTime}`} className="p-2 border-r border-slate-100 last:border-r-0 relative group hover:bg-slate-50/50 transition-colors">${slot ? renderCell(entry, slot.id) : null}</div>`);
                            })}
                        </div>`
                    ))}
                </div>
            </div>

            ${bookingSlot && html`
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick=${e => e.stopPropagation()}>
                        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-white font-bold text-lg">Schedule Extra Class</h3>
                            <button onClick=${() => setBookingSlot(null)} className="text-blue-100 hover:text-white"><${X} size=${20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm text-blue-800 flex items-center gap-2">
                                <${Clock} size=${16} />
                                <span className="font-semibold">${bookingSlot.day}, ${bookingSlot.startTime} - ${bookingSlot.endTime}</span>
                            </div>
                            
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Subject</label>
                                    <select className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white" value=${bookingForm.subjectId} onChange=${e => setBookingForm({...bookingForm, subjectId: e.target.value})}>
                                        <option value="">Select Subject...</option>
                                        ${state.subjects.map(s => html`<option key=${s.id} value=${s.id}>${s.code} - ${s.name}</option>`)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Faculty</label>
                                    <select 
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-slate-100" 
                                        value=${bookingForm.facultyId} 
                                        onChange=${e => setBookingForm({...bookingForm, facultyId: e.target.value})}
                                        disabled=${viewMode === 'FACULTY' && selectedEntityId}
                                    >
                                        <option value="">Select Faculty...</option>
                                        ${state.faculty.map(f => {
                                            const isBusy = state.schedule.some(s => s.slotId === bookingSlot.id && s.facultyId === f.id);
                                            return html`<option key=${f.id} value=${f.id} disabled=${isBusy}>${f.name} ${isBusy ? '(Busy)' : ''}</option>`;
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Batch</label>
                                    <select 
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-slate-100" 
                                        value=${bookingForm.batchId} 
                                        onChange=${e => setBookingForm({...bookingForm, batchId: e.target.value})}
                                        disabled=${viewMode === 'BATCH' && selectedEntityId}
                                    >
                                        <option value="">Select Batch...</option>
                                        ${state.batches.map(b => {
                                            const isBusy = state.schedule.some(s => s.slotId === bookingSlot.id && s.batchId === b.id);
                                            return html`<option key=${b.id} value=${b.id} disabled=${isBusy}>${b.name} ${isBusy ? '(Busy)' : ''}</option>`;
                                        })}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Room</label>
                                    <select 
                                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none bg-white disabled:bg-slate-100" 
                                        value=${bookingForm.roomId} 
                                        onChange=${e => setBookingForm({...bookingForm, roomId: e.target.value})}
                                        disabled=${viewMode === 'ROOM' && selectedEntityId}
                                    >
                                        <option value="">Select Room...</option>
                                        ${state.rooms.map(r => {
                                            const isOccupied = state.schedule.some(s => s.slotId === bookingSlot.id && s.roomId === r.id);
                                            return html`<option key=${r.id} value=${r.id} disabled=${isOccupied}>${r.name} (${r.type}) ${isOccupied ? '- Occupied' : ''}</option>`;
                                        })}
                                    </select>
                                </div>
                            </div>

                            ${bookingError && html`
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded border border-red-200 flex items-center gap-2">
                                    <${AlertCircle} size=${16} /> ${bookingError}
                                </div>
                            `}

                            <button onClick=${handleBookingSubmit} className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-200">
                                Confirm Booking
                            </button>
                        </div>
                    </div>
                </div>
            `}

            ${modalEntry && (() => {
                const subject = state.subjects.find(s => s.id === modalEntry.subjectId);
                const faculty = state.faculty.find(f => f.id === modalEntry.facultyId);
                const room = state.rooms.find(r => r.id === modalEntry.roomId);
                const batch = state.batches.find(b => b.id === modalEntry.batchId);
                const slot = state.slots.find(s => s.id === modalEntry.slotId);
                
                const expertiseNames = faculty ? faculty.expertise.map(subId => {
                    const s = state.subjects.find(sub => sub.id === subId);
                    return s ? s.code : subId;
                }).join(', ') : 'N/A';

                return html`
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick=${() => setModalEntry(null)}>
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick=${e => e.stopPropagation()}>
                            <div className="bg-slate-900 px-6 py-5 flex justify-between items-start">
                                <div>
                                    <h3 className="text-white font-bold text-xl">${subject?.name}</h3>
                                    <p className="text-blue-300 text-sm font-mono mt-1">${subject?.code} • ${subject?.isLab ? 'Laboratory' : 'Lecture'}</p>
                                </div>
                                <button onClick=${() => setModalEntry(null)} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-1.5 rounded-lg transition-colors">
                                    <${X} size=${20} />
                                </button>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                <div className="flex items-center gap-3 text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <${Clock} className="text-blue-600" size=${20} />
                                    <div>
                                        <p className="text-xs text-slate-500 font-semibold uppercase">Time Slot</p>
                                        <p className="font-medium">${slot?.day}, ${slot?.startTime} - ${slot?.endTime}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-wider">
                                            <${MapPin} size=${14} /> Room Details
                                        </div>
                                        <div className="bg-white border border-slate-200 p-3 rounded-lg">
                                            <p className="font-bold text-slate-800">${room?.name}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-slate-500">Capacity</span>
                                                <span className=${`text-sm font-mono font-bold ${room?.capacity < batch?.size ? 'text-red-600' : 'text-green-600'}`}>
                                                    ${room?.capacity} seats
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-wider">
                                            <${Users} size=${14} /> Batch Details
                                        </div>
                                        <div className="bg-white border border-slate-200 p-3 rounded-lg">
                                            <p className="font-bold text-slate-800 truncate" title=${batch?.name}>${batch?.name}</p>
                                            <div className="flex justify-between items-center mt-2">
                                                <span className="text-xs text-slate-500">Students</span>
                                                <span className="text-sm font-mono font-bold text-slate-700">${batch?.size}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-slate-400 uppercase text-xs font-bold tracking-wider">
                                        <${GraduationCap} size=${14} /> Faculty
                                    </div>
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold">
                                                ${faculty?.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">${faculty?.name}</p>
                                                <p className="text-xs text-slate-500">${faculty?.email}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-blue-800 mb-1">Subject Expertise:</p>
                                            <div className="flex flex-wrap gap-1">
                                                ${expertiseNames.split(', ').map(exp => html`
                                                    <span key=${exp} className=${`text-[10px] px-2 py-1 rounded-full border ${exp === subject?.code ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                                                        ${exp}
                                                    </span>
                                                `)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            })()}
        </div>
    `;
};
