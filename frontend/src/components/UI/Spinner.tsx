interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Spinner = ({ size = 'md', className = '' }: SpinnerProps) => {
  const sizeMap = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <div
      className={`${sizeMap[size]} animate-spin rounded-full border-2 border-slate-700 border-t-blue-500 ${className}`}
    />
  )
}

export const PageLoader = () => (
  <div className="flex h-full min-h-[400px] items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <Spinner size="lg" />
      <p className="text-sm text-slate-500">Loading…</p>
    </div>
  </div>
)