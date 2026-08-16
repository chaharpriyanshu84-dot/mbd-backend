const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(__dirname));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
        createTables();
    }
});

// Create tables if they do not exist
function createTables() {
    db.serialize(() => {
        // Students table
        db.run(`
            CREATE TABLE IF NOT EXISTS students (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                reg_no TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                password TEXT NOT NULL,
                course TEXT
            )
        `, (err) => {
            if (err) console.error('Error creating students table:', err.message);
            else seedMockStudents();
        });

        // Teachers table
        db.run(`
            CREATE TABLE IF NOT EXISTS teachers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                staff_id TEXT UNIQUE NOT NULL,
                email TEXT NOT NULL,
                password TEXT NOT NULL,
                department TEXT
            )
        `, (err) => {
            if (err) console.error('Error creating teachers table:', err.message);
        });

        // Notices table
        db.run(`
            CREATE TABLE IF NOT EXISTS notices (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                date TEXT NOT NULL,
                details TEXT NOT NULL,
                level TEXT NOT NULL
            )
        `, (err) => {
            if (err) console.error('Error creating notices table:', err.message);
            else seedMockNotices();
        });

        // Homework table
        db.run(`
            CREATE TABLE IF NOT EXISTS homework (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                deadline TEXT NOT NULL,
                description TEXT NOT NULL,
                class_stream TEXT NOT NULL,
                teacher_name TEXT NOT NULL
            )
        `, (err) => {
            if (err) console.error('Error creating homework table:', err.message);
        });

        // Attendance table
        db.run(`
            CREATE TABLE IF NOT EXISTS attendance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_reg TEXT NOT NULL,
                date TEXT NOT NULL,
                status TEXT NOT NULL,
                UNIQUE(student_reg, date)
            )
        `, (err) => {
            if (err) console.error('Error creating attendance table:', err.message);
        });

        // Marks table
        db.run(`
            CREATE TABLE IF NOT EXISTS marks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_reg TEXT NOT NULL,
                exam TEXT NOT NULL,
                subject TEXT NOT NULL,
                marks INTEGER NOT NULL,
                remarks TEXT,
                UNIQUE(student_reg, exam, subject)
            )
        `, (err) => {
            if (err) console.error('Error creating marks table:', err.message);
        });

        // Feedback table
        db.run(`
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_name TEXT NOT NULL,
                student_reg TEXT NOT NULL,
                category TEXT NOT NULL,
                subject TEXT NOT NULL,
                details TEXT NOT NULL,
                date TEXT NOT NULL
            )
        `, (err) => {
            if (err) console.error('Error creating feedback table:', err.message);
        });
    });
}

// Seed mock students if table is empty
function seedMockStudents() {
    db.get("SELECT COUNT(*) as count FROM students", (err, row) => {
        if (!err && row.count === 0) {
            console.log('Seeding mock students...');
            const stmt = db.prepare("INSERT INTO students (name, reg_no, email, password, course) VALUES (?, ?, ?, ?, ?)");
            const hashedPass = bcrypt.hashSync('password123', 10);
            stmt.run("Amit Sharma", "MBD-2026-041", "amit@example.com", hashedPass, "First Year B.Sc.");
            stmt.run("Rahul Kumar", "MBD-2026-042", "rahul@example.com", hashedPass, "First Year B.Sc.");
            stmt.run("Priya Patel", "MBD-2026-043", "priya@example.com", hashedPass, "First Year B.Sc.");
            stmt.finalize();
        }
    });
}

// Seed mock notices if table is empty
function seedMockNotices() {
    db.get("SELECT COUNT(*) as count FROM notices", (err, row) => {
        if (!err && row.count === 0) {
            console.log('Seeding mock notices...');
            const stmt = db.prepare("INSERT INTO notices (title, date, details, level) VALUES (?, ?, ?, ?)");
            stmt.run(
                "Independence Day Flag Hoisting Ceremony",
                "August 15, 2026",
                "The college will celebrate Independence Day with a flag hoisting ceremony at 8:00 AM on the campus grounds. Attendance is mandatory for all faculty members and students. Traditional outfits are recommended.",
                "Entire College"
            );
            stmt.run(
                "Guidelines for Academic Registration 2026-27",
                "August 10, 2026",
                "Important guidelines regarding the enrollment process and document verification have been updated. Ensure all fees are cleared to finalize your seat. Contact the administrative desk for details.",
                "Entire College"
            );
            stmt.run(
                "Weekly Assignments Submission Deadline",
                "August 05, 2026",
                "Students are directed to submit their assigned lab projects and weekly reports through their respective student portals by Saturday evening. Late submissions will attract grade penalties.",
                "Stream Level only"
            );
            stmt.finalize();
        }
    });
}

// --- STUDENT AUTH ROUTES ---

// Student Registration
app.post('/api/register/student', (req, res) => {
    const { name, regNo, email, password, course } = req.body;
    if (!name || !regNo || !email || !password) {
        return res.status(400).json({ error: 'Please provide name, registration number, email, and password.' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const query = `INSERT INTO students (name, reg_no, email, password, course) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [name, regNo, email, hashedPassword, course || ''], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'A student with this registration number already exists.' });
            }
            return res.status(500).json({ error: 'Failed to register student.' });
        }
        res.status(201).json({ message: 'Registration successful! You can now log in.' });
    });
});

// Student Login
app.post('/api/login/student', (req, res) => {
    const { regNo, password } = req.body;
    if (!regNo || !password) {
        return res.status(400).json({ error: 'Please enter registration number and password.' });
    }
    const query = `SELECT * FROM students WHERE reg_no = ?`;
    db.get(query, [regNo], (err, row) => {
        if (err || !row) {
            return res.status(400).json({ error: 'Invalid Registration Number or Password.' });
        }
        const passwordIsValid = bcrypt.compareSync(password, row.password);
        if (!passwordIsValid) {
            return res.status(400).json({ error: 'Invalid Registration Number or Password.' });
        }
        res.status(200).json({
            message: 'Login successful!',
            user: { id: row.id, name: row.name, regNo: row.reg_no, email: row.email, course: row.course, role: 'student' }
        });
    });
});

// --- TEACHER AUTH ROUTES ---

// Teacher Registration
app.post('/api/register/teacher', (req, res) => {
    const { name, staffId, email, password, department } = req.body;
    if (!name || !staffId || !email || !password) {
        return res.status(400).json({ error: 'Please provide name, staff ID, email, and password.' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    const query = `INSERT INTO teachers (name, staff_id, email, password, department) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [name, staffId, email, hashedPassword, department || ''], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'A staff member with this ID already exists.' });
            }
            return res.status(500).json({ error: 'Failed to register teacher.' });
        }
        res.status(201).json({ message: 'Registration successful! You can now log in.' });
    });
});

// Teacher Login
app.post('/api/login/teacher', (req, res) => {
    const { staffId, password } = req.body;
    if (!staffId || !password) {
        return res.status(400).json({ error: 'Please enter staff ID and password.' });
    }
    const query = `SELECT * FROM teachers WHERE staff_id = ?`;
    db.get(query, [staffId], (err, row) => {
        if (err || !row) {
            return res.status(400).json({ error: 'Invalid Staff ID or Password.' });
        }
        const passwordIsValid = bcrypt.compareSync(password, row.password);
        if (!passwordIsValid) {
            return res.status(400).json({ error: 'Invalid Staff ID or Password.' });
        }
        res.status(200).json({
            message: 'Login successful!',
            user: { id: row.id, name: row.name, staffId: row.staff_id, email: row.email, department: row.department, role: 'teacher' }
        });
    });
});

// --- GENERAL & DASHBOARD API ROUTES ---

// Get all students (for Teacher Directory and Attendance marking)
app.get('/api/students', (req, res) => {
    db.all("SELECT id, name, reg_no as regNo, email, course FROM students", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch student directory.' });
        }
        res.status(200).json(rows);
    });
});

// Get notices
app.get('/api/notices', (req, res) => {
    db.all("SELECT * FROM notices ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch notices.' });
        }
        res.status(200).json(rows);
    });
});

// Publish notice
app.post('/api/notices', (req, res) => {
    const { title, details, level } = req.body;
    if (!title || !details || !level) {
        return res.status(400).json({ error: 'Please provide notice title, details, and target level.' });
    }
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    db.run("INSERT INTO notices (title, date, details, level) VALUES (?, ?, ?, ?)", [title, dateStr, details, level], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to publish notice.' });
        }
        res.status(201).json({ message: 'Notice published successfully!' });
    });
});

// Get homework
app.get('/api/homework', (req, res) => {
    db.all("SELECT * FROM homework ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch homework.' });
        }
        res.status(200).json(rows);
    });
});

// Assign homework
app.post('/api/homework', (req, res) => {
    const { title, deadline, description, classStream, teacherName } = req.body;
    if (!title || !deadline || !description || !classStream || !teacherName) {
        return res.status(400).json({ error: 'Please provide all homework details.' });
    }
    db.run("INSERT INTO homework (title, deadline, description, class_stream, teacher_name) VALUES (?, ?, ?, ?, ?)",
        [title, deadline, description, classStream, teacherName], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to save homework.' });
            }
            res.status(201).json({ message: 'Homework assigned successfully!' });
        }
    );
});

// Get attendance for a student
app.get('/api/attendance/:regNo', (req, res) => {
    const { regNo } = req.params;
    db.all("SELECT date, status FROM attendance WHERE student_reg = ?", [regNo], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch attendance.' });
        }
        res.status(200).json(rows);
    });
});

// Save class attendance
app.post('/api/attendance', (req, res) => {
    const { attendanceRecords, date } = req.body; // records: [{ regNo, status }]
    if (!attendanceRecords || !date) {
        return res.status(400).json({ error: 'Missing attendance data or date.' });
    }

    db.serialize(() => {
        const stmt = db.prepare("INSERT OR REPLACE INTO attendance (student_reg, date, status) VALUES (?, ?, ?)");
        attendanceRecords.forEach(rec => {
            stmt.run(rec.regNo, date, rec.status);
        });
        stmt.finalize((err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to save attendance.' });
            }
            res.status(200).json({ message: 'Attendance records saved successfully!' });
        });
    });
});

// Get marks for a student
app.get('/api/marks/:regNo', (req, res) => {
    const { regNo } = req.params;
    db.all("SELECT exam, subject, marks, remarks FROM marks WHERE student_reg = ?", [regNo], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch marks.' });
        }
        res.status(200).json(rows);
    });
});

// Save class marks
app.post('/api/marks', (req, res) => {
    const { exam, subject, marksRecords } = req.body; // records: [{ regNo, marks, remarks }]
    if (!exam || !subject || !marksRecords) {
        return res.status(400).json({ error: 'Missing grading parameters.' });
    }

    db.serialize(() => {
        const stmt = db.prepare("INSERT OR REPLACE INTO marks (student_reg, exam, subject, marks, remarks) VALUES (?, ?, ?, ?, ?)");
        marksRecords.forEach(rec => {
            stmt.run(rec.regNo, exam, subject, rec.marks, rec.remarks || '');
        });
        stmt.finalize((err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to save grades.' });
            }
            res.status(200).json({ message: 'Marks records updated successfully!' });
        });
    });
});

// Submit feedback
app.post('/api/feedback', (req, res) => {
    const { name, regNo, category, subject, details } = req.body;
    if (!name || !regNo || !category || !subject || !details) {
        return res.status(400).json({ error: 'Missing feedback parameters.' });
    }
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    db.run("INSERT INTO feedback (student_name, student_reg, category, subject, details, date) VALUES (?, ?, ?, ?, ?, ?)",
        [name, regNo, category, subject, details, dateStr], function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to submit feedback.' });
            }
            res.status(201).json({ message: 'Feedback submitted successfully!' });
        }
    );
});

// Get feedback (Admin)
app.get('/api/feedback', (req, res) => {
    db.all("SELECT * FROM feedback ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch feedback.' });
        }
        res.status(200).json(rows);
    });
});

// Catch-all route to serve index.html for undefined routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(` MBD College Doora backend listening on port ${PORT}`);
    console.log(` Open http://localhost:${PORT} in your browser`);
    console.log(`===================================================`);
});
