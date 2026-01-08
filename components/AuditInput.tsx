import React, { useState } from 'react';
import { Icons } from './Icons';

interface Props {
  modelData: string;
  setModelData: (data: string) => void;
  standards: string;
  setStandards: (data: string) => void;
  onRunAudit: () => void;
  isAnalyzing: boolean;
}

const DEMO_MODEL_DATA = `
LEVELS:
- L01 - Ground Floor: 0.00m
- L02 - First Floor: 4.00m
- L03 - Roof: 7.50m (Wrong naming?)

GRIDS:
- 1, 2, 3, 4 (Spacing 6m)
- A, B, C (Spacing 5m)

COORDINATES:
- Survey Point: (100.5, 200.5, 0.0)
- Project Base Point: (0,0,0) Unclipped
- Angle to True North: 15 deg

WORKSETS:
- Workset1 (Default)
- ARC_Shell
- STR_Concrete
- MEP_Hvac
- Links
`;

const DEMO_STANDARDS = `
1. LEVELS:
   - Must be prefixed with "L" followed by two digits (e.g. L01, L02).
   - Must include description (e.g. " - Ground Floor").
   - Roof level should be at 8.00m minimum.

2. GRIDS:
   - Alphanumeric for horizontal, Numeric for vertical.
   - Must be pinned.

3. COORDINATES:
   - Survey Point must match site survey (100.5, 200.5, 10.0).
   - Angle to True North should be 14.5 degrees.

4. WORKSETS:
   - No default "Workset1" allowed.
   - Must use discipline prefix: ARC_, STR_, MEP_, INT_.
   - "Links" workset is required for linked models.
`;

export const AuditInput: React.FC<Props> = ({ 
  modelData, 
  setModelData, 
  standards, 
  setStandards,
  onRunAudit,
  isAnalyzing
}) => {
  const [activeTab, setActiveTab] = useState<'model' | 'standards'>('model');

  const loadDemoData = () => {
    setModelData(DEMO_MODEL_DATA);
    setStandards(DEMO_STANDARDS);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-xl mb-4">
                <Icons.Activity className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">BIM Model Audit Tool</h1>
            <p className="mt-3 text-lg text-slate-600 max-w-2xl mx-auto">
                Validate your Levels, Grids, Coordinates, and Worksets against project standards instantly using AI.
            </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="flex border-b border-slate-200 bg-slate-50/50">
                <button 
                    onClick={() => setActiveTab('model')}
                    className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'model' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Icons.Layers className="w-4 h-4" />
                        Model Data Input
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab('standards')}
                    className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'standards' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Icons.File className="w-4 h-4" />
                        Project Standards (BEP)
                    </div>
                </button>
            </div>

            <div className="p-6 relative">
                 {/* Demo Button - Absolute Top Right */}
                 <button 
                    onClick={loadDemoData}
                    className="absolute top-4 right-4 text-xs font-medium text-indigo-600 hover:text-indigo-800 underline z-10"
                >
                    Load Demo Data
                </button>

                {activeTab === 'model' && (
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-700">
                            Paste Model Data (Exported List/CSV/JSON)
                        </label>
                        <textarea
                            value={modelData}
                            onChange={(e) => setModelData(e.target.value)}
                            placeholder="e.g. Level names, Grid coordinates, Workset list..."
                            className="w-full h-80 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm resize-none"
                        />
                         <p className="text-xs text-slate-500">
                            Tip: You can paste a simple text list of your elements.
                        </p>
                    </div>
                )}

                {activeTab === 'standards' && (
                     <div className="space-y-4">
                        <label className="block text-sm font-medium text-slate-700">
                            Paste Project Standards / BEP Requirements
                        </label>
                        <textarea
                            value={standards}
                            onChange={(e) => setStandards(e.target.value)}
                            placeholder="e.g. 1. Naming Convention: ARC_..., 2. Levels must match Structural..."
                            className="w-full h-80 p-4 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm resize-none"
                        />
                        <p className="text-xs text-slate-500">
                            Tip: Describe the rules for Levels, Grids, Coordinates, and Worksets.
                        </p>
                    </div>
                )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-500 flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${modelData && standards ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                    {modelData && standards ? 'Ready to Audit' : 'Input Data & Standards to proceed'}
                </div>
                <button
                    onClick={onRunAudit}
                    disabled={isAnalyzing || !modelData || !standards}
                    className={`
                        flex items-center px-6 py-3 rounded-lg text-white font-medium shadow-sm transition-all
                        ${isAnalyzing || !modelData || !standards 
                            ? 'bg-slate-400 cursor-not-allowed' 
                            : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:transform active:scale-95'
                        }
                    `}
                >
                    {isAnalyzing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Auditing Model...
                        </>
                    ) : (
                        <>
                            Run Audit
                            <Icons.ArrowRight className="w-5 h-5 ml-2" />
                        </>
                    )}
                </button>
            </div>
        </div>
    </div>
  );
};