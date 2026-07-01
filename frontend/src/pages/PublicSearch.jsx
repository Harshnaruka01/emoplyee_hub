import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, User, Phone, Mail, MapPin, Calendar, CheckCircle2, UserX, Briefcase, Award, ShieldAlert } from 'lucide-react';
import { publicSearch, API_BASE_URL } from '../services/api';

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

export const PublicSearch = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await publicSearch(query);
      setEmployees(data);
    } catch (err) {
      setEmployees([]);
      if (err.response && err.response.status === 404) {
        // Expected "Employee Not Found" case
        setError('Employee Not Found');
      } else {
        setError('An error occurred while searching. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Inactive':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'On Leave':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper for generating avatar initials
  const getInitials = (name) => {
    if (!name) return 'EMP';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 3);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-between p-4 md:p-8 relative overflow-hidden">
      {/* Background ambient glowing blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-8 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              EMPLOYEE<span className="text-brand-500 font-extrabold">HUB</span>
            </h1>
            <p className="text-xs text-slate-500">Corporate Directory</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/admin/login')}
          className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-95 duration-200 shadow-md text-slate-300"
        >
          Admin Portal
        </button>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-2xl flex-1 flex flex-col justify-center items-center z-10 py-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
            Search Employee Profile
          </h2>
          <p className="text-slate-400 max-w-md mx-auto text-sm">
            Enter the unique HR Number, Full Name, or Mobile Number to fetch details from the database.
          </p>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="w-full mb-10">
          <div className="relative flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="e.g. HR1001, Aarav Sharma, 98765..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full !pl-12 pr-28 py-3.5 glass-input text-base text-white outline-none focus:ring-4 focus:ring-brand-500/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition-all active:scale-95 duration-200 shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Search'
              )}
            </button>
          </div>
        </form>

        {/* Search Results */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-10">
            <div className="h-10 w-10 border-4 border-slate-800 border-t-brand-500 rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-500">Querying database...</p>
          </div>
        )}

        {!loading && error && (
          <div className="glass-panel w-full p-8 rounded-3xl flex flex-col items-center text-center border-rose-500/10 shadow-lg animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-4 text-rose-500">
              <UserX className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{error}</h3>
            <p className="text-slate-400 text-sm max-w-sm">
              We couldn't find any match. Double-check spelling, HR numbers, or contact formatting.
            </p>
          </div>
        )}

        {!loading && searched && employees.length > 0 && (
          <div className="w-full space-y-6 animate-fade-in">
            {employees.map((emp) => (
              <div key={emp._id} className="glass-panel w-full rounded-3xl overflow-hidden shadow-2xl relative border-slate-800">
                {/* Visual Accent bar */}
                <div className="h-2 w-full bg-gradient-to-r from-brand-600 via-brand-400 to-brand-600" />
                
                <div className="p-6 md:p-8">
                  {/* Photo & Core Bio Header */}
                  <div className="flex flex-col md:flex-row items-center md:items-start gap-6 pb-6 border-b border-slate-850">
                    <div className="relative shrink-0">
                      {emp.photoUrl ? (
                        <img
                          src={getPhotoUrl(emp.photoUrl)}
                          alt={emp.name}
                          className="h-24 w-24 md:h-28 md:w-28 rounded-2xl object-cover border border-slate-800 shadow-xl"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div
                        style={{ display: emp.photoUrl ? 'none' : 'flex' }}
                        className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-800 flex items-center justify-center text-3xl font-extrabold text-slate-400 shadow-xl"
                      >
                        {getInitials(emp.name)}
                      </div>
                      <span className={`absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase border ${getStatusColor(emp.status)}`}>
                        {emp.status}
                      </span>
                    </div>

                    <div className="flex-1 text-center md:text-left space-y-2.5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-2xl font-bold text-white">{emp.name}</h3>
                          <p className="text-sm font-semibold text-brand-400 flex items-center justify-center md:justify-start gap-1.5 mt-1">
                            <Award className="h-4 w-4" /> {emp.designation}
                          </p>
                        </div>
                        <div className="inline-block px-3 py-1 bg-slate-950 border border-slate-850 rounded-xl">
                          <span className="text-[10px] text-slate-500 uppercase block tracking-wider">HR Number</span>
                          <span className="text-sm font-extrabold text-slate-200">{emp.hrNumber}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2 pt-1 text-sm text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4 text-slate-500" /> {emp.department}
                        </span>
                        <span className="hidden md:inline text-slate-700">•</span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-slate-500" /> Joined {formatDate(emp.joiningDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Details List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 text-sm">
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-slate-500 block uppercase tracking-wider mb-1">Mobile Number</span>
                        <div className="flex items-center gap-2 text-slate-200 font-medium">
                          <Phone className="h-4 w-4 text-brand-500" />
                          <span>{emp.mobileNumber}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block uppercase tracking-wider mb-1">Email Address</span>
                        <div className="flex items-center gap-2 text-slate-200 font-medium">
                          <Mail className="h-4 w-4 text-brand-500" />
                          <span className="break-all">{emp.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <span className="text-xs text-slate-500 block uppercase tracking-wider mb-1">Residential Address</span>
                        <div className="flex items-start gap-2 text-slate-200 font-medium">
                          <MapPin className="h-4 w-4 text-brand-500 shrink-0 mt-0.5" />
                          <span>{emp.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full text-center text-xs text-slate-600 z-10 border-t border-slate-900/60 pt-6 mt-12">
        <p>&copy; {new Date().getFullYear()} Employee Hub. All rights reserved. Secured Admin Dashboard.</p>
      </footer>
    </div>
  );
};

export default PublicSearch;
