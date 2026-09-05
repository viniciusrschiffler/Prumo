import { create } from 'zustand'
import type { ToastTone } from '@/ui/primitives/Toast'

export type ToastNotice = {
  id: number
  tone: ToastTone
  message: string
}

const DISMISS_AFTER_MS = 5000

type ToastState = {
  notices: readonly ToastNotice[]
  notify: (message: string, tone?: ToastTone) => void
  dismiss: (id: number) => void
}

let nextNoticeId = 1

export const useToastStore = create<ToastState>((set, get) => ({
  notices: [],
  notify: (message, tone = 'ok') => {
    const id = nextNoticeId
    nextNoticeId += 1

    set((state) => ({ notices: [...state.notices, { id, tone, message }] }))
    window.setTimeout(() => get().dismiss(id), DISMISS_AFTER_MS)
  },
  dismiss: (id) =>
    set((state) => ({ notices: state.notices.filter((notice) => notice.id !== id) })),
}))
