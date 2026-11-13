import { createContext, useContext, useState } from 'react';
import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

interface DialogContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

interface DialogProps {
  children: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function Dialog({ children, isOpen: controlledIsOpen, onOpenChange }: DialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const open = () => {
    setInternalIsOpen(true);
    onOpenChange?.(true);
  };

  const close = () => {
    setInternalIsOpen(false);
    onOpenChange?.(false);
  };

  return (
    <DialogContext.Provider value={{ isOpen, open, close }}>
      {children}
    </DialogContext.Provider>
  );
}

function DialogTrigger({ children, className, ...props }: HTMLAttributes<HTMLButtonElement>) {
  const { open } = useDialog();

  return (
    <button onClick={open} className={cn(className)} {...props}>
      {children}
    </button>
  );
}

function DialogContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  const { isOpen, close } = useDialog();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={close} />
      <div
        className={cn(
          'relative z-50 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg dark:bg-navy-800',
          className
        )}
        {...props}
      >
        <button
          onClick={close}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

function DialogHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mb-4', className)} {...props}>
      {children}
    </div>
  );
}

function DialogTitle({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2 className={cn('text-lg font-semibold', className)} {...props}>
      {children}
    </h2>
  );
}

function DialogDescription({ children, className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-navy-500 dark:text-navy-400', className)} {...props}>
      {children}
    </p>
  );
}

function DialogFooter({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mt-6 flex justify-end space-x-2', className)} {...props}>
      {children}
    </div>
  );
}

export { DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
