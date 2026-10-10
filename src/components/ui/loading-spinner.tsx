import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

/** Compact crossed belt strokes for buttons and small loading areas. */
export function LoadingSpinner({ size = 'medium', className }: LoadingSpinnerProps) {
  const sizeClasses = { small: 'h-4 w-4', medium: 'h-8 w-8', large: 'h-12 w-12' };
  return (
    <span role="status" aria-label="Loading" className={cn('academy-belt-loader', sizeClasses[size], className)}>
      <span aria-hidden="true" /><span aria-hidden="true" />
    </span>
  );
}

export { PanelLoader } from '@/components/loading/PanelLoader';
