// component-patterns.tsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
  type ReactElement,
  type ComponentPropsWithoutRef,
  type ElementType,
} from "react";

// ─── Polymorphic Box ──────────────────────────────────────────────────────────
// Tokens: spacing.md, radius.md, text.primary, surface.100

interface BoxProps<T extends ElementType = "div"> {
  as?: T;
  children?: ReactNode;
  className?: string;
}

export function Box<T extends ElementType = "div">({
  as,
  children,
  className,
  ...props
}: BoxProps<T> & ComponentPropsWithoutRef<T>) {
  const Component = as || "div";
  return (
    <Component className={className} {...props}>
      {children}
    </Component>
  );
}

// ─── Compound Tabs ────────────────────────────────────────────────────────────
// Tokens: spacing.sm, spacing.md, border color, text.secondary, brand.500

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

function Tabs({ children, defaultTab }: { children: ReactNode; defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="flex flex-col">{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.List = function TabsList({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex gap-2 border-b border-surface-200 dark:border-surface-700"
      role="tablist"
    >
      {children}
    </div>
  );
};

Tabs.Tab = function TabsTab({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext)!;
  const active = ctx.activeTab === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors duration-150 ${
        active
          ? "border-brand-500 text-brand-600 dark:text-brand-400"
          : "border-transparent text-text-muted hover:text-text-secondary hover:border-surface-300 dark:hover:border-surface-600"
      }`}
      onClick={() => ctx.setActiveTab(value)}
    >
      {children}
    </button>
  );
};

Tabs.Panel = function TabsPanel({ value, children }: { value: string; children: ReactNode }) {
  const ctx = useContext(TabsContext)!;
  if (ctx.activeTab !== value) return null;
  return (
    <div role="tabpanel" className="pt-4 text-text-primary">
      {children}
    </div>
  );
};

export { Tabs };

// ─── Button ───────────────────────────────────────────────────────────────────
// Tokens: spacing.sm, spacing.md, radius.md, font size, brand, error, text.inverse

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-500 text-text-inverse hover:bg-brand-600 active:bg-brand-700 focus-visible:ring-brand-400",
  secondary:
    "bg-surface-200 dark:bg-surface-700 text-text-primary hover:bg-surface-300 dark:hover:bg-surface-600 border border-surface-300 dark:border-surface-600 focus-visible:ring-brand-400",
  ghost:
    "text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 focus-visible:ring-brand-400",
  danger:
    "bg-error-500 text-text-inverse hover:bg-error-600 active:bg-error-700 focus-visible:ring-error-400",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900 disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
// Tokens: radius.lg, surface.50/dark:surface.900, shadow.md, surface border

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div
      className={`bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 shadow-md rounded-xl ${
        padding ? "p-6" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

Card.Header = function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mb-4 last:mb-0 ${className}`}>{children}</div>
  );
};

Card.Body = function CardBody({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`text-text-secondary text-sm ${className}`}>{children}</div>;
};

Card.Footer = function CardFooter({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 flex items-center gap-2 ${className}`}
    >
      {children}
    </div>
  );
};

// ─── Modal / Dialog ───────────────────────────────────────────────────────────
// Tokens: zIndex.modal, surface.50, radius.xl, shadow.xl, spacing

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, className = "" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full max-w-lg bg-surface-50 dark:bg-surface-900 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 animate-scale-in max-h-[85vh] flex flex-col ${className}`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200 dark:border-surface-700">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-700"
              aria-label="Close"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Toast / Notification ─────────────────────────────────────────────────────
// Tokens: zIndex.toast, radius.lg, semantic colors, shadow, animation

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastData {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastProps extends ToastData {
  onDismiss: (id: string) => void;
}

const toastVariantStyles: Record<ToastVariant, string> = {
  success: "bg-success-600 text-white",
  error: "bg-error-600 text-white",
  warning: "bg-warning-600 text-white",
  info: "bg-info-600 text-white",
};

const toastIcon: Record<ToastVariant, ReactElement> = {
  success: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

export function ToastItem({ id, message, variant, onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  return (
    <div
      role="alert"
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-up text-sm font-medium ${toastVariantStyles[variant]}`}
    >
      {toastIcon[variant]}
      <span className="flex-1">{message}</span>
      <button onClick={() => onDismiss(id)} className="opacity-70 hover:opacity-100 transition-opacity" aria-label="Dismiss">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

// ─── Toast Container ──────────────────────────────────────────────────────────

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed bottom-4 right-4 z-[500] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem {...t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}

// ─── useToast hook ────────────────────────────────────────────────────────────

let toastCounter = 0;

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "info", duration?: number) => {
      const id = `toast-${++toastCounter}`;
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
    },
    [],
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, addToast, dismissToast, ToastContainer };
}

// ─── Loading / Skeleton ───────────────────────────────────────────────────────
// Tokens: radius.md, surface.200/700, animation.pulse

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
}: SkeletonProps) {
  const base = "animate-pulse bg-surface-200 dark:bg-surface-700";
  const variantClass =
    variant === "circular" ? "rounded-full" : variant === "text" ? "rounded-md h-4" : "rounded-lg";
  return (
    <div
      className={`${base} ${variantClass} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const spinnerSizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-10 w-10" };

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <svg
      className={`animate-spin text-brand-500 ${spinnerSizes[size]} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

interface SkeletonCardProps {
  lines?: number;
}

export function SkeletonCard({ lines = 3 }: SkeletonCardProps) {
  return (
    <div className="bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6 space-y-4">
      <Skeleton className="h-5 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? "w-4/5" : "w-full"}`} />
      ))}
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-20 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
    </div>
  );
}
