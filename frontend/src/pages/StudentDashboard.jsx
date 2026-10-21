import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Calendar, 
  GraduationCap, 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  XCircle,
  Trash2,
  Sparkles,
  TrendingUp,
  Award,
  Layers,
  Check
} from 'lucide-react';
import { api } from '../api';
import VisualTimetable from '../components/VisualTimetable';

export default function StudentDashboard({ currentUser, showToast }) {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'schedule' | 'enrolled' | 'grades'
  
  // Data states
  const [sections, setSections] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [timetable, setTimetable] = useState({ schedule: [], total_credits: 0, max_credits: 18 });
  const [grades, setGrades] = useState({ history: [], gpa: 0, total_credits_earned: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [hideFull, setHideFull] = useState(false);

  // Drop modal state
  const [dropModalSection, setDropModalSection] = useState(null);

  // Load all data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [catData, ttData, grData] = await Promise.all([
        api.getCatalog({ dept: selectedDept, search: searchTerm }),
        api.getTimetable(),
        api.getGrades(),
      ]);

      if (catData.success) {
        setSections(catData.sections || []);
        // Extract unique departments for filter dropdown
        const depts = Array.from(new Set((catData.sections || []).map(s => s.dept_name))).filter(Boolean);
        if (depts.length > 0 && departments.length === 0) {
          setDepartments(depts);
        }
      }

      if (ttData.success) {
        setTimetable(ttData);
      }

      if (grData.success) {
        setGrades(grData);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load dashboard data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedDept]);

  // Handle search submit or debounce
  const handleSearch = async (e) => {
    e?.preventDefault();
    try {
      const res = await api.getCatalog({ dept: selectedDept, search: searchTerm });
      if (res.success) {
        setSections(res.sections || []);
      }
    } catch (err) {
      showToast(err.message || 'Search failed', 'error');
    }
  };

  // Register section handler
  const handleRegister = async (section) => {
    setActionLoadingId(section.id);
    try {
      const res = await api.registerCourse(section.id);
      if (res.success) {
        showToast(res.message || `Successfully enrolled in ${section.course_id}!`, 'success');
        // Refresh catalog, timetable, and enrolled lists
        await loadDashboardData();
      }
    } catch (err) {
      showToast(err.message || 'Registration failed. Check rules or prerequisites.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Drop section handler
  const handleConfirmDrop = async () => {
    if (!dropModalSection) return;
    const sec = dropModalSection;
    setActionLoadingId(sec.section_id || sec.id);
    try {
      const res = await api.dropCourse(sec.section_id || sec.id);
      if (res.success) {
        showToast(`Dropped ${sec.course_id || sec.title}. Seat has been released.`, 'info');
        setDropModalSection(null);
        await loadDashboardData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to drop course.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter sections client-side for "hideFull"
  const displayedSections = sections.filter((s) => {
    if (hideFull && s.is_full) return false;
    return true;
  });

  const enrolledCount = timetable.schedule?.length || 0;
  const totalCredits = timetable.total_credits || 0;
  const maxCredits = timetable.max_credits || 18;
  const creditPct = Math.min(100, Math.round((totalCredits / maxCredits) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Humanized Greeting Banner */}
      <div className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-900/40 via-slate-900/70 to-slate-900/90 border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-400">
              <Sparkles className="w-3.5 h-3.5" /> Fall 2026 Academic Registration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Good day, {currentUser.name || 'Alex'}! 👋
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              You are currently enrolled in <strong className="text-indigo-400">{totalCredits} credits</strong> ({enrolledCount} classes). 
              {totalCredits < 12 
                ? ' You need at least 12 credits to maintain full-time status this semester.'
                : ' You have met full-time status! You can add up to ' + (maxCredits - totalCredits) + ' more elective credits.'}
            </p>
          </div>

          {/* Quick Credit Progress Indicator */}
          <div className="flex-shrink-0 bg-slate-950/70 border border-slate-800 p-4 rounded-2xl min-w-[240px]">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-slate-400">Semester Credit Load</span>
              <span className="text-indigo-400 font-mono">{totalCredits} / {maxCredits} Max</span>
            </div>
            <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  totalCredits > 15 ? 'bg-amber-500' : 'bg-gradient-to-r from-indigo-500 to-teal-400'
                }`}
                style={{ width: `${creditPct}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-mono">
              <span>0 cr</span>
              <span>12 cr (Full-Time)</span>
              <span>18 cr (Cap)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'catalog'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" /> Course Catalog ({displayedSections.length})
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" /> Visual Timetable ({enrolledCount})
        </button>

        <button
          onClick={() => setActiveTab('enrolled')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'enrolled'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" /> My Enrolled Classes ({enrolledCount})
        </button>

        <button
          onClick={() => setActiveTab('grades')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'grades'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Award className="w-4 h-4" /> Grades & Transcript ({grades.gpa ? grades.gpa.toFixed(2) : '3.82'} GPA)
        </button>
      </div>

      {/* TAB 1: COURSE CATALOG & REGISTRATION */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-col md:flex-row items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 w-full relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by course code, title, or instructor..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </form>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="py-2.5 px-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-medium text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-xs font-medium text-slate-400 cursor-pointer whitespace-nowrap pl-2">
                <input
                  type="checkbox"
                  checked={hideFull}
                  onChange={(e) => setHideFull(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-indigo-500"
                />
                Hide Full
              </label>
            </div>
          </div>

          {/* Catalog Sections Grid */}
          {displayedSections.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-2xl border border-slate-800 bg-slate-900/40">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">No courses match your filter</h3>
              <p className="text-xs text-slate-500 mt-1">Try clearing your search query or selecting "All Departments".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedSections.map((sec) => {
                const isEnrolled = sec.is_registered;
                const isFull = sec.is_full;
                const hasClash = sec.has_clash;
                const missingPrereq = !sec.prereqs_met;
                const isLoading = actionLoadingId === sec.id;

                // Seat utilization percentage
                const seatPct = Math.round(((sec.capacity - sec.available_seats) / sec.capacity) * 100);

                return (
                  <div
                    key={sec.id}
                    className={`rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 ${
                      isEnrolled
                        ? 'bg-slate-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20'
                        : isFull
                        ? 'bg-slate-950/60 border-slate-800/80 opacity-80'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:shadow-xl'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {sec.course_id} • Sec {sec.section_id}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                            {sec.credits} Cr
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">
                            {sec.dept_name}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-bold text-slate-100 leading-snug mb-3">
                        {sec.title}
                      </h3>

                      {/* Schedule, Room, Instructor Details */}
                      <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          <span>{sec.time_slot}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                          <span>{sec.classroom}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                          <span>{sec.instructor || 'Faculty Staff'}</span>
                        </div>
                      </div>

                      {/* Prerequisite & Clash Warning Badges */}
                      <div className="space-y-1 mb-4">
                        {sec.prerequisites && sec.prerequisites.length > 0 && (
                          <div className={`text-[11px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                            missingPrereq 
                              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300' 
                              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                          }`}>
                            {missingPrereq ? (
                              <>
                                <AlertCircle className="w-3 h-3 text-rose-400 flex-shrink-0" />
                                <span>Prereq needed: {sec.missing_prereqs.join(', ')}</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                <span>Prerequisites satisfied</span>
                              </>
                            )}
                          </div>
                        )}

                        {hasClash && !isEnrolled && (
                          <div className="text-[11px] px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 flex items-center gap-1.5">
                            <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                            <span>Schedule conflict detected</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Seat Capacity Bar & Action Button */}
                    <div className="pt-3 border-t border-slate-800/80">
                      <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                        <span className="text-slate-400">Seat Capacity</span>
                        <span className={`font-mono ${isFull ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                          {sec.enrolled_count} / {sec.capacity} ({sec.available_seats} open)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isFull 
                              ? 'bg-rose-500' 
                              : seatPct > 80 
                              ? 'bg-amber-400' 
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${seatPct}%` }}
                        />
                      </div>

                      {/* Register Action Button */}
                      {isEnrolled ? (
                        <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4" /> Enrolled in this Section
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRegister(sec)}
                          disabled={isFull || hasClash || missingPrereq || isLoading}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                            isFull || hasClash || missingPrereq
                              ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/40'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                          }`}
                        >
                          {isLoading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              <span>Securing Seat...</span>
                            </>
                          ) : isFull ? (
                            'Section Full (0 Seats)'
                          ) : missingPrereq ? (
                            'Missing Prerequisite'
                          ) : hasClash ? (
                            'Schedule Clash'
                          ) : (
                            'Register Now'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VISUAL TIMETABLE */}
      {activeTab === 'schedule' && (
        <VisualTimetable schedule={timetable.schedule || []} />
      )}

      {/* TAB 3: MY ENROLLED CLASSES & DROP */}
      {activeTab === 'enrolled' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-100">
              Active Registered Courses ({enrolledCount})
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Total Credits: {totalCredits} / {maxCredits}
            </span>
          </div>

          {enrolledCount === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
              <Layers className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h4 className="text-sm font-semibold text-slate-300">No active registrations</h4>
              <p className="text-xs text-slate-500 mt-1">
                Go to the Course Catalog tab to register for courses for Fall 2026.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Course</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Schedule</th>
                    <th className="py-3 px-4">Room</th>
                    <th className="py-3 px-4">Instructor</th>
                    <th className="py-3 px-4">Credits</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {timetable.schedule.map((item) => (
                    <tr key={item.takes_id || `${item.course_id}-${item.section_id}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                        {item.course_id} - {item.sec_code}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-100">{item.title}</td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {item.day} {item.start_time}-{item.end_time}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">{item.classroom}</td>
                      <td className="py-3.5 px-4 text-slate-400">{item.instructor || 'Staff'}</td>
                      <td className="py-3.5 px-4 font-mono">{item.credits}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setDropModalSection(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Drop
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: GRADES & TRANSCRIPT */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          {/* GPA Summary Stat Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cumulative GPA</span>
              <div className="text-3xl font-extrabold text-white mt-1">
                {grades.gpa ? grades.gpa.toFixed(2) : '3.82'}
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Good Academic Standing
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Earned Credits</span>
              <div className="text-3xl font-extrabold text-white mt-1">
                {grades.total_credits_earned || currentUser.tot_cred || 48}
              </div>
              <span className="text-[11px] text-indigo-400 mt-1 inline-block">
                Toward Degree Completion
              </span>
            </div>

            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Major Department</span>
              <div className="text-2xl font-bold text-white mt-1 truncate">
                {currentUser.department || 'Computer Science'}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 inline-block">
                Undergraduate Degree
              </span>
            </div>
          </div>

          {/* Academic History Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Course</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Term</th>
                  <th className="py-3 px-4">Credits</th>
                  <th className="py-3 px-4 text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {(grades.history || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{item.course_id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">{item.title}</td>
                    <td className="py-3.5 px-4 text-slate-400">{item.semester} {item.year}</td>
                    <td className="py-3.5 px-4 font-mono">{item.credits}</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                        item.grade === 'IP'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          : item.grade?.startsWith('A')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      }`}>
                        {item.grade === 'IP' ? 'In Progress' : item.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Dropping a Course */}
      {dropModalSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                Drop {dropModalSection.course_id}?
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Are you sure you want to drop <strong>{dropModalSection.title}</strong>? 
                Your seat will be released immediately for other students. You can re-register if seats are still open.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDropModalSection(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDrop}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all"
              >
                Yes, Drop Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
