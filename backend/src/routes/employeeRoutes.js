const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Public route - Employee Search
router.get('/search', employeeController.searchEmployees);

// Protected Admin routes - CRUD Operations
router.get('/', authMiddleware, employeeController.getAllEmployees);
router.get('/:id', authMiddleware, employeeController.getEmployeeById);
router.post('/', authMiddleware, employeeController.createEmployee);
router.put('/:id', authMiddleware, employeeController.updateEmployee);
router.delete('/:id', authMiddleware, employeeController.deleteEmployee);

// Protected Admin routes - Media & Data upload/download
router.post('/upload-photo', authMiddleware, upload.single('photo'), employeeController.uploadPhoto);
router.post('/import', authMiddleware, upload.single('file'), employeeController.importExcel);
router.get('/export', authMiddleware, employeeController.exportExcel);

module.exports = router;
