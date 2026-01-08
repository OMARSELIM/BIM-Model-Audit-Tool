import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Activity, 
  Layers, 
  Grid, 
  MapPin, 
  Users, 
  Upload, 
  ArrowRight,
  RefreshCw,
  BarChart3,
  CheckSquare
} from 'lucide-react';

export const Icons = {
  Pass: ({ className }: { className?: string }) => <CheckCircle className={`text-green-500 ${className}`} />,
  Fail: ({ className }: { className?: string }) => <XCircle className={`text-red-500 ${className}`} />,
  Warning: ({ className }: { className?: string }) => <AlertTriangle className={`text-amber-500 ${className}`} />,
  File: FileText,
  Activity: Activity,
  Levels: Layers,
  Layers: Layers,
  Grids: Grid,
  Coordinates: MapPin,
  Worksets: Users,
  Upload: Upload,
  ArrowRight: ArrowRight,
  Refresh: RefreshCw,
  Chart: BarChart3,
  Check: CheckSquare
};