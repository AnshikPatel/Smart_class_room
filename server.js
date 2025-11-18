
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- Database Models (Mongoose) ---

const FacultySchema = new mongoose.Schema({
  name: String,
  email: String,
  department: String,
  maxLoad: Number,
  expertise: [String], // Subject IDs
  preferredSlots: [String]
});

const SubjectSchema = new mongoose.Schema({
  code: String,
  name: String,
  lectureHours: Number,
  labHours: Number,
  isLab: Boolean
});

const RoomSchema = new mongoose.Schema({
  name: String,
  capacity: Number,
  type: { type: String, enum: ['LECTURE', 'LAB'] }
});

const BatchSchema = new mongoose.Schema({
  name: String,
  size: Number,
  program: String,
  subjects: [String] // Subject IDs
});

const ScheduleSchema = new mongoose.Schema({
  slotId: String,
  subjectId: String,
  facultyId: String,
  roomId: String,
  batchId: String,
  isLocked: Boolean
});

const Faculty = mongoose.model('Faculty', FacultySchema);
const Subject = mongoose.model('Subject', SubjectSchema);
const Room = mongoose.model('Room', RoomSchema);
const Batch = mongoose.model('Batch', BatchSchema);
const Schedule = mongoose.model('Schedule', ScheduleSchema);

// --- API Routes ---

// Get Complete System State
app.get('/api/state', async (req, res) => {
  try {
    const faculty = await Faculty.find();
    const subjects = await Subject.find();
    const rooms = await Room.find();
    const batches = await Batch.find();
    const schedule = await Schedule.find();
    
    res.json({ faculty, subjects, rooms, batches, schedule });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch system state' });
  }
});

// Generate Schedule (Triggering the Engine)
app.post('/api/generate', async (req, res) => {
  try {
    // In a real scenario, this would run the python/js algorithm script
    // For now, we simulate the success response
    console.log("Running Scheduler Engine...");
    
    // ... Optimization Logic ...

    res.json({ success: true, message: "Schedule optimized successfully" });
  } catch (error) {
    res.status(500).json({ error: 'Optimization failed' });
  }
});

// AI Insights Endpoint
app.post('/api/insights', async (req, res) => {
  const { prompt } = req.body;
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    res.json({ text: response.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Data Management Routes
app.post('/api/faculty', async (req, res) => {
  const newFaculty = new Faculty(req.body);
  await newFaculty.save();
  res.json(newFaculty);
});

app.post('/api/batch', async (req, res) => {
    const newBatch = new Batch(req.body);
    await newBatch.save();
    res.json(newBatch);
});

// Start Server
app.listen(PORT, () => {
  console.log(`SCTS Backend Server running on port ${PORT}`);
});
