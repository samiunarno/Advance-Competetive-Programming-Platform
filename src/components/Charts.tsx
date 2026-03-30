import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import { useLanguage } from '../context/LanguageContext';

const COLORS = ['#10b981', '#f59e0b', '#f43f5e'];

export function SubmissionChart() {
  const { t } = useLanguage();

  const data = [
    { name: t('charts.mon'), submissions: 400, solved: 240 },
    { name: t('charts.tue'), submissions: 300, solved: 139 },
    { name: t('charts.wed'), submissions: 200, solved: 980 },
    { name: t('charts.thu'), submissions: 278, solved: 390 },
    { name: t('charts.fri'), submissions: 189, solved: 480 },
    { name: t('charts.sat'), submissions: 239, solved: 380 },
    { name: t('charts.sun'), submissions: 349, solved: 430 },
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="name" 
            stroke="#52525b" 
            tick={{ fill: '#71717a', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#52525b" 
            tick={{ fill: '#71717a', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
            itemStyle={{ color: '#e4e4e7' }}
            cursor={{ stroke: '#3f3f46' }}
          />
          <Area 
            type="monotone" 
            dataKey="submissions" 
            stroke="#a1a1aa" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorSubs)" 
          />
          <Area 
            type="monotone" 
            dataKey="solved" 
            stroke="#10b981" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorSolved)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DifficultyChart() {
  const { t } = useLanguage();

  const pieData = [
    { name: t('charts.easy'), value: 400 },
    { name: t('charts.medium'), value: 300 },
    { name: t('charts.hard'), value: 300 },
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
            itemStyle={{ color: '#e4e4e7' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
