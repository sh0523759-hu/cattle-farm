import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export const DistributionChart = ({ animals = [] }) => {
  const chartData = React.useMemo(() => {
    const counts = { Cow: 0, Buffalo: 0, Calf: 0, Bull: 0 };
    animals.forEach(a => {
      const t = a.type || 'Cow';
      if (counts[t] !== undefined) counts[t]++;
      else counts['Cow']++;
    });

    return [
      { name: 'Cows', value: counts.Cow, color: '#10b981' },
      { name: 'Buffaloes', value: counts.Buffalo, color: '#3b82f6' },
      { name: 'Calves', value: counts.Calf, color: '#8b5cf6' },
      { name: 'Bulls', value: counts.Bull, color: '#f59e0b' }
    ].filter(d => d.value > 0);
  }, [animals]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div className="mb-2">
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Herd Distribution</h3>
        <p className="text-xs text-slate-400 font-medium">Composition by animal type</p>
      </div>

      <div className="h-64 w-full relative flex items-center justify-center">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                formatter={(val) => [`${val} Animals`, 'Head Count']}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-xs text-slate-400">No animal records available</div>
        )}
      </div>
    </div>
  );
};
