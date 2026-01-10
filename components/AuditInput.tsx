import React, { useState, useEffect, useRef } from 'react';
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
  const [validationMessages, setValidationMessages] = useState<{type: 'error' | 'warning', text: string}[]>([]);
  const [showValidation, setShowValidation] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [activeTooltip, setActiveTooltip] = useState<'model' | 'standards' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDemoData = () => {
    setModelData(DEMO_MODEL_DATA);
    setStandards(DEMO_STANDARDS);
    setShowValidation(false);
    setValidationMessages([]);
    setFileName(null);
  };

  // Reset validation state when user edits data
  useEffect(() => {
    // Only clear if the user is typing (length changes) or if specific interactions occur
    // We don't want to clear file upload errors immediately unless data changes
    if (showValidation && validationMessages.some(m => !m.text.includes("file"))) {
         // This logic is a bit simple, relying on data change to clear is standard pattern
         setShowValidation(false);
         setValidationMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelData, standards]);

  // Handle outside click for tooltips
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if ((event.target as Element).closest('.tooltip-container')) return;
      setActiveTooltip(null);
    };

    if (activeTooltip) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeTooltip]);

  const validateAndProceed = () => {
    const messages: {type: 'error' | 'warning', text: string}[] = [];

    // 1. Critical Errors (Prevent Submission)
    if (modelData.trim().length < 20) {
        messages.push({ type: 'error', text: "Model data is too short. Please provide meaningful export data." });
    }
    if (standards.trim().length < 20) {
        messages.push({ type: 'error', text: "Project standards are too short. Please describe the BEP requirements." });
    }

    // Stop here if errors exist
    if (messages.some(m => m.type === 'error')) {
        setValidationMessages(messages);
        setShowValidation(true);
        return;
    }

    // 2. Warnings (Heuristics for BIM Data)
    const lowerModel = modelData.toLowerCase();
    const missingCategories = [];
    
    // Check for common BIM terms or their variations
    if (!lowerModel.includes('level') && !lowerModel.includes('elevation') && !lowerModel.includes('storey')) missingCategories.push("Levels");
    if (!lowerModel.includes('grid') && !lowerModel.includes('axis')) missingCategories.push("Grids");
    if (!lowerModel.includes('coordinate') && !lowerModel.includes('survey') && !lowerModel.includes('base point') && !lowerModel.includes('project base')) missingCategories.push("Coordinates");
    if (!lowerModel.includes('workset')) missingCategories.push("Worksets");

    if (missingCategories.length > 0) {
        messages.push({ 
            type: 'warning', 
            text: `Potentially missing data for: ${missingCategories.join(', ')}. The audit might be incomplete for these categories.` 
        });
    }

    // Heuristics for Standards
    const lowerStandards = standards.toLowerCase();
    if (!lowerStandards.includes('naming') && !lowerStandards.includes('required') && !lowerStandards.includes('must') && !lowerStandards.includes('standard')) {
         messages.push({ 
            type: 'warning', 
            text: `Standards seem vague. Consider adding keywords like "naming convention", "required", or specific values for better results.` 
        });
    }

    if (messages.length > 0 && !showValidation) {
        // Show warnings first
        setValidationMessages(messages);
        setShowValidation(true);
    } else {
        // Proceed if no messages OR if user clicks again (acknowledging warnings)
        onRunAudit();
    }
  };

  // File Upload Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const readFile = (file: File) => {
    // Clear previous errors first
    setValidationMessages([]);
    setShowValidation(false);

    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // 1. Specific check for Revit files
    if (extension === 'rvt') {
        setValidationMessages([{
            type: 'error', 
            text: `Cannot process .rvt files directly (${file.name}). Please export your Revit schedules or data to .txt, .csv, or .json first.`
        }]);
        setShowValidation(true);
        return;
    }

    // 2. Check for other unsupported binary formats usually mistaken
    const unsupportedBinary = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'jpg', 'png', 'dwg', 'nwd'];
    if (extension && unsupportedBinary.includes(extension)) {
        setValidationMessages([{
            type: 'error', 
            text: `Unsupported file format: .${extension}. Please upload a text-based export (e.g., CSV, TXT, JSON, IFC, XML).`
        }]);
        setShowValidation(true);
        return;
    }

    // 3. Supported text extensions list (soft check)
    const supportedExtensions = ['txt', 'csv', 'json', 'xml', 'ifc', 'md', 'html'];
    if (extension && !supportedExtensions.includes(extension)) {
         setValidationMessages([{
            type: 'warning', 
            text: `Unknown file extension .${extension}. Attempting to read as text, but results may vary.`
        }]);
        setShowValidation(true);
    }

    const reader = new FileReader();
    
    reader.onerror = () => {
        let errorMessage = `Failed to read ${file.name}.`;
        
        // Granular error handling based on DOMException name
        if (reader.error) {
            switch (reader.error.name) {
                case 'NotFoundError':
                    errorMessage = `File not found: ${file.name}. It may have been moved or deleted after selection.`;
                    break;
                case 'NotReadableError':
                    errorMessage = `Permission denied or file locked: ${file.name}. Please check if the file is open in another program (like Excel or Revit) and close it.`;
                    break;
                case 'SecurityError':
                    errorMessage = `Security error accessing ${file.name}. The browser prevented access to this file.`;
                    break;
                case 'EncodingError':
                    errorMessage = `Encoding error processing ${file.name}. The file might not be a valid text encoding.`;
                    break;
                default:
                    errorMessage = `Read error (${reader.error.name}): ${file.name}. The file might be corrupted.`;
            }
        }

        setValidationMessages([{
            type: 'error', 
            text: errorMessage
        }]);
        setShowValidation(true);
    };

    reader.onload = (e) => {
        if (e.target?.result) {
            const content = e.target.result as string;

            // 4. Binary Content Detection (Basic)
            // If the file contains null bytes or a high ratio of non-printable characters, it's likely binary.
            // Simplified check: look for null bytes which are rare in valid text files (except UTF-16, but FileReader handles encoding usually)
            if (content.includes('\0')) {
                setValidationMessages([{
                    type: 'error', 
                    text: `The file ${file.name} appears to be binary or encoded incorrectly (detected null bytes). Please ensure it is a plain text file (UTF-8 recommended).`
                }]);
                setShowValidation(true);
                return;
            }

            // Check for empty content
            if (!content.trim()) {
                setValidationMessages([{
                    type: 'error', 
                    text: `The file ${file.name} appears to be empty.`
                }]);
                setShowValidation(true);
                return;
            }

            setModelData(content);
            setFileName(file.name);
            setDragActive(false);
            
            // If we had a warning about extension but read succeeded, we might want to keep it or clear it.
            // Let's clear it to indicate success if the content looks okay.
            if (!content.includes('\0')) {
                 setValidationMessages([]);
                 setShowValidation(false);
            }
        }
    };

    try {
        reader.readAsText(file);
    } catch (err) {
        setValidationMessages([{
            type: 'error', 
            text: "Error initiating file read. Please try again."
        }]);
        setShowValidation(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      readFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      readFile(e.target.files[0]);
    }
    // Reset input value to allow selecting the same file again if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const toggleTooltip = (type: 'model' | 'standards') => {
    setActiveTooltip(activeTooltip === type ? null : type);
  };

  const hasErrors = validationMessages.some(m => m.type === 'error');
  const hasWarnings = validationMessages.some(m => m.type === 'warning');

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
                        <div 
                            className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors cursor-pointer group
                                ${dragActive ? 'border-indigo-500 bg-indigo-50' : 
                                  hasErrors ? 'border-red-300 bg-red-50' :
                                  'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
                            `}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={triggerFileInput}
                        >
                            <input 
                                ref={fileInputRef}
                                type="file" 
                                className="hidden" 
                                accept=".txt,.csv,.json,.xml,.ifc"
                                onChange={handleFileChange}
                            />
                            <Icons.Upload className={`w-8 h-8 mb-2 ${dragActive ? 'text-indigo-600' : hasErrors ? 'text-red-400' : 'text-slate-400 group-hover:text-indigo-500'}`} />
                            <p className="text-sm font-medium text-slate-700 text-center">
                                {fileName ? (
                                    <span className="text-indigo-600 font-semibold">{fileName} loaded</span>
                                ) : (
                                    <>
                                        <span className="text-indigo-600">Click to upload</span> or drag and drop
                                    </>
                                )}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">
                                Supports .txt, .csv, .json, .xml, .ifc (text-based data)
                            </p>
                        </div>

                        <div className="relative tooltip-container">
                            <div className="flex items-center gap-2 mb-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    Or paste text data directly:
                                </label>
                                <button 
                                    onClick={() => toggleTooltip('model')} 
                                    className="text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                                    title="View examples"
                                >
                                    <Icons.Info className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {activeTooltip === 'model' && (
                                <div className="absolute z-20 left-0 top-8 w-80 p-4 bg-slate-800 text-white text-xs rounded-xl shadow-2xl border border-slate-700 animate-fade-in">
                                    <h4 className="font-bold mb-2 text-indigo-300 text-sm">Model Data Guidelines</h4>
                                    <p className="mb-3 text-slate-300">
                                        For best results, copy data from Revit schedules or export to text/CSV.
                                    </p>
                                    <div className="mb-3">
                                        <h5 className="font-semibold text-slate-200 mb-1">Supported Formats:</h5>
                                        <ul className="list-disc pl-4 space-y-1 text-slate-400">
                                            <li><span className="text-slate-200">Revit Schedule:</span> Copy rows/cols</li>
                                            <li><span className="text-slate-200">CSV/TXT:</span> Comma or tab separated</li>
                                            <li><span className="text-slate-200">JSON:</span> Structured data</li>
                                        </ul>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 font-mono text-[10px] text-slate-400 leading-relaxed">
                                        <div className="text-slate-500 mb-1">// Example Format</div>
                                        <div>Level Name, Elevation</div>
                                        <div>L01 - Ground, 0.00</div>
                                        <div>L02 - First, 4.00</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <textarea
                            value={modelData}
                            onChange={(e) => setModelData(e.target.value)}
                            placeholder="e.g. Level names, Grid coordinates, Workset list..."
                            className={`w-full h-64 p-4 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm resize-none ${hasErrors && modelData.length < 20 ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                        />
                         <p className="text-xs text-slate-500">
                            Note: For .rvt files, please export your schedules or data to a text format first.
                        </p>
                    </div>
                )}

                {activeTab === 'standards' && (
                     <div className="space-y-4">
                        <div className="relative tooltip-container">
                            <div className="flex items-center gap-2 mb-2">
                                <label className="block text-sm font-medium text-slate-700">
                                    Paste Project Standards / BEP Requirements
                                </label>
                                <button 
                                    onClick={() => toggleTooltip('standards')} 
                                    className="text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                                    title="View examples"
                                >
                                    <Icons.Info className="w-4 h-4" />
                                </button>
                            </div>
                            
                            {activeTooltip === 'standards' && (
                                <div className="absolute z-20 left-0 top-8 w-80 p-4 bg-slate-800 text-white text-xs rounded-xl shadow-2xl border border-slate-700 animate-fade-in">
                                    <h4 className="font-bold mb-2 text-indigo-300 text-sm">Defining Standards</h4>
                                    <p className="mb-3 text-slate-300">
                                        Define clear rules for the AI to check against. Ambiguity leads to poor results.
                                    </p>
                                    <div className="mb-3">
                                        <h5 className="font-semibold text-slate-200 mb-1">Tips:</h5>
                                        <ul className="list-disc pl-4 space-y-1 text-slate-400">
                                            <li>Use keywords like <span className="text-amber-300">MUST</span>, <span className="text-amber-300">SHOULD</span>.</li>
                                            <li>Specify naming patterns (e.g. prefixes).</li>
                                            <li>Define numeric tolerances if needed.</li>
                                        </ul>
                                    </div>
                                    <div className="bg-slate-900 p-3 rounded-lg border border-slate-700 font-mono text-[10px] text-slate-400 leading-relaxed">
                                        <div className="text-slate-500 mb-1">// Example Standards</div>
                                        <div>1. Levels MUST start with 'L'</div>
                                        <div>2. Grids MUST be pinned</div>
                                        <div>3. Survey Point: 100, 200, 0</div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <textarea
                            value={standards}
                            onChange={(e) => setStandards(e.target.value)}
                            placeholder="e.g. 1. Naming Convention: ARC_..., 2. Levels must match Structural..."
                            className={`w-full h-80 p-4 bg-slate-50 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm resize-none ${hasErrors && standards.length < 20 ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}
                        />
                        <p className="text-xs text-slate-500">
                            Tip: Describe the rules for Levels, Grids, Coordinates, and Worksets.
                        </p>
                    </div>
                )}
            </div>
            
            {/* Validation Feedback Area */}
            {showValidation && validationMessages.length > 0 && (
                <div className={`px-6 py-4 border-t ${hasErrors ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex items-start">
                        <div className="flex-shrink-0">
                            {hasErrors ? <Icons.Fail className="h-5 w-5 text-red-400" /> : <Icons.Warning className="h-5 w-5 text-amber-400" />}
                        </div>
                        <div className="ml-3">
                            <h3 className={`text-sm font-medium ${hasErrors ? 'text-red-800' : 'text-amber-800'}`}>
                                {hasErrors ? 'Validation Errors' : 'Validation Warnings'}
                            </h3>
                            <div className={`mt-2 text-sm ${hasErrors ? 'text-red-700' : 'text-amber-700'}`}>
                                <ul className="list-disc pl-5 space-y-1">
                                    {validationMessages.map((msg, idx) => (
                                        <li key={idx}>{msg.text}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <div className="text-sm text-slate-500 flex items-center">
                    {!modelData && !standards ? (
                        <span>Input Data & Standards to proceed</span>
                    ) : (
                         <span className="flex items-center">
                            <span className={`w-2 h-2 rounded-full mr-2 ${modelData && standards ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                            Ready to Validate
                         </span>
                    )}
                </div>
                <button
                    onClick={validateAndProceed}
                    disabled={isAnalyzing || !modelData || !standards || (showValidation && hasErrors)}
                    className={`
                        flex items-center px-6 py-3 rounded-lg text-white font-medium shadow-sm transition-all
                        ${isAnalyzing || !modelData || !standards || (showValidation && hasErrors)
                            ? 'bg-slate-400 cursor-not-allowed' 
                            : showValidation && hasWarnings 
                                ? 'bg-amber-600 hover:bg-amber-700' 
                                : 'bg-indigo-600 hover:bg-indigo-700'
                        }
                    `}
                >
                    {isAnalyzing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Auditing...
                        </>
                    ) : showValidation && hasWarnings ? (
                         <>
                            Proceed Anyway
                            <Icons.ArrowRight className="w-5 h-5 ml-2" />
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