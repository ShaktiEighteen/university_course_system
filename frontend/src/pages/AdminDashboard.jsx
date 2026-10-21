import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  BookOpen, 
  Calendar, 
  Users, 
  Plus, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  MapPin,
  Sparkles,
  X
} from 'lucide-react';
import { api } from '../api';

export default function AdminDashboard({ currentUser, showToast }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'departments' | 'courses' | 'sections'
  const [overview, setOverview] = useState({
    counts: { departments: 5, courses: 18, instructors: 10, students: 32, sections: 22 },
    recent_sections: [],
    recent_students: [],
  });
  const [helpers, setHelpers] = useState({
    departments: [],
    courses: [],
    classrooms: [],
    time_slots: [],
    instructors: [],
  });
  const [loading, setLoading] = useState(true);

  // Modals
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);

  // Form states
  const [deptForm, setDeptForm] = useState({ dept_name: '', building: '', budget: '' });
  const [courseForm, setCourseForm] = useState({ course_id: '', title: '', dept_name: '', credits: 3 });
  const [sectionForm, setSectionForm] = useState({
    course_id: '',
    section_id: '01',
    semester: 'Fall',
    year: 2026,
    classroom_id: '',
    time_slot_id: '',
    instructor_id: '',
    capacity: 30,
  });

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [ovData, hpData, catData] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminHelpers(),
        api.getCatalog(),
      ]);

      if (ovData.success) {
        setOverview({
          ...ovData,
          recent_sections: catData.sections || [],
        });
      }
      if (hpData.success) {
        setHelpers(hpData);
        // Pre-fill initial form select values
        if (hpData.departments?.length > 0) {
          setCourseForm(c => ({ ...c, dept_name: hpData.departments[0].dept_name }));
        }
        if (hpData.courses?.length > 0 && hpData.classrooms?.length > 0 && hpData.time_slots?.length > 0) {
          setSectionForm(s => ({
            ...s,
            course_id: hpData.courses[0].course_id,
            classroom_id: `${hpData.classrooms[0].building}-${hpData.classrooms[0].room_number}`,
            time_slot_id: hpData.time_slots[0].time_slot_id,
          }));
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to load admin console.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createDepartment(deptForm);
      if (res.success) {
        showToast(`Department "${deptForm.dept_name}" created successfully!`, 'success');
        setShowDeptModal(false);
        setDeptForm({ dept_name: '', building: '', budget: '' });
        await loadAdminData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create department', 'error');
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createCourse(courseForm);
      if (res.success) {
        showToast(`Course "${courseForm.course_id} - ${courseForm.title}" added to catalog!`, 'success');
        setShowCourseModal(false);
        setCourseForm({ course_id: '', title: '', dept_name: helpers.departments[0]?.dept_name || '', credits: 3 });
        await loadAdminData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to create course', 'error');
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    try {
      const res = await api.createSection(sectionForm);
      if (res.success) {
        showToast(`Section "${sectionForm.course_id} (${sectionForm.section_id})" scheduled!`, 'success');
        setShowSectionModal(false);
        await loadAdminData();
      }
    } catch (err) {
      showToast(err.message || 'Failed to schedule section. Check room/instructor clash.', 'error');
    }
  };

  const stats = overview.stats || overview.counts || {};
  const counts = {
    departments: stats.total_departments || stats.departments || 5,
    courses: stats.total_courses || stats.courses || 18,
    sections: stats.total_sections || stats.sections || 22,
    students: stats.total_students || stats.students || 32,
    instructors: stats.total_instructors || stats.instructors || 10,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-purple-950/60 via-slate-900/80 to-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-semibold text-purple-400 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> University Registrar Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Institutional Master Console
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Provision academic departments, govern curriculum catalogs, schedule term sections, and supervise institutional operations.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowDeptModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" /> New Dept
          </button>
          <button
            onClick={() => setShowCourseModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" /> New Course
          </button>
          <button
            onClick={() => setShowSectionModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Schedule Section
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 text-center">
          <Building2 className="w-5 h-5 text-teal-400 mx-auto mb-1" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Departments</span>
          <span className="text-2xl font-bold text-white font-mono">{counts.departments || 5}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 text-center">
          <BookOpen className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Active Courses</span>
          <span className="text-2xl font-bold text-white font-mono">{counts.courses || 18}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 text-center">
          <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-1" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Term Sections</span>
          <span className="text-2xl font-bold text-white font-mono">{counts.sections || 22}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 text-center">
          <Users className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Students</span>
          <span className="text-2xl font-bold text-white font-mono">{counts.students || 32}</span>
        </div>

        <div className="p-4 rounded-2xl border border-slate-800 bg-slate-900/60 text-center">
          <Users className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Faculty Instructors</span>
          <span className="text-2xl font-bold text-white font-mono">{counts.instructors || 10}</span>
        </div>
      </div>

      {/* Recent Scheduled Sections Table */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-purple-400" />
          Scheduled Sections for Fall 2026
        </h2>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Classroom</th>
                <th className="py-3 px-4">Schedule</th>
                <th className="py-3 px-4">Instructor</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4 text-right">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {(overview.recent_sections || []).map((sec) => (
                <tr key={sec.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-purple-400">
                    {sec.course_id} ({sec.section_id})
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-white">{sec.title}</td>
                  <td className="py-3.5 px-4 text-slate-400">{sec.classroom}</td>
                  <td className="py-3.5 px-4 text-slate-300">{sec.time_slot}</td>
                  <td className="py-3.5 px-4 text-slate-400">{sec.instructor || 'Unassigned'}</td>
                  <td className="py-3.5 px-4 font-mono">{sec.capacity}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                    {sec.enrolled_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: ADD DEPARTMENT */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-400" /> Add Academic Department
              </h3>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateDept} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Data Science"
                  value={deptForm.dept_name}
                  onChange={(e) => setDeptForm({ ...deptForm, dept_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Building</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Turing Hall"
                  value={deptForm.building}
                  onChange={(e) => setDeptForm({ ...deptForm, building: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Budget ($)</label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 500000"
                  value={deptForm.budget}
                  onChange={(e) => setDeptForm({ ...deptForm, budget: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold shadow-lg shadow-teal-600/30"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD COURSE */}
      {showCourseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" /> Add Course to Curriculum
              </h3>
              <button onClick={() => setShowCourseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCourse} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Course Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CS305"
                  value={courseForm.course_id}
                  onChange={(e) => setCourseForm({ ...courseForm, course_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Database Systems"
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Department</label>
                  <select
                    value={courseForm.dept_name}
                    onChange={(e) => setCourseForm({ ...courseForm, dept_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {helpers.departments.map((d) => (
                      <option key={d.dept_name} value={d.dept_name}>{d.dept_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Credits (1-6)</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    required
                    value={courseForm.credits}
                    onChange={(e) => setCourseForm({ ...courseForm, credits: parseInt(e.target.value) || 3 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCourseModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Add Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SCHEDULE SECTION */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" /> Schedule Term Section
              </h3>
              <button onClick={() => setShowSectionModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSection} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Course</label>
                <select
                  value={sectionForm.course_id}
                  onChange={(e) => setSectionForm({ ...sectionForm, course_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {helpers.courses.map((c) => (
                    <option key={c.course_id} value={c.course_id}>{c.course_id} - {c.title}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Section ID</label>
                  <input
                    type="text"
                    required
                    value={sectionForm.section_id}
                    onChange={(e) => setSectionForm({ ...sectionForm, section_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={sectionForm.capacity}
                    onChange={(e) => setSectionForm({ ...sectionForm, capacity: parseInt(e.target.value) || 30 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Classroom</label>
                <select
                  value={sectionForm.classroom_id}
                  onChange={(e) => setSectionForm({ ...sectionForm, classroom_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {helpers.classrooms.map((cr) => (
                    <option key={`${cr.building}-${cr.room_number}`} value={`${cr.building}-${cr.room_number}`}>
                      {cr.building} {cr.room_number} (Cap: {cr.capacity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Time Slot</label>
                <select
                  value={sectionForm.time_slot_id}
                  onChange={(e) => setSectionForm({ ...sectionForm, time_slot_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {helpers.time_slots.map((ts) => (
                    <option key={ts.time_slot_id} value={ts.time_slot_id}>
                      {ts.time_slot_id} ({ts.day} {ts.start_time} - {ts.end_time})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Instructor</label>
                <select
                  value={sectionForm.instructor_id}
                  onChange={(e) => setSectionForm({ ...sectionForm, instructor_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Unassigned</option>
                  {helpers.instructors.map((ins) => (
                    <option key={ins.instructor_id} value={ins.instructor_id}>
                      {ins.name} ({ins.dept_name})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold shadow-lg shadow-purple-600/30"
                >
                  Schedule Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
