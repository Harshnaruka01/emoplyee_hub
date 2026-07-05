import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, UserPlus, LogOut, Search, Edit2, Trash2, Upload, Download, 
  Briefcase, FileSpreadsheet, Eye, X, Image as ImageIcon, CheckCircle, 
  AlertTriangle, Phone, Mail, Award, Calendar, RefreshCw, Menu
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  getAllEmployees, createEmployee, updateEmployee, deleteEmployee, 
  uploadPhoto, importEmployees, exportEmployees, API_BASE_URL 
} from '../services/api';
import Toast from '../components/Toast';

const getPhotoUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('/')) {
    return `${API_BASE_URL.replace('/api', '')}${url}`;
  }
  if (url.startsWith('uploads/')) {
    return `${API_BASE_URL.replace('/api', '')}/${url}`;
  }
  return `${API_BASE_URL.replace('/api', '')}/uploads/${url}`;
};

export const AdminDashboard = () => {
  const { token, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  // Data states
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [toast, setToast] = useState(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null); // Null for Add, object for Edit
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Import log statistics
  const [importStats, setImportStats] = useState(null);

  // Checkbox selection states
  const [selectedIds, setSelectedIds] = useState([]);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Reset selection when employees list changes
  useEffect(() => {
    setSelectedIds([]);
  }, [employees]);

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === employees.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(employees.map(emp => emp._id));
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the ${selectedIds.length} selected employees?`)) {
      setLoading(true);
      try {
        await Promise.all(selectedIds.map(id => deleteEmployee(id)));
        setToast({ message: `Successfully deleted ${selectedIds.length} employees.`, type: 'success' });
        setSelectedIds([]);
        fetchEmployees(searchQuery);
      } catch (err) {
        console.error(err);
        setToast({ message: 'Failed to delete some employees.', type: 'error' });
      } finally {
        setLoading(false);
      }
    }
  };

  // File refs
  const fileInputRef = useRef(null);
  const photoInputRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    hrNumber: '',
    name: '',
    mobileNumber: '',
    email: '',
    department: '',
    designation: '',
    address: '',
    joiningDate: '',
    status: 'Active',
    photoUrl: ''
  });

  // Fetch employees list
  const fetchEmployees = async (query = '') => {
    setLoading(true);
    try {
      const data = await getAllEmployees(query);
      setEmployees(data);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to fetch employees list.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchEmployees(searchQuery);
    }
  }, [searchQuery, isAuthenticated]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.status === 'Active').length;
    const leave = employees.filter(e => e.status === 'On Leave').length;
    const departments = new Set(employees.map(e => e.department)).size;

    return { total, active, leave, departments };
  }, [employees]);

  // Handle open add modal
  const handleOpenAdd = () => {
    setCurrentEmployee(null);
    setFormData({
      hrNumber: '',
      name: '',
      mobileNumber: '',
      email: '',
      department: '',
      designation: '',
      address: '',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      photoUrl: ''
    });
    setIsFormModalOpen(true);
  };

  // Handle open edit modal
  const handleOpenEdit = (employee) => {
    setCurrentEmployee(employee);
    setFormData({
      hrNumber: employee.hrNumber,
      name: employee.name,
      mobileNumber: employee.mobileNumber,
      email: employee.email,
      department: employee.department,
      designation: employee.designation,
      address: employee.address,
      joiningDate: employee.joiningDate ? new Date(employee.joiningDate).toISOString().split('T')[0] : '',
      status: employee.status || 'Active',
      photoUrl: employee.photoUrl || ''
    });
    setIsFormModalOpen(true);
  };

  // Handle delete action
  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id);
      setToast({ message: 'Employee deleted successfully.', type: 'success' });
      setDeleteConfirmId(null);
      fetchEmployees(searchQuery);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to delete employee.', type: 'error' });
    }
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle photo file selection and immediate upload
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ message: 'File is too large. Max limit is 5MB.', type: 'error' });
      return;
    }

    setPhotoUploading(true);
    try {
      const data = await uploadPhoto(file);
      setFormData(prev => ({ ...prev, photoUrl: data.photoUrl }));
      setToast({ message: 'Photo uploaded successfully.', type: 'success' });
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to upload photo.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setPhotoUploading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    
    // Check validation
    const { hrNumber, name, mobileNumber, email, department, designation, address, joiningDate } = formData;
    if (!hrNumber || !name || !mobileNumber || !email || !department || !designation || !address || !joiningDate) {
      setToast({ message: 'All fields except photo are required.', type: 'warning' });
      return;
    }

    try {
      if (currentEmployee) {
        // Edit mode
        await updateEmployee(currentEmployee._id, formData);
        setToast({ message: 'Employee updated successfully.', type: 'success' });
      } else {
        // Add mode
        await createEmployee(formData);
        setToast({ message: 'Employee added successfully.', type: 'success' });
      }
      setIsFormModalOpen(false);
      fetchEmployees(searchQuery);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to save employee records.';
      setToast({ message: errMsg, type: 'error' });
    }
  };

  // Handle Excel/CSV import file selection
  const handleImportFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext)) {
      setToast({ message: 'Invalid file format. Please upload .xlsx or .csv.', type: 'error' });
      return;
    }

    setImporting(true);
    setImportStats(null);
    try {
      const result = await importEmployees(file);
      setImportStats(result);
      setToast({ message: `Import completed. Added ${result.insertedCount} records.`, type: 'success' });
      fetchEmployees(searchQuery);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Error processing Excel file import.';
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setImporting(false);
      // Clear input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Trigger export
  const handleExport = async () => {
    try {
      await exportEmployees();
      setToast({ message: 'Export spreadsheet downloaded.', type: 'success' });
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to export spreadsheet.', type: 'error' });
    }
  };

  // Status visual colors
  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Inactive': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'On Leave': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  // Generate Initials
  const getInitials = (name) => {
    if (!name) return 'EMP';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 3);
  };

  return (
    <div className="min-h-screen md:h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row relative md:overflow-hidden overflow-x-hidden">
      {/* Background ambient glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none" />

      {/* Mobile Top Navigation Header */}
      <header className="w-full h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-20 md:hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/20">
            <Briefcase className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              EMPLOYEE<span className="text-brand-500 font-extrabold">HUB</span>
            </h1>
            <p className="text-[8px] text-brand-400 font-bold uppercase tracking-wider">Console</p>
          </div>
        </div>
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-350 hover:text-white transition-colors"
          aria-label="Toggle Menu"
        >
          {isMobileSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Backdrop for mobile drawer */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 shrink-0 flex flex-col justify-between transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 h-full md:h-auto ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          {/* Logo Area */}
          <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0">
                <Briefcase className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent leading-none">
                  EMPLOYEE<span className="text-brand-500 font-extrabold">HUB</span>
                </h1>
                <span className="px-2 py-0.5 text-[8px] bg-slate-950 text-brand-400 font-bold border border-slate-800 rounded-full tracking-wide mt-1 inline-block">
                  ADMIN CONSOLE
                </span>
              </div>
            </div>
            
            {/* Close button for mobile drawer */}
            <button 
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white md:hidden shrink-0"
            >
              <X className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Nav links */}
          <nav className="p-4 space-y-2">
            <div className="px-4 py-3 bg-brand-600/15 border border-brand-500/20 text-brand-300 rounded-xl flex items-center gap-3 font-semibold text-sm">
              <Users className="h-4 w-4" />
              <span>Employees Directory</span>
            </div>
            <button
              onClick={() => {
                setIsImportModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full px-4 py-3 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl flex items-center gap-3 font-medium text-sm transition-all duration-150 text-left"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Bulk Actions</span>
            </button>
            <button
              onClick={() => {
                navigate('/');
                setIsMobileSidebarOpen(false);
              }}
              className="w-full px-4 py-3 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl flex items-center gap-3 font-medium text-sm transition-all duration-150 text-left"
            >
              <Eye className="h-4 w-4" />
              <span>Public Directory</span>
            </button>
          </nav>
        </div>

        {/* User profile logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-brand-500/10 flex items-center justify-center border border-brand-500/20 text-brand-400 font-bold text-xs uppercase">
                AD
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-200">System Admin</p>
                <p className="text-[10px] text-slate-500">Administrator</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => {
              logout();
              setIsMobileSidebarOpen(false);
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-rose-950/20 hover:border-rose-900/30 text-slate-400 hover:text-rose-400 flex items-center justify-center gap-2 text-xs font-semibold transition-all duration-150 active:scale-95"
          >
            <LogOut className="h-4 w-4" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Dashboard Area */}
      <main className="flex-1 flex flex-col min-w-0 z-10 overflow-y-auto overflow-x-hidden md:max-h-screen">
        {/* Top Header */}
        <header className="p-6 border-b border-slate-850 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Employees Directory</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage, upload, edit, and audit staff profiles</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {selectedIds.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/30 border border-rose-900/40 text-rose-450 font-semibold text-xs transition-all active:scale-95 duration-150 flex items-center gap-2"
              >
                <Trash2 className="h-3.5 w-3.5 text-rose-450" /> Delete Selected ({selectedIds.length})
              </button>
            )}
            <button
              onClick={handleExport}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 text-slate-300 font-semibold text-xs transition-all active:scale-95 duration-150 flex items-center gap-2"
            >
              <Download className="h-3.5 w-3.5" /> Export Data
            </button>
            <button
              onClick={handleOpenAdd}
              className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition-all active:scale-95 duration-150 flex items-center gap-2 shadow-lg shadow-brand-500/20"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add Employee
            </button>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border-slate-850 flex items-center gap-3 sm:gap-4">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-brand-500/10 flex items-center justify-center border border-brand-500/20 text-brand-400 shrink-0">
                <Users className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-wider block font-bold truncate">Total Staff</span>
                <span className="text-xl sm:text-2xl font-black text-white">{stats.total}</span>
              </div>
            </div>

            <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border-slate-850 flex items-center gap-3 sm:gap-4">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 shrink-0">
                <CheckCircle className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-wider block font-bold truncate">Active Staff</span>
                <span className="text-xl sm:text-2xl font-black text-white">{stats.active}</span>
              </div>
            </div>

            <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border-slate-850 flex items-center gap-3 sm:gap-4">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 shrink-0">
                <AlertTriangle className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-wider block font-bold truncate">On Leave</span>
                <span className="text-xl sm:text-2xl font-black text-white">{stats.leave}</span>
              </div>
            </div>

            <div className="glass-panel p-3.5 sm:p-5 rounded-2xl border-slate-850 flex items-center gap-3 sm:gap-4">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400 shrink-0">
                <Briefcase className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[8px] sm:text-[10px] text-slate-500 uppercase tracking-wider block font-bold truncate">Departments</span>
                <span className="text-xl sm:text-2xl font-black text-white">{stats.departments}</span>
              </div>
            </div>
          </div>

          {/* Filtering Table Area */}
          <div className="glass-panel rounded-2xl border-slate-850 overflow-hidden shadow-xl">
            {/* Search filter row */}
            <div className="p-5 border-b border-slate-850 flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="relative w-full md:w-80 flex items-center">
                <Search className="absolute left-3.5 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search HR number, name, dept..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full !pl-10 pr-4 py-2 glass-input text-xs text-white"
                />
              </div>

              <div className="text-xs text-slate-500 flex items-center gap-2 font-medium">
                {loading && <RefreshCw className="h-3 w-3 animate-spin text-brand-500" />}
                <span>Showing {employees.length} records</span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th className="glass-th text-center w-12">
                      <input
                        type="checkbox"
                        checked={employees.length > 0 && selectedIds.length === employees.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-800 bg-slate-950/60 text-brand-500 focus:ring-brand-500/30 focus:ring-offset-0 focus:ring-2 h-4 w-4"
                      />
                    </th>
                    <th className="glass-th">HR Number</th>
                    <th className="glass-th">Name</th>
                    <th className="glass-th">Dept / Designation</th>
                    <th className="glass-th">Contact Info</th>
                    <th className="glass-th text-center">Status</th>
                    <th className="glass-th text-center">Up to Date</th>
                    <th className="glass-th text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length === 0 && !loading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-500 text-sm">
                        No employees found matching the search criteria.
                      </td>
                    </tr>
                  ) : (
                    employees.map(emp => (
                      <tr key={emp._id} className="glass-tr">
                        <td className="glass-td text-center w-12">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(emp._id)}
                            onChange={() => handleToggleSelect(emp._id)}
                            className="rounded border-slate-800 bg-slate-950/60 text-brand-500 focus:ring-brand-500/30 focus:ring-offset-0 focus:ring-2 h-4 w-4 cursor-pointer"
                          />
                        </td>
                        <td className="glass-td font-bold text-slate-200">{emp.hrNumber}</td>
                        <td className="glass-td">
                          <p className="font-semibold text-slate-100">{emp.name}</p>
                        </td>
                        <td className="glass-td">
                          <p className="text-slate-200">{emp.department}</p>
                          <p className="text-[11px] text-slate-400">{emp.designation}</p>
                        </td>
                        <td className="glass-td text-xs space-y-1">
                          <p className="flex items-center gap-1.5 text-slate-300">
                            <Mail className="h-3 w-3 text-slate-500" /> {emp.email}
                          </p>
                          <p className="flex items-center gap-1.5 text-slate-350">
                            <Phone className="h-3 w-3 text-slate-500" /> {emp.mobileNumber}
                          </p>
                        </td>
                        <td className="glass-td text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(emp.status)}`}>
                            {emp.status}
                          </span>
                        </td>
                        <td className="glass-td text-center text-xs font-semibold text-slate-350">
                          {new Date(emp.updatedAt || emp.joiningDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td className="glass-td text-center">
                          <div className="flex justify-center items-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(emp)}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-brand-400 transition-colors"
                              title="Edit Employee"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(emp._id)}
                              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                              title="Delete Employee"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards Grid View */}
            <div className="block md:hidden p-4 space-y-4">
              {employees.length === 0 && !loading ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No employees found matching the search criteria.
                </div>
              ) : (
                employees.map(emp => (
                  <div key={emp._id} className="glass-card rounded-2xl p-4 border-slate-850 relative space-y-3">
                    
                    {/* Checkbox selection */}
                    <div className="absolute top-4 left-4 z-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(emp._id)}
                        onChange={() => handleToggleSelect(emp._id)}
                        className="rounded border-slate-800 bg-slate-950/60 text-brand-500 focus:ring-brand-500/30 focus:ring-offset-0 focus:ring-2 h-4 w-4 cursor-pointer"
                      />
                    </div>

                    {/* Photo & Core Bio */}
                    <div className="flex items-center gap-4 pl-6">
                      <div className="relative shrink-0">
                        {emp.photoUrl ? (
                          <img
                            src={getPhotoUrl(emp.photoUrl)}
                            alt={emp.name}
                            className="h-12 w-12 rounded-xl object-cover border border-slate-800"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div
                          style={{ display: emp.photoUrl ? 'none' : 'flex' }}
                          className="h-12 w-12 rounded-xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-800 flex items-center justify-center text-xs font-extrabold text-slate-400"
                        >
                          {getInitials(emp.name)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-slate-100 truncate text-sm">{emp.name}</h4>
                        <p className="text-[10px] font-semibold text-brand-400 mt-0.5">{emp.designation}</p>
                        <div className="flex gap-2 items-center mt-1">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">{emp.hrNumber}</span>
                          <span className={`px-2 py-0.2 rounded-full text-[8px] font-bold border ${getStatusColor(emp.status)}`}>
                            {emp.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Details Breakdown */}
                    <div className="grid grid-cols-1 gap-1.5 pt-2.5 border-t border-slate-850/60 text-[11px] text-slate-300">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px] shrink-0">Department</span>
                        <span className="font-medium text-slate-200 block truncate max-w-[140px] sm:max-w-[220px] text-right">{emp.department}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px] shrink-0">Email</span>
                        <span className="font-medium text-slate-200 block truncate max-w-[140px] sm:max-w-[220px] text-right" title={emp.email}>{emp.email}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px] shrink-0">Mobile</span>
                        <span className="font-medium text-slate-200 block truncate max-w-[140px] sm:max-w-[220px] text-right">{emp.mobileNumber}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px] shrink-0">Address</span>
                        <span className="font-medium text-slate-200 block truncate max-w-[140px] sm:max-w-[220px] text-right" title={emp.address}>{emp.address}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold uppercase tracking-wider text-[8px]">Up to Date</span>
                        <span className="font-medium text-slate-200">
                          {new Date(emp.updatedAt || emp.joiningDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-end gap-2 pt-2.5 border-t border-slate-850/40">
                      <button
                        onClick={() => handleOpenEdit(emp)}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg text-[10px] font-bold text-slate-300 flex items-center gap-1 transition-colors"
                      >
                        <Edit2 className="h-3 w-3" /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(emp._id)}
                        className="px-2.5 py-1 bg-rose-950/20 border border-rose-900/30 hover:bg-rose-950/40 rounded-lg text-[10px] font-bold text-rose-450 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* ADD / EDIT EMPLOYEE MODAL */}
      {/* ============================================================== */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border-slate-800 shadow-2xl relative overflow-hidden animate-scale-up my-4 sm:my-8 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
            <div className="h-1.5 w-full bg-gradient-to-r from-brand-600 to-brand-400 shrink-0" />
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-850 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {currentEmployee ? 'Edit Employee Details' : 'Register New Employee'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentEmployee ? 'Modify details for employee ' + formData.hrNumber : 'Register new hire into backend directory'}
                </p>
              </div>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Scroll Area */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Photo Upload Section */}
              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-950/40 rounded-2xl border border-slate-850">
                <div className="relative">
                  {formData.photoUrl ? (
                    <img 
                      src={getPhotoUrl(formData.photoUrl)}
                      alt="Preview" 
                      className="h-20 w-20 rounded-xl object-cover border border-slate-800"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-slate-600">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                  {photoUploading && (
                    <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 animate-spin text-brand-500" />
                    </div>
                  )}
                </div>

                <div className="text-center sm:text-left space-y-2">
                  <span className="text-xs font-bold text-slate-400 block uppercase tracking-wide">Employee Photo</span>
                  <p className="text-[10px] text-slate-500">Allowed formats: PNG, JPG, JPEG. Max size: 5MB.</p>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={photoUploading}
                      className="px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-[11px] font-bold text-slate-300 transition-all duration-150 active:scale-95"
                    >
                      Choose File
                    </button>
                    {formData.photoUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, photoUrl: '' }))}
                        className="px-3 py-1.5 rounded-lg border border-rose-950/20 hover:border-rose-900/40 bg-rose-950/10 hover:bg-rose-950/20 text-[11px] font-bold text-rose-400 transition-all duration-150 active:scale-95"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Text Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">HR Number *</label>
                  <input
                    type="text"
                    name="hrNumber"
                    value={formData.hrNumber}
                    onChange={handleInputChange}
                    disabled={!!currentEmployee} // HR Number cannot be edited
                    placeholder="e.g. HR1004"
                    className="w-full glass-input text-xs text-white disabled:opacity-50 disabled:pointer-events-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    className="w-full glass-input text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Mobile Number *</label>
                  <input
                    type="text"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. 9876543210"
                    className="w-full glass-input text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@company.com"
                    className="w-full glass-input text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g. Engineering, Sales"
                    className="w-full glass-input text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Designation *</label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    placeholder="e.g. Software Engineer"
                    className="w-full glass-input text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Joining Date *</label>
                  <input
                    type="date"
                    name="joiningDate"
                    value={formData.joiningDate}
                    onChange={handleInputChange}
                    className="w-full glass-input text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full glass-input text-xs text-white bg-slate-900"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Residential Address *</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Street, City, Zip Code"
                    className="w-full glass-input text-xs text-white resize-none"
                  />
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-850 flex justify-end gap-3 bg-slate-900/20 shrink-0">
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/40 text-xs text-slate-400 hover:text-white font-semibold transition-all active:scale-95 duration-150"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFormSubmit}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs text-white font-semibold shadow-lg shadow-brand-500/20 transition-all active:scale-95 duration-150"
              >
                {currentEmployee ? 'Save Changes' : 'Register Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* EXCEL IMPORT / BULK OPERATIONS MODAL */}
      {/* ============================================================== */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="glass-panel w-full max-w-xl rounded-3xl border-slate-800 shadow-2xl relative overflow-hidden animate-scale-up my-4 sm:my-8 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
            <div className="h-1.5 w-full bg-gradient-to-r from-emerald-600 to-emerald-400 shrink-0" />
            
            {/* Header */}
            <div className="p-6 border-b border-slate-850 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-bold text-white">Import Employees Database</h3>
                <p className="text-xs text-slate-500 mt-0.5">Upload a CSV or Excel (.xlsx) file to batch load employee accounts</p>
              </div>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStats(null);
                }}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-200 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Drop area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-850 hover:border-brand-500/40 bg-slate-950/40 hover:bg-slate-950/70 p-8 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 group"
              >
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
                  <FileSpreadsheet className="h-6 w-6" />
                </div>
                {importing ? (
                  <div className="space-y-2">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto text-brand-500" />
                    <p className="text-sm font-semibold text-slate-200">Processing file import...</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-bold text-slate-200 mb-1">Click to select file</p>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto">
                      Supports Excel spreadsheets (.xlsx, .xls) and standard text comma-separated values (.csv)
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFileChange}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  disabled={importing}
                />
              </div>

              {/* Requirements checklist */}
              <div className="p-4 bg-slate-950/50 border border-slate-850 rounded-2xl text-xs space-y-2 text-slate-400">
                <p className="font-bold text-slate-300">File requirements & column names:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Required columns: <code className="text-brand-400">HR Number</code>, <code className="text-brand-400">Name</code>, <code className="text-brand-400">Mobile Number</code>, <code className="text-brand-400">Email</code>, <code className="text-brand-400">Department</code>, <code className="text-brand-400">Designation</code>, <code className="text-brand-400">Address</code>.</li>
                  <li>Optional columns: <code className="text-emerald-400">Joining Date</code>, <code className="text-emerald-400">Status</code>, <code className="text-emerald-400">Photo URL</code>.</li>
                  <li>Duplicate <code className="text-brand-400">HR Number</code> rows will be automatically skipped to prevent data overlaps.</li>
                </ul>
              </div>

              {/* Import Log/Result Details */}
              {importStats && (
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-400" /> Import Summary Statistics
                  </h4>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] uppercase text-slate-500 font-bold block">Imported</span>
                      <span className="text-lg font-black text-emerald-400">{importStats.insertedCount}</span>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] uppercase text-slate-500 font-bold block">Dup Skips</span>
                      <span className="text-lg font-black text-amber-400">{importStats.skippedDuplicates}</span>
                    </div>
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                      <span className="text-[9px] uppercase text-slate-500 font-bold block">Incomplete</span>
                      <span className="text-lg font-black text-rose-400">{importStats.skippedMissingFields}</span>
                    </div>
                  </div>

                  {/* Warning breakdown list */}
                  {importStats.duplicates.length > 0 && (
                    <div className="text-[11px] max-h-36 overflow-y-auto space-y-1.5 border-t border-slate-850 pt-3">
                      <p className="font-bold text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Duplicate Skipped Log:
                      </p>
                      {importStats.duplicates.map((dup, dIdx) => (
                        <div key={dIdx} className="flex justify-between text-slate-400 bg-slate-950/20 p-1.5 rounded border border-slate-850/50">
                          <span>Row {dup.rowNumber}: {dup.name}</span>
                          <span className="font-mono text-slate-500">Duplicate HR ({dup.hrNumber})</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {importStats.missingFields.length > 0 && (
                    <div className="text-[11px] max-h-36 overflow-y-auto space-y-1.5 border-t border-slate-850 pt-3">
                      <p className="font-bold text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> Incomplete Row Log:
                      </p>
                      {importStats.missingFields.map((miss, mIdx) => (
                        <div key={mIdx} className="flex justify-between text-slate-400 bg-slate-950/20 p-1.5 rounded border border-slate-850/50">
                          <span>Row {miss.rowNumber}: {miss.name}</span>
                          <span className="font-mono text-slate-500">{miss.details}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-slate-850 bg-slate-900/20 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportStats(null);
                }}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all active:scale-95 duration-150"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE CONFIRMATION DIALOG */}
      {/* ============================================================== */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-sm rounded-3xl border-slate-800 p-6 shadow-2xl animate-scale-up text-center">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h4 className="text-lg font-bold text-white mb-2">Delete Employee Profile?</h4>
            <p className="text-xs text-slate-400 mb-6">
              This action cannot be undone. All data fields and the linked profile information will be deleted from the database.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-semibold text-slate-400 hover:text-white transition-all active:scale-95 duration-150"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-all active:scale-95 duration-150 shadow-lg shadow-rose-950/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
