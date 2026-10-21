import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  Award,
  ChevronRight,
  X
} from 'lucide-react';
import { api } from '../api';

const VALID_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

export default function InstructorDashboard({ currentUser, showToast }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState(null);
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [gradeSubmittingId, setGradeSubmittingId] = useState(null);

  const loadInstructorSections = async () => {
    try {
      setLoading(true);
      const res = await api.getInstructorSections();
      if (res.success) {
        setSections(res.sections || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load assigned teaching sections.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInstructorSections();
  }, []);

  const handleOpenRoster = async (section) => {
    setSelectedSection(section);
    setRosterLoading(true);
    try {
      const res = await api.getInstructorRoster(section.id || section.section_id);
      if (res.success) {
        setRoster(res.roster || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load class roster.', 'error');
    } finally {
      setRosterLoading(false);
    }
  };

  const handleUpdateGrade = async (studentId, newGrade) => {
    if (!selectedSection) return;
    setGradeSubmittingId(studentId);
    try {
      const res = await api.updateGrade(studentId, selectedSection.id || selectedSection.section_id, newGrade);
      if (res.success) {
        showToast(`Grade updated to "${newGrade}" for student ${studentId}`, 'success');
        // Update local roster state
        setRoster(roster.map(r => r.student_id === studentId ? { ...r, grade: newGrade } : r));
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit grade.', 'error');
    } finally {
      setGradeSubmittingId(null);
    }
  };

  const totalEnrolled = sections.reduce((acc, s) => acc + (s.enrolled_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Faculty Greeting Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-950/60 via-slate-900/80 to-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Faculty Academic Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome, Professor {currentUser.name || 'Alan Turing'}! 👨‍🏫
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Review your assigned lecture sections, inspect real-time student enrollment rosters, and submit official semester grades.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[120px]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Classes</span>
            <span className="text-2xl font-bold text-blue-400 font-mono">{sections.length}</span>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center min-w-[120px]">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Total Students</span>
            <span className="text-2xl font-bold text-emerald-400 font-mono">{totalEnrolled}</span>
          </div>
        </div>
      </div>

      {/* Assigned Sections List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" />
          My Assigned Teaching Sections ({sections.length})
        </h2>

        {sections.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
            <Users className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No teaching sections assigned</h3>
            <p className="text-xs text-slate-500 mt-1">Contact the university registrar office to assign sections.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sections.map((sec) => (
              <div
                key={sec.id || `${sec.course_id}-${sec.section_id}`}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between hover:border-blue-500/40 transition-all shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {sec.course_id} • Sec {sec.section_id}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {sec.semester} {sec.year}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-3">{sec.title}</h3>

                  <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-blue-400" />
                      <span>{sec.time_slot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{sec.classroom}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{sec.enrolled_count} / {sec.capacity} Enrolled Students</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenRoster(sec)}
                  className="w-full mt-3 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                >
                  <span>View Roster & Grade Students</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Roster & Grading Modal */}
      {selectedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-3xl w-full max-h-[85vh] rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-400">
                  {selectedSection.course_id} - Section {selectedSection.section_id}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Class Roster & Official Grade Submission
                </h3>
              </div>
              <button
                onClick={() => setSelectedSection(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {rosterLoading ? (
                <div className="text-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs text-slate-400">Loading student roster...</span>
                </div>
              ) : roster.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No students currently registered in this section.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Student ID</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Department</th>
                        <th className="py-3 px-4">Current Grade</th>
                        <th className="py-3 px-4 text-right">Assign Grade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {roster.map((st) => (
                        <tr key={st.student_id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-blue-400">{st.student_id}</td>
                          <td className="py-3.5 px-4 font-semibold text-white">{st.name}</td>
                          <td className="py-3.5 px-4 text-slate-400">{st.department || 'Undergraduate'}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                              st.grade === 'IP' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {st.grade === 'IP' ? 'In Progress' : st.grade}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <select
                              value={st.grade || 'IP'}
                              disabled={gradeSubmittingId === st.student_id}
                              onChange={(e) => handleUpdateGrade(st.student_id, e.target.value)}
                              className="py-1 px-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            >
                              <option value="IP">IP (In Progress)</option>
                              {VALID_GRADES.map((g) => (
                                <option key={g} value={g}>{g}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>{roster.length} students enrolled in this section</span>
              <button
                onClick={() => setSelectedSection(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
