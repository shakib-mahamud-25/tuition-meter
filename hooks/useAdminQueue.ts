'use client'

import { useState, useCallback } from 'react'
import {
  fetchPendingQueue,
  approvePendingItem,
  rejectPendingItem,
  approveRecord,
  rejectRecord,
  approveAllInQueue,
  rejectAllInQueue,
} from '../lib/benchmark'
import { trackRecordApproved, trackRecordRejected } from '../lib/analytics'
import type { TuitionRecord } from '../lib/types'

type QueueItem = TuitionRecord & { id: string }

interface UseAdminQueueReturn {
  items: Record<string, QueueItem[]>
  loading: Record<string, boolean>
  processing: string | null
  bulkProcessing: string | null
  approve: (queueType: string, id: string) => Promise<void>
  reject: (queueType: string, id: string) => Promise<void>
  approveAll: (queueType: string) => Promise<void>
  rejectAll: (queueType: string) => Promise<void>
  refresh: (queueType: string) => Promise<void>
  refreshAll: () => Promise<void>
}

const QUEUE_COLLECTIONS: Record<string, string> = {
  records: 'tuition_records',
  areas: 'pending_areas',
  subjects: 'pending_subjects',
  universities: 'pending_universities',
  departments: 'pending_departments',
}

export function useAdminQueue(): UseAdminQueueReturn {
  const [items, setItems] = useState<Record<string, QueueItem[]>>({
    records: [], areas: [], subjects: [], universities: [], departments: [],
  })
  const [loading, setLoading] = useState<Record<string, boolean>>({
    records: false, areas: false, subjects: false, universities: false, departments: false,
  })
  const [processing, setProcessing] = useState<string | null>(null)
  const [bulkProcessing, setBulkProcessing] = useState<string | null>(null)

  const refresh = useCallback(async (queueType: string) => {
    const collectionName = QUEUE_COLLECTIONS[queueType]
    if (!collectionName) return
    setLoading(prev => ({ ...prev, [queueType]: true }))
    try {
      const data = await fetchPendingQueue(collectionName)
      setItems(prev => ({ ...prev, [queueType]: data }))
    } catch {
      // silently fail
    } finally {
      setLoading(prev => ({ ...prev, [queueType]: false }))
    }
  }, [])

  const refreshAll = useCallback(async () => {
    await Promise.all(Object.keys(QUEUE_COLLECTIONS).map(refresh))
  }, [refresh])

  const approve = useCallback(async (queueType: string, id: string) => {
    setProcessing(id)
    try {
      if (queueType === 'records') {
        await approveRecord(id)
        await trackRecordApproved(id)
      } else {
        await approvePendingItem(QUEUE_COLLECTIONS[queueType], id)
      }
      setItems(prev => ({
        ...prev,
        [queueType]: prev[queueType].filter(item => item.id !== id),
      }))
    } finally {
      setProcessing(null)
    }
  }, [])

  const reject = useCallback(async (queueType: string, id: string) => {
    setProcessing(id)
    try {
      if (queueType === 'records') {
        await rejectRecord(id)
        await trackRecordRejected(id)
      } else {
        await rejectPendingItem(QUEUE_COLLECTIONS[queueType], id)
      }
      setItems(prev => ({
        ...prev,
        [queueType]: prev[queueType].filter(item => item.id !== id),
      }))
    } finally {
      setProcessing(null)
    }
  }, [])

  const approveAll = useCallback(async (queueType: string) => {
    const queueItems = items[queueType]
    if (!queueItems || queueItems.length === 0) return
    setBulkProcessing(queueType)
    try {
      const ids = queueItems.map(item => item.id!)
      await approveAllInQueue(QUEUE_COLLECTIONS[queueType], ids)
      if (queueType === 'records') {
        await Promise.all(ids.map(id => trackRecordApproved(id)))
      }
      setItems(prev => ({ ...prev, [queueType]: [] }))
    } finally {
      setBulkProcessing(null)
    }
  }, [items])

  const rejectAll = useCallback(async (queueType: string) => {
    const queueItems = items[queueType]
    if (!queueItems || queueItems.length === 0) return
    setBulkProcessing(queueType)
    try {
      const ids = queueItems.map(item => item.id!)
      await rejectAllInQueue(QUEUE_COLLECTIONS[queueType], ids)
      if (queueType === 'records') {
        await Promise.all(ids.map(id => trackRecordRejected(id)))
      }
      setItems(prev => ({ ...prev, [queueType]: [] }))
    } finally {
      setBulkProcessing(null)
    }
  }, [items])

  return {
    items, loading, processing, bulkProcessing,
    approve, reject, approveAll, rejectAll,
    refresh, refreshAll,
  }
}
