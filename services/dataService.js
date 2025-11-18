

import { DEFAULT_SLOTS, MOCK_FACULTY_NAMES, MOCK_SUBJECTS } from "../constants.js";

export const generateInitialState = () => {
  // 1. Create Subjects
  const subjects = MOCK_SUBJECTS.map((s, i) => ({
    id: `sub-${i + 1}`,
    code: s.code,
    name: s.name,
    lectureHours: s.lec,
    labHours: s.lab,
    isLab: s.lab > 0
  }));

  // 2. Create Faculty with cyclic expertise assignment
  const faculty = MOCK_FACULTY_NAMES.map((name, i) => {
    // Assign 3 random subjects to each faculty member
    const subjectIndices = [];
    for(let k=0; k<3; k++) {
        subjectIndices.push((i + k * 5) % subjects.length);
    }
    
    return {
        id: `fac-${i + 1}`,
        name,
        email: name.split(' ').pop().toLowerCase() + "@univ.edu",
        department: "Computer Science",
        maxLoad: 12,
        expertise: [...new Set(subjectIndices.map(idx => subjects[idx].id))]
    };
  });

  // 3. Create Rooms - Increased Capacities for Labs to fit Batches
  const rooms = [
    { id: 'r-101', name: 'Lecture Hall 101', capacity: 65, type: 'LECTURE' },
    { id: 'r-102', name: 'Lecture Hall 102', capacity: 65, type: 'LECTURE' },
    { id: 'r-103', name: 'Lecture Hall 103', capacity: 65, type: 'LECTURE' },
    { id: 'r-104', name: 'Lecture Hall 104', capacity: 60, type: 'LECTURE' },
    { id: 'r-201', name: 'Computer Lab A', capacity: 65, type: 'LAB' },
    { id: 'r-202', name: 'Hardware Lab B', capacity: 65, type: 'LAB' },
    { id: 'r-203', name: 'Physics Lab', capacity: 65, type: 'LAB' },
    { id: 'r-301', name: 'Seminar Hall A', capacity: 120, type: 'LECTURE' },
    { id: 'r-302', name: 'Seminar Hall B', capacity: 80, type: 'LECTURE' },
    { id: 'r-401', name: 'Smart Class 401', capacity: 50, type: 'LECTURE' },
  ];

  // 4. Create Batches (Years 1-4)
  const batches = [
    { id: 'b-1', name: 'B.Tech CS Year 1', size: 58, program: 'UG', subjects: subjects.slice(0, 5).map(s => s.id) },
    { id: 'b-2', name: 'B.Tech CS Year 2', size: 55, program: 'UG', subjects: subjects.slice(5, 10).map(s => s.id) },
    { id: 'b-3', name: 'B.Tech CS Year 3', size: 48, program: 'UG', subjects: subjects.slice(10, 15).map(s => s.id) },
    { id: 'b-4', name: 'B.Tech CS Year 4', size: 42, program: 'UG', subjects: subjects.slice(15, 20).map(s => s.id) },
  ];

  // 5. Create a dense Initial Schedule
  const schedule = [];
  let entryCount = 0;

  // Helper to find a valid room and faculty for a subject
  const createEntry = (day, hour, batch, subject) => {
      const slotId = `${day}-${hour}`;
      
      // Check if batch is busy
      if (schedule.some(s => s.slotId === slotId && s.batchId === batch.id)) return false;

      // Find faculty
      const eligibleFaculty = faculty.filter(f => f.expertise.includes(subject.id));
      // Find one not busy
      const fac = eligibleFaculty.find(f => !schedule.some(s => s.slotId === slotId && s.facultyId === f.id));
      
      if (!fac) return false;

      // Find room
      const room = rooms.find(r => 
          r.capacity >= batch.size && 
          (subject.isLab ? r.type === 'LAB' : r.type === 'LECTURE') &&
          !schedule.some(s => s.slotId === slotId && s.roomId === r.id) // Room not occupied
      );

      if (room) {
          schedule.push({
              id: `entry-${++entryCount}`,
              slotId,
              subjectId: subject.id,
              facultyId: fac.id,
              roomId: room.id,
              batchId: batch.id,
              isLocked: true
          });
          return true;
      }
      return false;
  };

  // Pre-fill schedule logic: Distribute subjects nicely across ALL days (Mon-Fri)
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  
  // Create a list of all possible time slots in a preferred order (Interleaved: Mon9, Tue9, Wed9...)
  // This ensures we fill the week evenly rather than packing Monday first.
  const preferredSlots = [];
  for(let h=9; h<17; h++) {
    for(let d=0; d<5; d++) {
      preferredSlots.push({ day: days[d], hour: h });
    }
  }

  batches.forEach((batch, bIdx) => {
      // Start each batch at a different offset to reduce initial collisions
      let slotCursor = bIdx * 2; 

      batch.subjects.forEach(subId => {
          const subject = subjects.find(s => s.id === subId);
          if(!subject) return;

          // Schedule Lectures
          for(let i=0; i<subject.lectureHours; i++) {
             let scheduled = false;
             let attempts = 0;
             // Try finding a slot
             while(!scheduled && attempts < preferredSlots.length) {
                 const slot = preferredSlots[slotCursor % preferredSlots.length];
                 if(createEntry(slot.day, slot.hour, batch, subject)) {
                     scheduled = true;
                     // Jump forward to spread out lectures for this subject
                     slotCursor += 7; 
                 } else {
                     slotCursor++;
                 }
                 attempts++;
             }
          }
          
          // Schedule Labs (Try to keep them in afternoons if possible, or just fit them in)
          if(subject.isLab) {
              for(let i=0; i<subject.labHours; i++) {
                  // Try starting from afternoon slots
                  let labCursor = 0; // Scan from start if needed, but ideally afternoon
                  let scheduled = false;
                  let attempts = 0;
                  while(!scheduled && attempts < preferredSlots.length) {
                       const slot = preferredSlots[labCursor % preferredSlots.length];
                       if (createEntry(slot.day, slot.hour, batch, subject)) {
                           scheduled = true;
                       }
                       labCursor++;
                       attempts++;
                  }
              }
          }
      });
  });

  return { faculty, subjects, rooms, batches, slots: DEFAULT_SLOTS, schedule };
};

const STORAGE_KEY = 'scts_app_state_v1';

export const loadState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch(e) { console.error(e); }
  
  const initial = generateInitialState();
  saveState(initial);
  return initial;
};

export const saveState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const clearSchedule = (currentState) => {
    const newState = { ...currentState, schedule: [] };
    saveState(newState);
    return newState;
};

export const addScheduleEntry = (state, entry) => {
    const { schedule } = state;
    
    // Check for conflicts
    const conflict = schedule.find(s => 
        s.slotId === entry.slotId && (
            s.batchId === entry.batchId || 
            s.facultyId === entry.facultyId || 
            s.roomId === entry.roomId
        )
    );

    if (conflict) {
        let msg = "Slot conflict detected.";
        if (conflict.batchId === entry.batchId) msg = "This batch already has a class in this slot.";
        else if (conflict.facultyId === entry.facultyId) msg = "Faculty is already teaching in this slot.";
        else if (conflict.roomId === entry.roomId) msg = "Room is already occupied in this slot.";
        return { success: false, message: msg };
    }

    const newEntry = {
        ...entry,
        id: `manual-${Date.now()}`,
        isLocked: true
    };

    return { 
        success: true, 
        newState: { ...state, schedule: [...schedule, newEntry] } 
    };
};
