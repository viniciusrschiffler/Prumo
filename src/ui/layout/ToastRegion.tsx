import { useToastStore } from '@/app/stores/useToastStore'
import { IconButton } from '@/ui/primitives/IconButton'
import { Toast } from '@/ui/primitives/Toast'

export function ToastRegion() {
  const notices = useToastStore((state) => state.notices)
  const dismiss = useToastStore((state) => state.dismiss)

  if (notices.length === 0) {
    return null
  }

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 left-1/2 z-50 grid -translate-x-1/2 justify-items-center gap-2"
    >
      {notices.map((notice) => (
        <Toast
          key={notice.id}
          tone={notice.tone}
          className="pointer-events-auto"
          action={
            <IconButton size="small" label="Dispensar" onClick={() => dismiss(notice.id)}>
              ✕
            </IconButton>
          }
        >
          {notice.message}
        </Toast>
      ))}
    </div>
  )
}
