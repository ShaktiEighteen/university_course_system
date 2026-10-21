import React, { useState } from 'react';
import { Clock, MapPin, User, Calendar as CalendarIcon, List, Grid3X3 } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const TIME_ROWS = [
  '08:00', '09:00', '10:00', '11:00', '12:00', 
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

const COURSE_COLORS = [
  'from-indigo-600/90 to-blue-600/90 border-indigo-400/50 text-indigo-50',
  'from-emerald-600/90 to-teal-600/90 border-emerald-400/50 text-emerald-50',
  'from-purple-600/90 to-fuchsia-600/90 border-purple-400/50 text-purple-50',
  'from-amber-600/90 to-orange-600/90 border-amber-400/50 text-amber-50',
  'from-cyan-600/90 to-sky-600/90 border-cyan-400/50 text-cyan-50',
  'from-rose-600/90 to-pink-600/90 border-rose-400/50 text-rose-50',
];

export default function VisualTimetable({ schedule = [] }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Map each unique course_id to a deterministic color
  const colorMap = {};
  let colorIdx = 0;
  schedule.forEach((item) => {
    if (!colorMap[item.course_id]) {
      colorMap[item.course_id] = COURSE_COLORS[colorIdx % COURSE_COLORS.length];
      colorIdx++;
    }
  });

  return (
    <div className="space-y-4">
      {/* View Switcher Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-indigo-400" />
            Weekly Class Schedule
          </h3>
          <p className="text-xs text-slate-400">
            {schedule.length} scheduled {schedule.length === 1 ? 'class' : 'classes'} this semester
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" /> Visual Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" /> List Agenda
          </button>
        </div>
      </div>

      {schedule.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40">
          <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No classes enrolled yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Browse the course catalog tab and enroll in your required subjects to automatically build your weekly visual timetable!
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4">
          <div className="min-w-[680px]">
            {/* Days Header */}
            <div className="grid grid-cols-6 gap-2 mb-2 pb-2 border-b border-slate-800 text-center">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-1">Time</div>
              {DAYS.map((day) => (
                <div key={day} className="text-xs font-bold text-slate-300 uppercase tracking-wider py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            <div className="space-y-2">
              {TIME_ROWS.map((hourStr) => {
                const hourNum = parseInt(hourStr.split(':')[0], 10);

                return (
                  <div key={hourStr} className="grid grid-cols-6 gap-2 min-h-[58px] items-stretch">
                    {/* Time Label */}
                    <div className="text-[11px] font-mono text-slate-500 pt-1 text-center">
                      {hourStr}
                    </div>

                    {/* Day Columns */}
                    {DAYS.map((day) => {
                      // Find any course meeting on this day during this hour block
                      const matchingCourses = schedule.filter((item) => {
                        if (!item.day || !item.day.includes(day)) return false;
                        const startH = parseInt(item.start_time.split(':')[0], 10);
                        return startH === hourNum;
                      });

                      return (
                        <div
                          key={day}
                          className="rounded-xl border border-slate-800/50 bg-slate-950/40 p-1 flex flex-col justify-center relative min-h-[56px] hover:border-slate-700/60 transition-colors"
                        >
                          {matchingCourses.map((c) => (
                            <div
                              key={c.takes_id || `${c.course_id}-${c.section_id}`}
                              className={`p-2 rounded-lg bg-gradient-to-br ${colorMap[c.course_id] || COURSE_COLORS[0]} border shadow-md flex flex-col justify-between h-full`}
                            >
                              <div className="flex items-center justify-between leading-tight">
                                <span className="font-bold text-[11px] tracking-tight">
                                  {c.course_id}
                                </span>
                                <span className="text-[10px] opacity-80 font-mono">
                                  Sec {c.sec_code}
                                </span>
                              </div>
                              <div className="text-[10px] font-medium truncate mt-0.5" title={c.title}>
                                {c.title}
                              </div>
                              <div className="flex items-center justify-between text-[9px] mt-1 pt-1 border-t border-white/20 opacity-90">
                                <span className="flex items-center gap-0.5 truncate">
                                  <MapPin className="w-2.5 h-2.5" /> {c.classroom}
                                </span>
                                <span>{c.start_time}-{c.end_time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* List Agenda View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {schedule.map((item) => (
            <div
              key={item.takes_id || `${item.course_id}-${item.section_id}`}
              className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                    {item.course_id} • Sec {item.sec_code}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {item.credits} Credits
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-100">{item.title}</h4>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{item.day} {item.start_time} - {item.end_time}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="truncate">{item.classroom}</span>
                </div>
                <div className="flex items-center gap-1.5 col-span-2 text-slate-300">
                  <User className="w-3.5 h-3.5 text-purple-400" />
                  <span>Instructor: {item.instructor || 'Staff'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
