import React from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler,
  ArcElement,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';
import { motion } from 'motion/react';
import { Sparkles, TrendingUp, Clock, Target, BarChart3 } from 'lucide-react';

import { AppState } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: '#12121a',
      titleFont: { family: 'Syne', size: 14 },
      bodyFont: { family: 'DM Sans', size: 12 },
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      padding: 12,
      displayColors: false,
    },
    crosshair: {
      color: '#00ff88',
      width: 1
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6b7280', font: { family: 'DM Sans' } }
    },
    y: {
      grid: { color: 'rgba(255, 255, 255, 0.05)' },
      ticks: { color: '#6b7280', font: { family: 'DM Sans' } }
    }
  }
};

const crosshairPlugin = {
  id: 'crosshair',
  afterInit: (chart: any) => {
    chart.crosshair = {
      x: 0,
      draw: false
    };
  },
  afterEvent: (chart: any, args: any) => {
    const { event } = args;
    if (event.type === 'mousemove') {
      chart.crosshair.x = event.x;
      chart.crosshair.draw = true;
    } else if (event.type === 'mouseout') {
      chart.crosshair.draw = false;
    }
    chart.draw();
  },
  afterDatasetsDraw: (chart: any, args: any, options: any) => {
    const { ctx, chartArea: { top, bottom, left, right } } = chart;
    const { x, draw } = chart.crosshair;
    
    if (!draw || x < left || x > right) return;
    
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = options.width || 1;
    ctx.strokeStyle = options.color || '#00ff88';
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.restore();
  }
};

export const MissionControl: React.FC = () => {
  const productivityData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Productivity Score',
        data: [65, 78, 82, 70, 90, 85, 95],
        borderColor: '#00ff88',
        backgroundColor: 'rgba(0, 255, 136, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00ff88',
        pointBorderColor: '#0a0a0f',
        pointBorderWidth: 2,
        pointRadius: 4,
      }
    ]
  };

  const subjectData = {
    labels: ['Quant', 'Reasoning', 'English', 'GK', 'Mock Tests'],
    datasets: [
      {
        data: [35, 25, 15, 10, 15],
        backgroundColor: [
          '#00ff88',
          '#00d4ff',
          '#a855f7',
          '#ff6b35',
          '#ff006e'
        ],
        borderWidth: 0,
        hoverOffset: 10
      }
    ]
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-syne flex items-center gap-3">
          <BarChart3 className="text-neon-green" /> MISSION CONTROL
        </h2>
        <div className="glass-card px-4 py-2 flex items-center gap-2 text-neon-cyan">
          <Sparkles size={16} /> PERFORMANCE INSIGHT: You study best between 9-11 AM
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Productivity Chart */}
        <div className="lg:col-span-2 glass-card p-6 neon-border-green h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-syne text-lg">WEEKLY PERFORMANCE</h3>
            <div className="flex gap-4 text-xs font-bold">
              <span className="flex items-center gap-1 text-neon-green"><TrendingUp size={12} /> +12% vs last week</span>
            </div>
          </div>
          <div className="h-[300px]">
            <Line data={productivityData} options={chartOptions} plugins={[crosshairPlugin]} />
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="glass-card p-6 neon-border-cyan h-[400px]">
          <h3 className="font-syne text-lg mb-6 text-center">TIME DISTRIBUTION</h3>
          <div className="h-[250px] relative">
            <Doughnut data={subjectData} options={{ ...chartOptions, cutout: '70%' }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-syne font-bold">42h</span>
              <span className="text-xs text-text-muted uppercase">Total Study</span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {subjectData.labels.map((label, i) => (
              <div key={label} className="flex items-center gap-2 text-[10px] font-bold">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subjectData.datasets[0].backgroundColor[i] }} />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-neon-purple/10 rounded-xl flex items-center justify-center text-neon-purple shadow-glow-purple">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-xs text-text-muted font-bold uppercase">Avg. Focus Time</p>
              <p className="text-2xl font-syne">4h 22m</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-neon-cyan/10 rounded-xl flex items-center justify-center text-neon-cyan shadow-glow-cyan">
              <Target size={24} />
            </div>
            <div>
              <p className="text-xs text-text-muted font-bold uppercase">Tasks Completed</p>
              <p className="text-2xl font-syne">142</p>
            </div>
          </div>
          <div className="glass-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-neon-green/10 rounded-xl flex items-center justify-center text-neon-green shadow-glow-green">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs text-text-muted font-bold uppercase">Productivity Rank</p>
              <p className="text-2xl font-syne">#1,245</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
