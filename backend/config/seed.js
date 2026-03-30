const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: '../.env' });
dotenv.config();

const connectDB = require('./db');

const User = require('../models/User');
const Institution = require('../models/Institution');
const Campus = require('../models/Campus');
const Department = require('../models/Department');
const Program = require('../models/Program');
const AcademicYear = require('../models/AcademicYear');

const seed = async () => {
  await connectDB();

  // Clear existing data
  await User.deleteMany({});
  await Institution.deleteMany({});
  await Campus.deleteMany({});
  await Department.deleteMany({});
  await Program.deleteMany({});
  await AcademicYear.deleteMany({});

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const officerPassword = await bcrypt.hash('officer123', 10);
  const mgmtPassword = await bcrypt.hash('mgmt123', 10);

  const admin = await User.create({
    name: 'Super Admin',
    email: 'admin@edumerge.com',
    password: adminPassword,
    role: 'admin',
  });

  await User.create({
    name: 'John Officer',
    email: 'officer@edumerge.com',
    password: officerPassword,
    role: 'admission_officer',
  });

  await User.create({
    name: 'Management User',
    email: 'mgmt@edumerge.com',
    password: mgmtPassword,
    role: 'management',
  });

  // Create institution
  const institution = await Institution.create({
    name: 'Edumerge Institute of Technology',
    code: 'EIT',
    address: '123 Tech Park, Bengaluru, Karnataka',
    contactEmail: 'info@eit.edu',
    contactPhone: '9876543210',
    createdBy: admin._id,
  });

  // Create campus
  const campus = await Campus.create({
    name: 'Main Campus',
    institution: institution._id,
    address: 'Main Campus, Bengaluru',
    createdBy: admin._id,
  });

  // Create departments
  const csDept = await Department.create({
    name: 'Computer Science',
    code: 'CS',
    campus: campus._id,
    institution: institution._id,
    createdBy: admin._id,
  });

  const ecDept = await Department.create({
    name: 'Electronics & Communication',
    code: 'EC',
    campus: campus._id,
    institution: institution._id,
    createdBy: admin._id,
  });

  // Create academic year
  const ay = await AcademicYear.create({
    label: '2025-26',
    startYear: 2025,
    endYear: 2026,
    isActive: true,
    createdBy: admin._id,
  });

  // Create programs
  await Program.create([
    {
      name: 'B.E. Computer Science & Engineering',
      code: 'CSE',
      department: csDept._id,
      campus: campus._id,
      institution: institution._id,
      courseType: 'UG',
      entryType: 'Regular',
      totalIntake: 60,
      quotas: [
        { name: 'KCET', seats: 30, filled: 0 },
        { name: 'COMEDK', seats: 20, filled: 0 },
        { name: 'Management', seats: 10, filled: 0 },
      ],
      supernumerarySeats: 5,
      academicYear: ay._id,
      createdBy: admin._id,
    },
    {
      name: 'B.E. Electronics & Communication',
      code: 'ECE',
      department: ecDept._id,
      campus: campus._id,
      institution: institution._id,
      courseType: 'UG',
      entryType: 'Regular',
      totalIntake: 60,
      quotas: [
        { name: 'KCET', seats: 30, filled: 0 },
        { name: 'COMEDK', seats: 20, filled: 0 },
        { name: 'Management', seats: 10, filled: 0 },
      ],
      supernumerarySeats: 3,
      academicYear: ay._id,
      createdBy: admin._id,
    },
  ]);

  console.log('✅ Seed data inserted successfully!');
  console.log('');
  console.log('🔑 Test Credentials:');
  console.log('  Admin:            admin@edumerge.com    / admin123');
  console.log('  Admission Officer: officer@edumerge.com / officer123');
  console.log('  Management:       mgmt@edumerge.com     / mgmt123');
  process.exit(0);
};

seed().catch((err) => { console.error(err); process.exit(1); });
