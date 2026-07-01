const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const dbService = require('../services/dbService');

// Public search endpoint
const searchEmployees = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required.' });
    }

    const cleanQuery = query.trim();

    // Query filters matching: hrNumber (exact), name (regex), or mobileNumber (regex)
    const filter = {
      $or: [
        { hrNumber: cleanQuery },
        { name: { $regex: cleanQuery, $options: 'i' } },
        { mobileNumber: { $regex: cleanQuery, $options: 'i' } }
      ]
    };

    const results = await dbService.employees.find(filter);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Employee Not Found' });
    }

    res.json(results);
  } catch (error) {
    console.error('Search employees error:', error);
    res.status(500).json({ message: 'Error searching employees.' });
  }
};

// Admin endpoints
const getAllEmployees = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search) {
      const cleanSearch = search.trim();
      filter = {
        $or: [
          { hrNumber: { $regex: cleanSearch, $options: 'i' } },
          { name: { $regex: cleanSearch, $options: 'i' } },
          { mobileNumber: { $regex: cleanSearch, $options: 'i' } },
          { department: { $regex: cleanSearch, $options: 'i' } },
          { designation: { $regex: cleanSearch, $options: 'i' } }
        ]
      };
    }

    const list = await dbService.employees.find(filter);
    res.json(list);
  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({ message: 'Error fetching employee list.' });
  }
};

const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await dbService.employees.findOne({ _id: id });
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Get employee by ID error:', error);
    res.status(500).json({ message: 'Error fetching employee details.' });
  }
};

const createEmployee = async (req, res) => {
  try {
    const { hrNumber, name, mobileNumber, email, department, designation, address, joiningDate, status, photoUrl } = req.body;

    // Validation
    if (!hrNumber || !name || !mobileNumber || !email || !department || !designation || !address || !joiningDate) {
      return res.status(400).json({ message: 'All fields except photo are required.' });
    }

    // Check unique HR Number
    const existing = await dbService.employees.findOne({ hrNumber });
    if (existing) {
      return res.status(400).json({ message: `An employee with HR Number ${hrNumber} already exists.` });
    }

    const employeeData = {
      hrNumber: hrNumber.trim(),
      name: name.trim(),
      mobileNumber: mobileNumber.trim(),
      email: email.trim(),
      department: department.trim(),
      designation: designation.trim(),
      address: address.trim(),
      joiningDate: new Date(joiningDate),
      status: status || 'Active',
      photoUrl: photoUrl || ''
    };

    const newEmployee = await dbService.employees.create(employeeData);
    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Error creating employee.' });
  }
};

const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if employee exists
    const employee = await dbService.employees.findOne({ _id: id });
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    // Check unique HR Number if it's changing
    if (updateData.hrNumber && updateData.hrNumber !== employee.hrNumber) {
      const existing = await dbService.employees.findOne({ hrNumber: updateData.hrNumber });
      if (existing) {
        return res.status(400).json({ message: `An employee with HR Number ${updateData.hrNumber} already exists.` });
      }
    }

    // Normalize date if present
    if (updateData.joiningDate) {
      updateData.joiningDate = new Date(updateData.joiningDate);
    }

    const updated = await dbService.employees.findByIdAndUpdate(id, updateData);
    res.json(updated);
  } catch (error) {
    console.error('Update employee error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'HR Number must be unique.' });
    }
    res.status(500).json({ message: 'Error updating employee.' });
  }
};

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await dbService.employees.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found.' });
    }

    res.json({ message: 'Employee deleted successfully.', deleted });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Error deleting employee.' });
  }
};

const uploadPhoto = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }
    
    // Express static path URL format
    const photoUrl = `/uploads/${req.file.filename}`;
    res.json({ photoUrl });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ message: 'Error uploading photo.' });
  }
};

const importExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please upload a .xlsx or .csv file.' });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    
    let workbook;
    if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      workbook = XLSX.readFile(filePath);
    } else if (fileExtension === '.csv') {
      workbook = XLSX.readFile(filePath, { type: 'string', raw: true });
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Unsupported file format. Please upload .xlsx, .xls, or .csv.' });
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ message: 'Uploaded file is empty.' });
    }

    const importedEmployees = [];
    const duplicates = [];
    const missingFields = [];
    
    // Load current DB to cross-check duplicates
    const allCurrentEmployees = await dbService.employees.find({});
    const currentHrNumbers = new Set(allCurrentEmployees.map(emp => emp.hrNumber));
    const processedHrNumbers = new Set();

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      
      // Parse fields
      const hrNumber = (row['HR Number'] || row['hrNumber'] || row['HR_NUMBER'] || '').toString().trim();
      const name = (row['Name'] || row['name'] || row['NAME'] || '').toString().trim();
      const mobileNumber = (row['Mobile Number'] || row['mobileNumber'] || row['MOBILE_NUMBER'] || row['Mobile'] || '').toString().trim();
      const email = (row['Email'] || row['email'] || row['EMAIL'] || '').toString().trim();
      const department = (row['Department'] || row['department'] || row['DEPARTMENT'] || '').toString().trim();
      const designation = (row['Designation'] || row['designation'] || row['DESIGNATION'] || '').toString().trim();
      const address = (row['Address'] || row['address'] || row['ADDRESS'] || '').toString().trim();
      let joiningDateRaw = row['Joining Date'] || row['joiningDate'] || row['JOINING_DATE'] || '';
      let status = (row['Status'] || row['status'] || row['STATUS'] || 'Active').toString().trim();
      const photoUrl = (row['Photo URL'] || row['photoUrl'] || row['PHOTO_URL'] || row['Photo'] || '').toString().trim();

      // Check required fields
      if (!hrNumber || !name || !mobileNumber || !email || !department || !designation || !address) {
        missingFields.push({ rowNumber: index + 2, name: name || 'Unknown', details: 'Missing required columns' });
        continue;
      }

      // Check duplicate in file or database
      if (currentHrNumbers.has(hrNumber) || processedHrNumbers.has(hrNumber)) {
        duplicates.push({ rowNumber: index + 2, hrNumber, name });
        continue;
      }

      // Parse status
      let normalizedStatus = 'Active';
      const checkStatus = status.toLowerCase();
      if (checkStatus.includes('inactive')) normalizedStatus = 'Inactive';
      else if (checkStatus.includes('leave')) normalizedStatus = 'On Leave';

      // Parse Date
      let parsedDate;
      if (joiningDateRaw) {
        if (typeof joiningDateRaw === 'number') {
          // Convert Excel date serial to Date
          parsedDate = new Date((joiningDateRaw - 25569) * 86400 * 1000);
        } else {
          parsedDate = new Date(joiningDateRaw);
        }
      }
      if (!parsedDate || isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }

      const empData = {
        hrNumber,
        name,
        mobileNumber,
        email,
        department,
        designation,
        address,
        joiningDate: parsedDate,
        status: normalizedStatus,
        photoUrl
      };

      importedEmployees.push(empData);
      processedHrNumbers.add(hrNumber);
    }

    let insertedCount = 0;
    if (importedEmployees.length > 0) {
      const inserted = await dbService.employees.bulkCreate(importedEmployees);
      insertedCount = inserted.length;
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    res.json({
      message: `Successfully imported ${insertedCount} employees.`,
      insertedCount,
      skippedDuplicates: duplicates.length,
      skippedMissingFields: missingFields.length,
      duplicates,
      missingFields
    });
  } catch (error) {
    console.error('Import excel error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error importing file data.' });
  }
};

const exportExcel = async (req, res) => {
  try {
    const list = await dbService.employees.find({});

    // Map fields to friendly user headers
    const exportData = list.map(emp => ({
      'HR Number': emp.hrNumber,
      'Name': emp.name,
      'Mobile Number': emp.mobileNumber,
      'Email': emp.email,
      'Department': emp.department,
      'Designation': emp.designation,
      'Address': emp.address,
      'Joining Date': new Date(emp.joiningDate).toISOString().split('T')[0],
      'Status': emp.status,
      'Photo URL': emp.photoUrl
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=employees_export.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Export excel error:', error);
    res.status(500).json({ message: 'Error exporting employee data.' });
  }
};

module.exports = {
  searchEmployees,
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadPhoto,
  importExcel,
  exportExcel
};
