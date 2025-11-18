
export const runScheduler = (state) => {
  const { slots, rooms, faculty } = state;
  let newSchedule = [];
  const conflicts = [];

  let sessionsNeeded = [];
  state.batches.forEach(batch => {
    batch.subjects.forEach(subId => {
      const subject = state.subjects.find(s => s.id === subId);
      if (subject) {
        // Schedule Lectures
        for (let i = 0; i < subject.lectureHours; i++) {
          sessionsNeeded.push({ 
            id: `${batch.id}-${subject.id}-LEC-${i}`, 
            subject, 
            batch, 
            type: 'LECTURE', 
            duration: 1 
          });
        }
        // Schedule Labs
        for (let i = 0; i < subject.labHours; i++) {
           sessionsNeeded.push({ 
             id: `${batch.id}-${subject.id}-LAB-${i}`, 
             subject, 
             batch, 
             type: 'LAB', 
             duration: 1 
           }); 
        }
      }
    });
  });

  // Sort to prioritize Labs first (harder to fit), then larger batches
  sessionsNeeded.sort((a, b) => {
    if (a.type === 'LAB' && b.type !== 'LAB') return -1;
    if (a.type !== 'LAB' && b.type === 'LAB') return 1;
    return b.batch.size - a.batch.size;
  });

  const roomOccupancy = {};
  const facultyOccupancy = {};
  const batchOccupancy = {};

  // Optimization: Sort slots to fill "Horizontally" (Mon9, Tue9, Wed9...) 
  // instead of "Vertically" (Mon9, Mon10, Mon11...).
  // This ensures that if we have 3 lectures for a subject, they likely land on different days.
  const sortedSlots = [...slots].sort((a, b) => {
      if (a.periodIndex !== b.periodIndex) return a.periodIndex - b.periodIndex; // Sort by hour first (9am, 10am...)
      return a.day.localeCompare(b.day); // Then by day
  });

  sessionsNeeded.forEach(session => {
    let assigned = false;
    const eligibleFaculty = faculty.filter(f => f.expertise.includes(session.subject.id));
    
    if (eligibleFaculty.length === 0) {
      conflicts.push({ 
        id: `conf-${session.id}`, 
        type: 'CAPACITY_MISMATCH', 
        description: `No faculty found for ${session.subject.name} (${session.type})`, 
        severity: 'HIGH' 
      });
      return;
    }

    for (const slot of sortedSlots) {
      if (assigned) break;
      // Check if batch is already busy in this slot
      if (batchOccupancy[`${slot.id}-${session.batch.id}`]) continue;

      for (const fac of eligibleFaculty) {
        if (assigned) break;
        // Check if faculty is busy
        if (facultyOccupancy[`${slot.id}-${fac.id}`]) continue;

        // Find eligible room: Must be big enough AND correct type
        const eligibleRooms = rooms.filter(r => 
            r.capacity >= session.batch.size && 
            (session.type === 'LAB' ? r.type === 'LAB' : r.type === 'LECTURE')
        );

        for (const room of eligibleRooms) {
           // Check if room is busy
           if (roomOccupancy[`${slot.id}-${room.id}`]) continue;

           assigned = true;
           
           // Record Occupancy
           batchOccupancy[`${slot.id}-${session.batch.id}`] = session.id;
           facultyOccupancy[`${slot.id}-${fac.id}`] = session.id;
           roomOccupancy[`${slot.id}-${room.id}`] = session.id;

           newSchedule.push({
             id: `entry-${session.id}`,
             slotId: slot.id,
             batchId: session.batch.id,
             facultyId: fac.id,
             roomId: room.id,
             subjectId: session.subject.id,
             isLocked: false
           });
           break;
        }
      }
    }
    if (!assigned) {
      conflicts.push({ 
          id: `unassigned-${session.id}`, 
          type: 'ROOM_DOUBLE_BOOKING', 
          description: `Could not find slot/room for ${session.batch.name} - ${session.subject.code} (${session.type})`, 
          severity: 'MEDIUM' 
      });
    }
  });

  return { schedule: newSchedule, conflicts };
};
