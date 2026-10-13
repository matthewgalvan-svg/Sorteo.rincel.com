import type { InputHTMLAttributes, ReactNode } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  id: string
  label: string
  hint?: string
  error?: string
}

export function TextField({ id, label, hint, error, className = '', ...props }: TextFieldProps) {
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-base font-extrabold text-rincel-dark">
        {label} <span className="text-rincel-blue" aria-hidden="true">*</span>
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
        className={
          'block min-h-13 w-full rounded-2xl border-2 bg-white px-4 py-3 text-lg font-semibold text-rincel-dark ' +
          'placeholder:font-medium placeholder:text-rincel-dark/40 transition focus:outline-none focus:ring-4 ' +
          (error
            ? 'border-rincel-error focus:border-rincel-error focus:ring-rincel-error/15'
            : 'border-rincel-light-blue focus:border-rincel-blue focus:ring-rincel-cyan/30')
        }
        {...props}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-sm font-semibold text-rincel-dark/60">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm font-bold text-rincel-error">
          <span aria-hidden="true">⚠️</span> {error}
        </p>
      )}
    </div>
  )
}

interface CheckboxFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  id: string
  children: ReactNode
  error?: string
  optional?: boolean
}

export function CheckboxField({ id, children, error, optional, ...props }: CheckboxFieldProps) {
  const errorId = error ? `${id}-error` : undefined
  return (
    <div>
      <div
        className={
          'flex gap-3 rounded-2xl border-2 p-4 transition has-[:checked]:bg-rincel-light-blue/50 ' +
          (error ? 'border-rincel-error bg-rincel-error/5' : 'border-rincel-light-blue has-[:checked]:border-rincel-blue')
        }
      >
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="mt-0.5 size-6 shrink-0 cursor-pointer rounded-md accent-rincel-blue"
          {...props}
        />
        <label htmlFor={id} className="cursor-pointer text-[0.95rem] font-semibold leading-snug text-rincel-dark">
          {children}
          {optional && <span className="ml-1 text-sm font-bold text-rincel-dark/50">(opcional)</span>}
        </label>
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 flex items-start gap-1.5 text-sm font-bold text-rincel-error">
          <span aria-hidden="true">⚠️</span> {error}
        </p>
      )}
    </div>
  )
}
