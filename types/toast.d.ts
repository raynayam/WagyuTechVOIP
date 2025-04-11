export interface ToastProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

export interface ToastHook {
  (props: ToastProps): void;
} 