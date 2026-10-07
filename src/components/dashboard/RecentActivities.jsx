import React from 'react';
import { Milk, Stethoscope, Syringe, Wheat, TrendingDown, PlusCircle } from 'lucide-react';
import { formatCurrency, formatUnit } from '../../utils/formatters';

export const RecentActivities = ({ animals = [], milkRecords = [], healthRecords = [], expenses = [] }) => {
  const activities = React.useMemo(() => {
    const list = [];

    milkRecords.slice(0, 3).forEach(m => {
      list.push({
        id: `act-m-${m.id}`,
        title: 'Milk Logged',
        desc: `${m.totalQty} ${formatUnit('L', 'milk')} logged for ${m.animalTag}`,
        time: m.date,
        icon: Milk,
        iconBg: 'bg-emerald-100 text-emerald-700'
      });
    });

    healthRecords.slice(0, 2).forEach(h => {
      list.push({
        id: `act-h-${h.id}`,
        title: 'Vet Checkup',
        desc: `${h.problem} for ${h.animalTag}`,
        time: h.date,
        icon: Stethoscope,
        iconBg: 'bg-rose-100 text-rose-700'
      });
    });

    expenses.slice(0, 2).forEach(e => {
      list.push({
        id: `act-e-${e.id}`,
        title: 'Expense Recorded',
        desc: `${e.category}: ${formatCurrency(e.amount)}`,
        time: e.date,
        icon: TrendingDown,
        iconBg: 'bg-amber-100 text-amber-700'
      });
    });

    return list.slice(0, 6);
  }, [milkRecords, healthRecords, expenses]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
      <h3 className="text-base font-extrabold text-slate-800 tracking-tight mb-4">Recent Farm Activity</h3>
      <div className="space-y-4">
        {activities.map(act => {
          const Icon = act.icon;
          return (
            <div key={act.id} className="flex items-start space-x-3 text-xs">
              <div className={`p-2 rounded-xl flex-shrink-0 ${act.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{act.title}</span>
                  <span className="text-[10px] font-semibold text-slate-400">{act.time}</span>
                </div>
                <p className="text-slate-500 mt-0.5 font-medium">{act.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
