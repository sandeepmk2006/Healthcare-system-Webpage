const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname)); // Serve static files

// ------------------------- MongoDB Connection -------------------------
const MONGO_URI = "mongodb://localhost:27017/Healthcare";
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ MongoDB Error:", err));

// ------------------------- User Registration -------------------------

const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String
});
const User = mongoose.model("User", userSchema);

// Register User (Signup)
app.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists!" });
        }

        const newUser = new User({ username, email, password });
        await newUser.save();
        res.status(201).json({ message: "User registered successfully!" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Login User (Check credentials)
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email, password });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });

        res.status(200).json({ message: "Login successful!" });
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ------------------------- Appointment Booking -------------------------

const appointmentSchema = new mongoose.Schema({
    appointmentNumber: { type: Number, unique: true },
    name: String,
    email: String,
    phone: String,
    doctor: String,
    date: String,
    time: String
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

// Auto-Increment Appointment Number
async function getNextAppointmentNumber() {
    try {
        const lastAppointment = await Appointment.findOne().sort({ appointmentNumber: -1 });
        console.log("Last Appointment:", lastAppointment); // Debugging

        if (lastAppointment && typeof lastAppointment.appointmentNumber === 'number') {
            const nextNumber = lastAppointment.appointmentNumber + 1;
            console.log("Next Appointment Number:", nextNumber); // Debugging
            return nextNumber;
        } else {
            console.log("No appointments found or invalid appointmentNumber. Starting from 1."); // Debugging
            return 1; // Start from 1 if no appointments exist
        }
    } catch (error) {
        console.error("Error in getNextAppointmentNumber:", error);
        return 1; // Fallback to 1 in case of an error
    }
}

// Book Appointment
app.post("/book-appointment", async (req, res) => {
    try {
        const { name, email, phone, doctor, date, time } = req.body;
        console.log("Received appointment data:", { name, email, phone, doctor, date, time }); // Debugging

        // Validate required fields
        if (!name || !email || !phone || !doctor || !date || !time) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        // Check if the appointment slot is already taken
        const existingAppointment = await Appointment.findOne({ doctor, date, time });
        if (existingAppointment) {
            console.log("Time slot already booked:", { doctor, date, time }); // Debugging
            return res.status(400).json({ error: "This time slot is already booked!" });
        }

        const appointmentNumber = await getNextAppointmentNumber();
        console.log("Generated Appointment Number:", appointmentNumber); // Debugging

        const newAppointment = new Appointment({ appointmentNumber, name, email, phone, doctor, date, time });
        await newAppointment.save();
        console.log("Appointment saved successfully:", newAppointment); // Debugging

        res.status(201).json({ message: "Appointment booked successfully!", appointmentNumber });
    } catch (error) {
        console.error("Error booking appointment:", error); // Debugging
        res.status(500).json({ error: "Server error" });
    }
});

// Get Appointment by Appointment Number
app.get("/get-appointment/:appointmentNumber", async (req, res) => {
    try {
        const appointment = await Appointment.findOne({ appointmentNumber: req.params.appointmentNumber });

        if (!appointment) {
            return res.status(404).json({ error: "Appointment not found!" });
        }

        res.status(200).json(appointment);
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// ------------------------- Serve Frontend -------------------------

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "Appiontment.html"));
});

// ------------------------- Start Server -------------------------

const PORT = 5002;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));