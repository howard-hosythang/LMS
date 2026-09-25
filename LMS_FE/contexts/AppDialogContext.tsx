import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
  X,
} from 'lucide-react';
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../components/ui';
import { useTranslation } from './LanguageContext';

type DialogVariant = 'confirm' | 'info' | 'success' | 'warning' | 'danger';

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
};

type AlertOptions = {
  title?: string;
  message: string;
  buttonText?: string;
  variant?: Exclude<DialogVariant, 'confirm'>;
};

type PendingDialog = (ConfirmOptions | AlertOptions) & {
  id: number;
  mode: 'confirm' | 'alert';
  resolve: (value: boolean) => void;
};

type AppDialogContextValue = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

const variantConfig = {
  confirm: {
    icon: HelpCircle,
    iconClass: 'bg-blue-50 text-blue-600',
    buttonClass: 'bg-blue-600 hover:bg-blue-700',
  },
  info: {
    icon: Info,
    iconClass: 'bg-blue-50 text-blue-600',
    buttonClass: 'bg-blue-600 hover:bg-blue-700',
  },
  success: {
    icon: CheckCircle,
    iconClass: 'bg-emerald-50 text-emerald-600',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-700',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'bg-amber-50 text-amber-600',
    buttonClass: 'bg-amber-600 hover:bg-amber-700',
  },
  danger: {
    icon: AlertCircle,
    iconClass: 'bg-red-50 text-red-600',
    buttonClass: 'bg-red-600 hover:bg-red-700',
  },
};

export const AppDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useTranslation();
  const [dialog, setDialog] = useState<PendingDialog | null>(null);

  const close = useCallback((value: boolean) => {
    setDialog((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => (
    new Promise<boolean>((resolve) => {
      setDialog({
        id: Date.now(),
        mode: 'confirm',
        variant: 'confirm',
        ...options,
        resolve,
      });
    })
  ), []);

  const alert = useCallback((options: AlertOptions) => (
    new Promise<void>((resolve) => {
      setDialog({
        id: Date.now(),
        mode: 'alert',
        variant: 'info',
        ...options,
        resolve: () => resolve(),
      });
    })
  ), []);

  const value = useMemo(() => ({ confirm, alert }), [confirm, alert]);

  const activeVariant = dialog?.variant || (dialog?.mode === 'confirm' ? 'confirm' : 'info');
  const config = variantConfig[activeVariant];
  const Icon = config.icon;

  return (
    <AppDialogContext.Provider value={value}>
      {children}
      {dialog && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm"
          onMouseDown={() => dialog.mode === 'alert' ? close(true) : undefined}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10 animate-fade-in"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start gap-4 p-6">
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl ${config.iconClass}`}>
                <Icon size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-lg font-bold text-slate-950">
                    {dialog.title || (dialog.mode === 'confirm' ? (t('dialog.confirmTitle', 'Xác nhận thao tác')) : (t('dialog.noticeTitle', 'Thông báo')))}
                  </h3>
                  <button
                    type="button"
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                    onClick={() => close(dialog.mode === 'confirm' ? false : true)}
                    aria-label={t('common.close')}
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                  {dialog.message}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 rounded-b-2xl">
              {dialog.mode === 'confirm' && (
                <Button variant="outline" onClick={() => close(false)}>
                  {(dialog as ConfirmOptions).cancelText || t('common.cancel')}
                </Button>
              )}
              <Button className={config.buttonClass} onClick={() => close(true)}>
                {dialog.mode === 'confirm'
                  ? ((dialog as ConfirmOptions).confirmText || t('dialog.confirm', 'Xác nhận'))
                  : ((dialog as AlertOptions).buttonText || t('common.close'))}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </AppDialogContext.Provider>
  );
};

export const useAppDialog = () => {
  const ctx = useContext(AppDialogContext);
  if (!ctx) {
    throw new Error('useAppDialog must be used inside AppDialogProvider');
  }
  return ctx;
};
