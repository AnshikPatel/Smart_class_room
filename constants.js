
export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'];

// Generate standard 1-hour slots from 9AM to 5PM
export const DEFAULT_SLOTS = [];
const startHour = 9;
const endHour = 17;

DAYS.forEach(day => {
  for (let h = startHour; h < endHour; h++) {
    DEFAULT_SLOTS.push({
      id: `${day}-${h}`,
      day: day,
      startTime: `${h}:00`,
      endTime: `${h + 1}:00`,
      periodIndex: h - startHour
    });
  }
});

export const MOCK_FACULTY_NAMES = [
  "Dr. Alan Turing", "Prof. Ada Lovelace", "Dr. Grace Hopper", "Prof. John von Neumann", 
  "Dr. Claude Shannon", "Prof. Richard Feynman", "Dr. Marie Curie", "Prof. Isaac Newton",
  "Dr. Katherine Johnson", "Prof. Stephen Hawking", "Dr. Radia Perlman", "Prof. Tim Berners-Lee",
  "Dr. Barbara Liskov", "Prof. Donald Knuth", "Dr. Shafi Goldwasser", "Prof. Ken Thompson",
  "Dr. Geoffrey Hinton", "Prof. Yann LeCun", "Dr. Andrew Ng", "Prof. Fei-Fei Li",
  "Dr. Demis Hassabis", "Prof. Yoshua Bengio"
];

export const MOCK_SUBJECTS = [
  // Year 1
  { code: "CS101", name: "Intro to Programming", lec: 3, lab: 2 },
  { code: "MA101", name: "Calculus I", lec: 4, lab: 0 },
  { code: "PH101", name: "Physics I", lec: 3, lab: 2 },
  { code: "HU101", name: "Technical Comm.", lec: 2, lab: 0 },
  { code: "EE101", name: "Basic Electronics", lec: 3, lab: 1 },
  // Year 2
  { code: "CS201", name: "Data Structures", lec: 3, lab: 2 },
  { code: "CS202", name: "Comp. Org. & Arch.", lec: 3, lab: 0 },
  { code: "CS203", name: "Discrete Math", lec: 3, lab: 0 },
  { code: "MA201", name: "Prob. & Statistics", lec: 3, lab: 0 },
  { code: "CS205", name: "Digital Logic Design", lec: 3, lab: 2 },
  // Year 3
  { code: "CS301", name: "Operating Systems", lec: 3, lab: 2 },
  { code: "CS302", name: "Database Systems", lec: 3, lab: 2 },
  { code: "CS303", name: "Comp. Networks", lec: 3, lab: 2 },
  { code: "CS304", name: "Theory of Comp.", lec: 3, lab: 0 },
  { code: "CS305", name: "Software Engineering", lec: 3, lab: 0 },
  // Year 4
  { code: "CS401", name: "Artificial Intelligence", lec: 3, lab: 0 },
  { code: "CS402", name: "Machine Learning", lec: 3, lab: 2 },
  { code: "CS403", name: "Distributed Systems", lec: 3, lab: 0 },
  { code: "CS499", name: "Capstone Project", lec: 0, lab: 6 },
  { code: "CS405", name: "Cloud Computing", lec: 3, lab: 0 },
  // Electives
  { code: "CS501", name: "Computer Vision", lec: 3, lab: 2 },
  { code: "CS502", name: "NLP", lec: 3, lab: 0 },
  { code: "CS503", name: "Cyber Security", lec: 3, lab: 2 },
  { code: "CS504", name: "Blockchain Tech", lec: 3, lab: 0 }
];
