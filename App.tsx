import React, { useState, useCallback } from 'react';
import { AuditInput } from './components/AuditInput';
import { AuditDashboard } from './components/AuditDashboard';
import { auditBimModel } from './services/geminiService';
import { AuditReport, ViewState } from './types';
import { Icons } from './components/Icons';

function App() {
  const [modelData, setModelData] = useState<string>('');
  const [standards, setStandards] = useState<string>('');
  const [report, setReport] = useState<AuditReport | null>(null);
  const [viewState, setViewState] = useState<ViewState>(ViewState.INPUT);
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = useCallback(async () => {
    if (!modelData || !standards) return;

    setViewState(ViewState.ANALYZING);
    setError(null);

    try {
      const result = await auditBimModel(modelData, standards);
      setReport(result);
      setViewState(ViewState.RESULTS);
    } catch (err) {
      console.error(err);
      setError("Failed to audit the model. Please check your internet connection or API key.");
      setViewState(ViewState.INPUT);
    }
  }, [modelData, standards]);

  const handleReset = () => {
    setReport(null);
    setViewState(ViewState.INPUT);
    // Optionally clear data, but usually users want to tweak input
    // setModelData('');
    // setStandards('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Icons.Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-slate-900">BIM<span className="text-indigo-600">Audit</span></span>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Powered by Gemini AI
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col">
        {error && (
            <div className="max-w-4xl mx-auto w-full mt-6 px-4">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
                    <Icons.Fail className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                    <div>
                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        )}

        {viewState === ViewState.INPUT || viewState === ViewState.ANALYZING ? (
          <AuditInput 
            modelData={modelData}
            setModelData={setModelData}
            standards={standards}
            setStandards={setStandards}
            onRunAudit={handleRunAudit}
            isAnalyzing={viewState === ViewState.ANALYZING}
          />
        ) : (
          report && <AuditDashboard report={report} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} BIM Audit Tool. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-indigo-600">Privacy</a>
            <a href="#" className="hover:text-indigo-600">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;