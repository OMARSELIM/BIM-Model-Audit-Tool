import React, { useState, useEffect } from 'react';
import { AuditReport, CategoryResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Icons } from './Icons';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [searchQuery, setSearchQuery] = useState('');

  // Reset search query when switching categories
  useEffect(() => {
    setSearchQuery('');
  }, [activeCategory]);

  const summaryData = [
    { name: 'Passed', value: report.summary.passed, color: COLORS.PASS },
    { name: 'Failed', value: report.summary.failed, color: COLORS.FAIL },
    { name: 'Warnings', value: report.summary.warnings, color: COLORS.WARNING },
  ].filter(d => d.value > 0);

  const activeCategoryData = report.categories.find(c => c.id === activeCategory);

  // Filter items based on search query
  const filteredItems = activeCategoryData?.items.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.message.toLowerCase().includes(query) ||
      item.value.toLowerCase().includes(query) ||
      item.expected.toLowerCase().includes(query)
    );
  }) || [];

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

  const handleExportCSV = () => {
    if (!activeCategoryData) return;

    // Export current filtered items or all items? Usually all items of category, 
    // but filtered is what user sees. Let's export what is visible if search is active.
    const itemsToExport = searchQuery ? filteredItems : activeCategoryData.items;

    const headers = ['Item', 'Actual Value', 'Expected', 'Status', 'Remarks'];
    const rows = itemsToExport.map(item => [
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.value.replace(/"/g, '""')}"`,
      `"${item.expected.replace(/"/g, '""')}"`,
      `"${item.status}"`,
      `"${item.message.replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BIM_Audit_${activeCategoryData.name}${searchQuery ? '_filtered' : ''}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate 800
    doc.text("BIM Model Audit Report", 14, 20);

    // Meta Info
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // Slate 500
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
    
    // Summary Box
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.roundedRect(14, 35, pageWidth - 28, 25, 2, 2, 'FD');

    doc.setFontSize(12);
    doc.setTextColor(71, 85, 105);
    doc.text(`Overall Score: ${report.summary.overallScore}%`, 20, 47);
    doc.text(`Total Checks: ${report.summary.totalChecks}`, 20, 54);
    
    doc.text(`Passed: ${report.summary.passed}`, 80, 47);
    doc.setTextColor(34, 197, 94); // Green
    doc.text("●", 75, 47);
    
    doc.setTextColor(71, 85, 105);
    doc.text(`Failed: ${report.summary.failed}`, 80, 54);
    doc.setTextColor(239, 68, 68); // Red
    doc.text("●", 75, 54);

    doc.setTextColor(71, 85, 105);
    doc.text(`Warnings: ${report.summary.warnings}`, 140, 47);
    doc.setTextColor(245, 158, 11); // Amber
    doc.text("●", 135, 47);

    // Categories
    let currentY = 70;

    report.categories.forEach((category) => {
        // Check for page break
        if (currentY > 250) {
            doc.addPage();
            currentY = 20;
        }

        // Category Header
        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42); // Slate 900
        doc.text(`${category.name} (${category.score}%)`, 14, currentY);
        
        // Items Table
        const tableBody = category.items.map(item => [
            item.name,
            item.value,
            item.expected,
            item.status,
            item.message
        ]);

        autoTable(doc, {
            startY: currentY + 5,
            head: [['Item', 'Actual', 'Expected', 'Status', 'Remarks']],
            body: tableBody,
            theme: 'grid',
            headStyles: { 
                fillColor: [79, 70, 229], // Indigo 600
                textColor: 255,
                fontSize: 9,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 8,
                cellPadding: 3,
                overflow: 'linebreak'
            },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 35 },
                2: { cellWidth: 35 },
                3: { cellWidth: 20, fontStyle: 'bold' },
                4: { cellWidth: 'auto' }
            },
            didParseCell: (data) => {
                // Color code status column
                if (data.section === 'body' && data.column.index === 3) {
                    const status = data.cell.raw;
                    if (status === 'PASS') data.cell.styles.textColor = [34, 197, 94];
                    else if (status === 'FAIL') data.cell.styles.textColor = [239, 68, 68];
                    else if (status === 'WARNING') data.cell.styles.textColor = [245, 158, 11];
                }
            }
        });

        // Update Y for next category
        currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`BIM_Audit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
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
            <button 
                onClick={handleExportPDF}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
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
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-lg font-medium text-slate-900">{activeCategoryData.name} Detailed Audit</h3>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                             {/* Search Input */}
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Icons.Search className="h-4 w-4 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="block w-full sm:w-64 pl-10 pr-3 py-1.5 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleExportCSV}
                                    className="inline-flex items-center justify-center px-3 py-1.5 border border-slate-300 shadow-sm text-xs font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                >
                                    <Icons.Download className="w-4 h-4 mr-2 text-slate-500" />
                                    Export CSV
                                </button>
                                {renderStatusBadge(activeCategoryData.status)}
                            </div>
                        </div>
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
                                {filteredItems.length > 0 ? (
                                    filteredItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{item.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{item.value}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{item.expected}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {renderStatusBadge(item.status)}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate" title={item.message}>{item.message}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                                            No items found matching "{searchQuery}"
                                        </td>
                                    </tr>
                                )}
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