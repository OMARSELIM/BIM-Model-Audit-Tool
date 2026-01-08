import React, { useState } from 'react';
import { AuditReport, CategoryResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Icons } from './Icons';

interface Props {
  report: AuditReport;
  onReset: () => void;
}

const COLORS = {
  PASS: '#22c55e',   // green-500
  FAIL: '#ef4444',   // red-500
  WARNING: '#f59e0b', // amber-500
  BG: '#1e293b'      // slate-800
};

export const AuditDashboard: React.FC<Props> = ({ report, onReset }) => {
  const [activeCategory, setActiveCategory] = useState<string>(report.categories[0]?.id || 'levels');

  const summaryData = [
    { name: 'Passed', value: report.summary.passed, color: COLORS.PASS },
    { name: 'Failed', value: report.summary.failed, color: COLORS.FAIL },
    { name: 'Warnings', value: report.summary.warnings, color: COLORS.WARNING },
  ].filter(d => d.value > 0);

  const activeCategoryData = report.categories.find(c => c.id === activeCategory);

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'PASS': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><Icons.Pass className="w-3 h-3 mr-1" /> Pass</span>;
      case 'FAIL': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><Icons.Fail className="w-3 h-3 mr-1" /> Fail</span>;
      case 'WARNING': return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Icons.Warning className="w-3 h-3 mr-1" /> Warning</span>;
      default: return null;
    }
  };

  const getIconForCategory = (id: string) => {
    switch (id.toLowerCase()) {
      case 'levels': return <Icons.Levels className="w-5 h-5" />;
      case 'grids': return <Icons.Grids className="w-5 h-5" />;
      case 'coordinates': return <Icons.Coordinates className="w-5 h-5" />;
      case 'worksets': return <Icons.Worksets className="w-5 h-5" />;
      default: return <Icons.Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Report Results</h1>
          <p className="text-slate-500 text-sm mt-1">Generated on {new Date().toLocaleDateString()} • Overall Score: <span className={`font-bold ${report.summary.overallScore >= 80 ? 'text-green-600' : report.summary.overallScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{report.summary.overallScore}%</span></p>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={onReset}
                className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <Icons.Refresh className="w-4 h-4 mr-2" />
                New Audit
            </button>
            <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <Icons.File className="w-4 h-4 mr-2" />
                Export PDF
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Icons.Chart className="w-5 h-5 mr-2 text-indigo-600" />
            Compliance Overview
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summaryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {summaryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {summaryData.map((d) => (
              <div key={d.name} className="flex items-center text-sm text-slate-600">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: d.color }}></span>
                {d.name}: {d.value}
              </div>
            ))}
          </div>
        </div>

        {/* Category Scores */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 lg:col-span-2">
           <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center">
            <Icons.Check className="w-5 h-5 mr-2 text-indigo-600" />
            Category Performance
          </h3>
          <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.categories} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" width={100} tick={{fontSize: 12}} />
                    <RechartsTooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={32}>
                        {report.categories.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.score >= 80 ? COLORS.PASS : entry.score >= 50 ? COLORS.WARNING : COLORS.FAIL} />
                        ))}
                    </Bar>
                </BarChart>
             </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200">
          <nav className="flex overflow-x-auto">
            {report.categories.map((category) => {
                const isActive = activeCategory === category.id;
                return (
                    <button
                        key={category.id}
                        onClick={() => setActiveCategory(category.id)}
                        className={`
                            whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm flex items-center transition-colors
                            ${isActive 
                                ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }
                        `}
                    >
                        {getIconForCategory(category.name)}
                        <span className="ml-2">{category.name}</span>
                        <span className={`ml-2 text-xs py-0.5 px-2 rounded-full ${isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                            {category.score}%
                        </span>
                    </button>
                );
            })}
          </nav>
        </div>

        <div className="p-6">
            {activeCategoryData && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-slate-900">{activeCategoryData.name} Detailed Audit</h3>
                        {renderStatusBadge(activeCategoryData.status)}
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Item</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actual Value</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Expected (Standard)</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Remarks</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {activeCategoryData.items.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{item.value}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{item.expected}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {renderStatusBadge(item.status)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={item.message}>{item.message}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};