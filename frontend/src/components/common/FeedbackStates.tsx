import React from 'react';
import { AlertCircle, FileX, Loader2 } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Data Found',
  description,
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-800 bg-slate-950/40 my-3">
      <div className="p-3 rounded-xl bg-slate-900 text-slate-400 mb-3 border border-slate-800">
        {icon || <FileX className="w-6 h-6" />}
      </div>
      <h4 className="text-sm font-bold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export interface LoadingStateProps {
  message?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ message = 'Loading parliamentary telemetry...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-400">{message}</p>
    </div>
  );
};

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Encountered System Anomaly',
  message,
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-rose-900/40 bg-rose-950/20 text-center my-3">
      <AlertCircle className="w-7 h-7 text-rose-400 mb-2" />
      <h4 className="text-sm font-bold text-rose-300">{title}</h4>
      <p className="text-xs text-rose-400/80 mt-1 max-w-md">{message}</p>
      {onRetry && (
        <Button variant="danger" size="sm" onClick={onRetry} className="mt-3">
          Retry Connection
        </Button>
      )}
    </div>
  );
};
