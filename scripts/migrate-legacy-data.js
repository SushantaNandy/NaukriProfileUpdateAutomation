const db = require('../server/db/database');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

async function migrate() {
    console.log('Starting legacy data migration...');

    const users = [
        {
            name: 'Sushanta',
            email: 'sushanta@naukriboost.com',
            password: 'password123',
            resume_path: 'SDETSushantaResume.pdf',
            role: 'Software Engineer',
            proof_points: 'Backend Expert, FNZ Group, Playwright'
        },
        {
            name: 'Janvi',
            email: 'janvi@naukriboost.com',
            password: 'password123',
            resume_path: 'Janvi_Rai_Marketing_Analyst_Resume.docx',
            role: 'Marketing Analyst',
            proof_points: '15%+ YouTube Growth, GA4, ROI Tracking, Great Learning'
        },
        {
            name: 'Saksham',
            email: 'saksham@naukriboost.com',
            password: 'password123',
            resume_path: 'Saksham_Agrawal_QA_Resume_Clean.docx',
            role: 'SDET / Automation Tester',
            proof_points: 'Selenium, Java, API Testing, Framework Design'
        }
    ];

    for (const userData of users) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(userData.password, salt);

        // Check if user exists
        let userRow = db.prepare('SELECT id FROM users WHERE email = ?').get(userData.email);

        if (!userRow) {
            // Insert User
            const insertUser = db.prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
            const result = insertUser.run(userData.name, userData.email, hash);
            userRow = { id: result.lastInsertRowid };
            console.log(`Inserted user: ${userData.name}`);
        } else {
            console.log(`User already exists: ${userData.name}`);
        }

        const userId = userRow.id;

        // Ensure the absolute path points correctly to the root 'data' folder
        const absoluteResumePath = path.resolve(__dirname, '..', 'data', userData.resume_path);

        // Check if resume file actually exists on disk (for safety)
        if (!fs.existsSync(absoluteResumePath)) {
            console.warn(`WARNING: Resume file not found on disk at ${absoluteResumePath}`);
        }

        // Insert/Update Resume
        const existingResume = db.prepare('SELECT id FROM resumes WHERE user_id = ?').get(userId);
        if (!existingResume) {
            db.prepare('INSERT INTO resumes (user_id, original_filename, stored_path, job_role, proof_points) VALUES (?, ?, ?, ?, ?)')
              .run(userId, userData.resume_path, absoluteResumePath, userData.role, userData.proof_points);
             console.log(`Linked legacy resume for: ${userData.name}`);
        } else {
            db.prepare('UPDATE resumes SET stored_path = ?, job_role = ?, proof_points = ? WHERE user_id = ?')
              .run(absoluteResumePath, userData.role, userData.proof_points, userId);
            console.log(`Updated legacy resume for: ${userData.name}`);
        }

        // Insert Default Schedule
        const existingSchedule = db.prepare('SELECT id FROM schedules WHERE user_id = ?').get(userId);
        if (!existingSchedule) {
            db.prepare('INSERT INTO schedules (user_id, boost_time) VALUES (?, ?)')
              .run(userId, '09:00');
            console.log(`Created default schedule for: ${userData.name}`);
        }
    }

    console.log('Legacy Data Migration Complete!');
}

migrate().catch(console.error);
