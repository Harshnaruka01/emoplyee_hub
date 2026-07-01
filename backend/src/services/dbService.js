const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE_PATH = path.resolve(__dirname, '../../data/db.json');
let isFallbackMode = false;

// Ensure local JSON DB file and directory exist
const ensureLocalDB = () => {
  const dir = path.dirname(DB_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE_PATH)) {
    // Write empty database shell
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify({ users: [], employees: [] }, null, 2));
  }
};

// Read local JSON DB
const readLocalDB = () => {
  ensureLocalDB();
  try {
    const data = fs.readFileSync(DB_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading fallback database file:', error);
    return { users: [], employees: [] };
  }
};

// Write local JSON DB
const writeLocalDB = (data) => {
  ensureLocalDB();
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing fallback database file:', error);
  }
};

// Mongoose Schemas (used when MongoDB is running)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const EmployeeSchema = new mongoose.Schema({
  hrNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  mobileNumber: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  designation: { type: String, required: true },
  address: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Inactive', 'On Leave'], default: 'Active' },
  photoUrl: { type: String, default: '' },
}, { timestamps: true });

let UserModel;
let EmployeeModel;

// Seed default data
const seedData = async () => {
  const adminUsername = 'admin';
  const plainPassword = 'admin123';
  
  const sampleEmployees = [
    {
      hrNumber: "HR1001",
      name: "Aarav Sharma",
      mobileNumber: "9876543210",
      email: "aarav.sharma@company.com",
      department: "Engineering",
      designation: "Tech Lead",
      address: "123 Tech Park, Sector 62, Noida, UP",
      joiningDate: new Date("2023-01-10").toISOString(),
      status: "Active",
      photoUrl: ""
    },
    {
      hrNumber: "HR1002",
      name: "Priya Patel",
      mobileNumber: "8765432109",
      email: "priya.patel@company.com",
      department: "Human Resources",
      designation: "HR Manager",
      address: "456 HR Hub, Bandra West, Mumbai, MH",
      joiningDate: new Date("2024-03-15").toISOString(),
      status: "Active",
      photoUrl: ""
    },
    {
      hrNumber: "HR1003",
      name: "Vikram Singh",
      mobileNumber: "7654321098",
      email: "vikram.singh@company.com",
      department: "Marketing",
      designation: "Marketing Specialist",
      address: "789 Ad Lane, Indiranagar, Bengaluru, KA",
      joiningDate: new Date("2025-02-20").toISOString(),
      status: "Active",
      photoUrl: ""
    }
  ];

  if (isFallbackMode) {
    const db = readLocalDB();
    
    // Seed admin
    const adminExists = db.users.find(u => u.username === adminUsername);
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      db.users.push({
        _id: 'admin-id-1',
        username: adminUsername,
        password: hashedPassword
      });
      console.log('[Fallback DB] Seeded admin user: username=admin, password=admin123');
    }
    
    // Seed employees
    if (db.employees.length === 0) {
      db.employees = sampleEmployees.map((emp, index) => ({
        _id: `emp-seeded-${index + 1}`,
        ...emp,
        updatedAt: emp.joiningDate
      }));
      console.log('[Fallback DB] Seeded 3 sample employees.');
    }
    
    writeLocalDB(db);
  } else {
    try {
      // Seed admin
      const adminCount = await UserModel.countDocuments({ username: adminUsername });
      if (adminCount === 0) {
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        await UserModel.create({
          username: adminUsername,
          password: hashedPassword,
        });
        console.log('[MongoDB] Seeded admin user: username=admin, password=admin123');
      }
      
      // Seed employees
      const employeeCount = await EmployeeModel.countDocuments();
      if (employeeCount === 0) {
        await EmployeeModel.insertMany(sampleEmployees);
        console.log('[MongoDB] Seeded 3 sample employees.');
      }
    } catch (err) {
      console.error('Failed to seed data in MongoDB:', err);
    }
  }
};

// Database Connection
const connect = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/employee_hub';
  console.log(`Connecting to MongoDB at ${mongoUri}...`);
  
  try {
    // Attempt Mongoose connection with a 2-second timeout
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    
    // Compile models
    UserModel = mongoose.model('User', UserSchema);
    EmployeeModel = mongoose.model('Employee', EmployeeSchema);
    isFallbackMode = false;
    console.log('[Database] Connected to MongoDB successfully.');
  } catch (error) {
    console.warn(`[Database] MongoDB connection failed: ${error.message}`);
    console.warn('[Database] Falling back to local JSON file storage (db.json).');
    isFallbackMode = true;
    ensureLocalDB();
  }
  
  // Seed admin and data in whichever DB is running
  await seedData();
};

// Interface wrappers
const users = {
  findOne: async (query) => {
    if (!isFallbackMode) {
      return await UserModel.findOne(query).lean();
    } else {
      const db = readLocalDB();
      return db.users.find(u => {
        return Object.keys(query).every(key => u[key] === query[key]);
      }) || null;
    }
  },
  create: async (userData) => {
    if (!isFallbackMode) {
      const user = new UserModel(userData);
      return (await user.save()).toObject();
    } else {
      const db = readLocalDB();
      const newUser = {
        _id: 'user-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        ...userData
      };
      db.users.push(newUser);
      writeLocalDB(db);
      return newUser;
    }
  },
  count: async () => {
    if (!isFallbackMode) {
      return await UserModel.countDocuments();
    } else {
      const db = readLocalDB();
      return db.users.length;
    }
  }
};

const employees = {
  find: async (filter = {}) => {
    if (!isFallbackMode) {
      return await EmployeeModel.find(filter).sort({ joiningDate: -1 }).lean();
    } else {
      const db = readLocalDB();
      let list = [...db.employees];
      
      // Basic filtering support
      if (filter.$or) {
        list = list.filter(emp => {
          return filter.$or.some(clause => {
            return Object.entries(clause).every(([key, condition]) => {
              const val = emp[key] ? emp[key].toString() : '';
              if (condition && condition.$regex) {
                const regex = new RegExp(condition.$regex, condition.$options || '');
                return regex.test(val);
              }
              return val === condition;
            });
          });
        });
      } else {
        Object.entries(filter).forEach(([key, value]) => {
          if (value && typeof value === 'object' && value.$regex) {
            const regex = new RegExp(value.$regex, value.$options || '');
            list = list.filter(emp => regex.test(emp[key] || ''));
          } else if (value !== undefined) {
            list = list.filter(emp => emp[key] === value);
          }
        });
      }
      
      // Sort by joiningDate descending (fallback sorting)
      list.sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate));
      return list;
    }
  },
  findOne: async (query) => {
    if (!isFallbackMode) {
      return await EmployeeModel.findOne(query).lean();
    } else {
      const db = readLocalDB();
      return db.employees.find(emp => {
        return Object.keys(query).every(key => emp[key] === query[key]);
      }) || null;
    }
  },
  create: async (employeeData) => {
    if (!isFallbackMode) {
      const employee = new EmployeeModel(employeeData);
      return (await employee.save()).toObject();
    } else {
      const db = readLocalDB();
      // Check for duplicate HR number
      if (db.employees.some(emp => emp.hrNumber === employeeData.hrNumber)) {
        const err = new Error(`Employee with HR Number ${employeeData.hrNumber} already exists`);
        err.code = 11000; // duplicate key error code
        throw err;
      }
      const newEmp = {
        _id: 'emp-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
        ...employeeData,
        // Make sure joiningDate is stored as standard ISO string
        joiningDate: new Date(employeeData.joiningDate).toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.employees.push(newEmp);
      writeLocalDB(db);
      return newEmp;
    }
  },
  findByIdAndUpdate: async (id, updateData) => {
    if (!isFallbackMode) {
      return await EmployeeModel.findByIdAndUpdate(id, updateData, { new: true }).lean();
    } else {
      const db = readLocalDB();
      const index = db.employees.findIndex(emp => emp._id === id);
      if (index === -1) return null;
      
      // Prevent HR Number duplicates
      if (updateData.hrNumber && updateData.hrNumber !== db.employees[index].hrNumber) {
        if (db.employees.some(emp => emp.hrNumber === updateData.hrNumber && emp._id !== id)) {
          const err = new Error(`Employee with HR Number ${updateData.hrNumber} already exists`);
          err.code = 11000;
          throw err;
        }
      }
      
      const updated = {
        ...db.employees[index],
        ...updateData,
        // Ensure ISO format for date if updated
        joiningDate: updateData.joiningDate ? new Date(updateData.joiningDate).toISOString() : db.employees[index].joiningDate,
        updatedAt: new Date().toISOString()
      };
      db.employees[index] = updated;
      writeLocalDB(db);
      return updated;
    }
  },
  findByIdAndDelete: async (id) => {
    if (!isFallbackMode) {
      return await EmployeeModel.findByIdAndDelete(id).lean();
    } else {
      const db = readLocalDB();
      const index = db.employees.findIndex(emp => emp._id === id);
      if (index === -1) return null;
      const [deleted] = db.employees.splice(index, 1);
      writeLocalDB(db);
      return deleted;
    }
  },
  count: async (filter = {}) => {
    if (!isFallbackMode) {
      return await EmployeeModel.countDocuments(filter);
    } else {
      const list = await employees.find(filter);
      return list.length;
    }
  },
  bulkCreate: async (employeeList) => {
    if (!isFallbackMode) {
      return await EmployeeModel.insertMany(employeeList);
    } else {
      const db = readLocalDB();
      const inserted = [];
      for (const empData of employeeList) {
        // Prevent duplicate HR numbers during import
        if (db.employees.some(emp => emp.hrNumber === empData.hrNumber)) {
          continue; // skip duplicate HR number records silently, or we handle in controller
        }
        const newEmp = {
          _id: 'emp-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
          ...empData,
          joiningDate: new Date(empData.joiningDate).toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.employees.push(newEmp);
        inserted.push(newEmp);
      }
      writeLocalDB(db);
      return inserted;
    }
  }
};

module.exports = {
  connect,
  users,
  employees,
  isFallback: () => isFallbackMode
};
