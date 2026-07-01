'use client'

import { useState, useCallback } from 'react'
import {
  fetchPendingRecords,
  approveRecord,
  rejectRecord,
  approveAllRecords,
  rejectAllRecords,
} from '../lib/benchmark'
import { trackRecordApproved, trackRecordRejected } from '../lib/analytics'
import type { TuitionRecord } from '../lib/types'

type QueueItem = TuitionRecord & { id: string }

interface UseAdminQueueReturn {
  items: QueueItem[]
  loading: boolean
  processing: string | null
  bulkProcessing: boolean
  approve: (id: string) => Promise<void>
  reject: (id: string) => Promise<void>
  approveAll: () => Promise<void>
  rejectAll: () => Promise<void>
  refresh: () => Promise<void>
}

// ─── Moderation queue — salary reports only ────────────────────────────────────
// Previously this hook managed five separate queues (records, areas, subjects,
// universities, departments). The custom-option queues no longer exist —
// approving a salary report is now the only moderation step, and its field
// values become dropdown options automatically once approved.

export function useAdminQueue(): UseAdminQueueReturn {
  const [items, setItems] = useState<QueueItem[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState<string | null>(null)
  const [bulkProcessing, setBulkProcessing] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchPendingRecords()
      setItems(data)
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  const approve = useCallback(async (id: string) => {
    setProcessing(id)
    try {
      await approveRecord(id)
      await trackRecordApproved(id)
      setItems(prev => prev.filter(item => item.id !== id))
    } finally {
      setProcessing(null)
    }
  }, [])

  const reject = useCallback(async (id: string) => {
    setProcessing(id)
    try {
      await rejectRecord(id)
      await trackRecordRejected(id)
      setItems(prev => prev.filter(item => item.id !== id))
    } finally {
      setProcessing(null)
    }
  }, [])

  const approveAll = useCallback(async () => {
    if (items.length === 0) return
    setBulkProcessing(true)
    try {
      const ids = items.map(item => item.id!)
      await approveAllRecords(ids)
      await Promise.all(ids.map(id => trackRecordApproved(id)))
      setItems([])
    } finally {
      setBulkProcessing(false)
    }
  }, [items])

  const rejectAll = useCallback(async () => {
    if (items.length === 0) return
    setBulkProcessing(true)
    try {
      const ids = items.map(item => item.id!)
      await rejectAllRecords(ids)
      await Promise.all(ids.map(id => trackRecordRejected(id)))
      setItems([])
    } finally {
      setBulkProcessing(false)
    }
  }, [items])

  return {
    items, loading, processing, bulkProcessing,
    approve, reject, approveAll, rejectAll, refresh,
  }
}
