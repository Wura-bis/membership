/**
 * Offline Sync Hook for React
 * Manages offline data caching and synchronization
 * 
 * Usage:
 * const { isOnline, lastSync, syncNow } = useOfflineSync();
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const OFFLINE_DB_KEY = 'bis_offline_data';
const SYNC_QUEUE_KEY = 'bis_sync_queue';
const LAST_SYNC_KEY = 'bis_last_sync';

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(() => {
    const saved = localStorage.getItem(LAST_SYNC_KEY);
    return saved ? new Date(saved) : null;
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const syncQueueRef = useRef([]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Back online - attempting sync');
      setIsOnline(true);
      // Auto-sync when coming back online
      syncOfflineChanges();
    };

    const handleOffline = () => {
      console.log('📴 Offline mode');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Save data for offline access
   */
  const cacheForOffline = useCallback((data) => {
    try {
      localStorage.setItem(OFFLINE_DB_KEY, JSON.stringify({
        timestamp: new Date().toISOString(),
        data: data
      }));
      console.log('✓ Data cached for offline use');
      return true;
    } catch (error) {
      console.error('Error caching offline data:', error);
      if (error.name === 'QuotaExceededError') {
        console.warn('⚠️ Storage quota exceeded - clearing old cache');
        localStorage.removeItem(OFFLINE_DB_KEY);
        localStorage.setItem(OFFLINE_DB_KEY, JSON.stringify({
          timestamp: new Date().toISOString(),
          data: data
        }));
      }
      return false;
    }
  }, []);

  /**
   * Get cached offline data
   */
  const getOfflineData = useCallback(() => {
    try {
      const cached = localStorage.getItem(OFFLINE_DB_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving offline data:', error);
      return null;
    }
  }, []);

  /**
   * Add a change to sync queue (for offline edits)
   */
  const queueChange = useCallback((type, item) => {
    try {
      const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
      queue.push({
        type: type,
        item: item,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
      console.log(`✓ Queued ${type} change for sync`);
      return true;
    } catch (error) {
      console.error('Error queuing change:', error);
      return false;
    }
  }, []);

  /**
   * Get all queued changes
   */
  const getQueuedChanges = useCallback(() => {
    try {
      const queue = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
      return queue;
    } catch (error) {
      console.error('Error retrieving queue:', error);
      return [];
    }
  }, []);

  /**
   * Clear the sync queue
   */
  const clearSyncQueue = useCallback(() => {
    localStorage.removeItem(SYNC_QUEUE_KEY);
  }, []);

  /**
   * Export all offline data
   */
  const exportOfflineData = useCallback(async () => {
    try {
      setSyncStatus('exporting');
      const response = await fetch('http://localhost:5000/api/sync/export', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to export data');
      }

      const result = await response.json();
      
      // Cache the data
      cacheForOffline(result.data);
      
      console.log('✓ Data exported successfully');
      setSyncStatus('idle');
      return result.data;
    } catch (error) {
      console.error('Error exporting data:', error);
      setSyncStatus('error');
      return null;
    }
  }, [cacheForOffline]);

  /**
   * Sync offline changes back to server
   */
  const syncOfflineChanges = useCallback(async () => {
    if (!isOnline) {
      console.log('⚠️ Cannot sync while offline');
      return false;
    }

    try {
      setIsSyncing(true);
      setSyncStatus('syncing');

      const changes = getQueuedChanges();
      
      if (changes.length === 0) {
        console.log('No changes to sync');
        setIsSyncing(false);
        setSyncStatus('idle');
        return true;
      }

      // Group changes by type
      const groupedChanges = changes.reduce((acc, change) => {
        if (!acc[change.type]) acc[change.type] = [];
        acc[change.type].push(change.item);
        return acc;
      }, {});

      const response = await fetch('http://localhost:5000/api/sync/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ changes: groupedChanges })
      });

      if (!response.ok) {
        throw new Error('Sync failed');
      }

      const result = await response.json();
      
      // Clear the queue if sync successful
      if (result.success) {
        clearSyncQueue();
        const newSyncTime = new Date();
        setLastSync(newSyncTime);
        localStorage.setItem(LAST_SYNC_KEY, newSyncTime.toISOString());
        console.log(`✓ Synced ${result.synced_items} items`);
      }

      setSyncStatus('idle');
      setIsSyncing(false);
      return result.success;

    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      setIsSyncing(false);
      return false;
    }
  }, [isOnline, getQueuedChanges, clearSyncQueue]);

  /**
   * Get sync status from server
   */
  const checkSyncStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/sync/status', {
        credentials: 'include'
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking sync status:', error);
      return null;
    }
  }, []);

  /**
   * Prepare for offline by downloading all necessary data
   */
  const prepareOffline = useCallback(async () => {
    console.log('📥 Preparing offline mode...');
    const data = await exportOfflineData();
    
    if (data) {
      console.log('✓ Offline mode ready');
      return true;
    } else {
      console.error('✗ Failed to prepare offline mode');
      return false;
    }
  }, [exportOfflineData]);

  // Sync now function
  const syncNow = useCallback(async () => {
    console.log('🔄 Starting manual sync...');
    return await syncOfflineChanges();
  }, [syncOfflineChanges]);

  return {
    isOnline,
    lastSync,
    isSyncing,
    syncStatus,
    
    // Methods
    cacheForOffline,
    getOfflineData,
    queueChange,
    getQueuedChanges,
    clearSyncQueue,
    exportOfflineData,
    syncOfflineChanges,
    checkSyncStatus,
    prepareOffline,
    syncNow
  };
}

/**
 * Component to show sync status
 */
export function SyncStatusIndicator() {
  const { isOnline, isSyncing, lastSync, syncNow } = useOfflineSync();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      background: isOnline ? '#d1fae5' : '#fee2e2',
      border: `2px solid ${isOnline ? '#10b981' : '#ef4444'}`,
      borderRadius: '8px',
      fontSize: '14px'
    }}>
      <span style={{ fontSize: '18px' }}>
        {isOnline ? '🌐' : '📴'}
      </span>
      <span style={{ fontWeight: '600' }}>
        {isOnline ? 'Online' : 'Offline Mode'}
      </span>
      {lastSync && (
        <span style={{ fontSize: '12px', color: '#6b7280' }}>
          (Last sync: {lastSync.toLocaleTimeString()})
        </span>
      )}
      {isOnline && (
        <button
          onClick={syncNow}
          disabled={isSyncing}
          style={{
            marginLeft: 'auto',
            padding: '6px 12px',
            background: isSyncing ? '#d1d5db' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: isSyncing ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: '600'
          }}
        >
          {isSyncing ? '⏳ Syncing...' : '🔄 Sync Now'}
        </button>
      )}
    </div>
  );
}
