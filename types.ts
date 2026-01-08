export interface AuditItem {
  name: string;
  value: string;
  expected: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  message: string;
}

export interface CategoryResult {
  id: string;
  name: string;
  status: 'PASS' | 'FAIL' | 'WARNING';
  score: number;
  items: AuditItem[];
}

export interface AuditReport {
  summary: {
    overallScore: number;
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
    timestamp: string;
  };
  categories: CategoryResult[];
}

export enum ViewState {
  INPUT = 'INPUT',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
}

export interface AuditContextType {
  modelData: string;
  setModelData: (data: string) => void;
  standards: string;
  setStandards: (data: string) => void;
  report: AuditReport | null;
  setReport: (report: AuditReport | null) => void;
  viewState: ViewState;
  setViewState: (state: ViewState) => void;
}