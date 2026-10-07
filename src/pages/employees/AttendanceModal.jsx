import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { useFarm } from '../../context/FarmContext';
import { Badge } from '../../components/common/Badge';

export const AttendanceModal = ({ isOpen, onClose }) => {
  const { employees, updateEmployee, showToast } = useFarm();
  const [attendanceMap, setAttendanceMap] = useState(() => {
    const map = {};
    employees.forEach(emp => {
      map[emp.id] = emp.attendanceToday || 'Present';
    });
    return map;
  });

  const handleStatusChange = (id, status) => {
    setAttendanceMap(prev => ({ ...prev, [id]: status }));
  };

  const handleSave = () => {
    employees.forEach(emp => {
      if (attendanceMap[emp.id]) {
        updateEmployee(emp.id, { attendanceToday: attendanceMap[emp.id] });
      }
    });
    showToast(`Daily attendance marked for ${employees.length} employees!`, 'success');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Staff Attendance Log"
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        <p className="text-xs text-slate-500 font-medium">
          Mark today's attendance for farm workers, milkers, and herdsmen ({new Date().toLocaleDateString()})
        </p>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {employees.map(emp => (
            <div key={emp.id} className="py-3 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800">{emp.name}</h4>
                <p className="text-[11px] text-slate-400 font-medium">{emp.designation}</p>
              </div>

              <div className="flex items-center space-x-2">
                {['Present', 'Absent', 'Leave'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleStatusChange(emp.id, st)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                      (attendanceMap[emp.id] || emp.attendanceToday) === st
                        ? st === 'Present'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : st === 'Absent'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl shadow-xs"
          >
            Save Attendance
          </button>
        </div>
      </div>
    </Modal>
  );
};
