// Tests for Facebook Sync Scheduler

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  FacebookSyncScheduler, 
  getFacebookSyncScheduler, 
  resetFacebookSyncScheduler,
  SyncJob,
  SyncEvent
} from '../facebook-sync-scheduler';
import { FacebookAPIService } from '../facebook-api-service';
import { FacebookSyncResult } from '@/types/facebook';

// Mock the Facebook API Service
vi.mock('../facebook-api-service', () => ({
  FacebookAPIService: vi.fn(),
  getFacebookAPIService: vi.fn(),
}));

describe('FacebookSyncScheduler', () => {
  let scheduler: FacebookSyncScheduler;
  let mockApiService: FacebookAPIService;
  let mockSyncResult: FacebookSyncResult;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockSyncResult = {
      campaigns: [
        {
          id: 'campaign1',
          name: 'Test Campaign',
          status: 'ACTIVE',
          objective: 'CONVERSIONS',
          created_time: '2024-01-01T00:00:00Z',
          updated_time: '2024-01-01T00:00:00Z',
          account_id: 'account1',
          insights: {
            impressions: 1000,
            clicks: 50,
            spend: 100,
            reach: 800,
            frequency: 1.25,
            cpm: 10,
            cpc: 2,
            ctr: 5,
            date_start: '2024-01-01',
            date_stop: '2024-01-01',
          },
        },
      ],
      totalSpend: 100,
      totalImpressions: 1000,
      totalClicks: 50,
      syncTimestamp: new Date(),
      errors: [],
    };

    mockApiService = {
      syncAllData: vi.fn().mockResolvedValue(mockSyncResult),
      isAuthenticated: vi.fn().mockReturnValue(true),
      setAccessToken: vi.fn(),
    } as any;

    scheduler = new FacebookSyncScheduler(mockApiService, {
      defaultInterval: 1, // 1 minute for testing
      maxRetries: 2,
      retryDelay: 100,
      enableAutoSync: true,
      syncOnStartup: false,
      maxConcurrentSyncs: 2,
    });

    resetFacebookSyncScheduler();
  });

  afterEach(() => {
    scheduler.destroy();
    vi.useRealTimers();
  });

  describe('Basic Operations', () => {
    it('should create scheduler with default config', () => {
      const defaultScheduler = new FacebookSyncScheduler();
      expect(defaultScheduler).toBeDefined();
      expect(defaultScheduler.getStatus().isRunning).toBe(false);
      defaultScheduler.destroy();
    });

    it('should start and stop scheduler', () => {
      expect(scheduler.getStatus().isRunning).toBe(false);
      
      scheduler.start();
      expect(scheduler.getStatus().isRunning).toBe(true);
      
      scheduler.stop();
      expect(scheduler.getStatus().isRunning).toBe(false);
    });

    it('should pause and resume scheduler', () => {
      scheduler.start();
      
      scheduler.pause();
      expect(scheduler.getStatus().globalPaused).toBe(true);
      
      scheduler.resume();
      expect(scheduler.getStatus().globalPaused).toBe(false);
    });
  });

  describe('Job Management', () => {
    it('should add and remove jobs', () => {
      const jobId = 'test-job';
      const accountIds = ['account1', 'account2'];
      
      scheduler.addJob(jobId, accountIds, {}, 30);
      
      const job = scheduler.getJob(jobId);
      expect(job).toBeDefined();
      expect(job?.id).toBe(jobId);
      expect(job?.accountIds).toEqual(accountIds);
      expect(job?.interval).toBe(30);
      expect(job?.enabled).toBe(true);
      expect(job?.status).toBe('idle');
      
      const removed = scheduler.removeJob(jobId);
      expect(removed).toBe(true);
      expect(scheduler.getJob(jobId)).toBeUndefined();
    });

    it('should not add duplicate jobs', () => {
      const jobId = 'test-job';
      
      scheduler.addJob(jobId, ['account1']);
      
      expect(() => {
        scheduler.addJob(jobId, ['account2']);
      }).toThrow('Job with ID \'test-job\' already exists');
    });

    it('should pause and resume jobs', () => {
      const jobId = 'test-job';
      
      scheduler.addJob(jobId, ['account1']);
      
      const paused = scheduler.pauseJob(jobId);
      expect(paused).toBe(true);
      
      const job = scheduler.getJob(jobId);
      expect(job?.status).toBe('paused');
      expect(job?.enabled).toBe(false);
      
      const resumed = scheduler.resumeJob(jobId);
      expect(resumed).toBe(true);
      expect(job?.status).toBe('idle');
      expect(job?.enabled).toBe(true);
    });

    it('should update job configuration', () => {
      const jobId = 'test-job';
      
      scheduler.addJob(jobId, ['account1'], {}, 30);
      
      const updated = scheduler.updateJob(jobId, {
        accountIds: ['account1', 'account2'],
        interval: 60,
        maxRetries: 5,
      });
      
      expect(updated).toBe(true);
      
      const job = scheduler.getJob(jobId);
      expect(job?.accountIds).toEqual(['account1', 'account2']);
      expect(job?.interval).toBe(60);
      expect(job?.maxRetries).toBe(5);
    });

    it('should get all jobs', () => {
      scheduler.addJob('job1', ['account1']);
      scheduler.addJob('job2', ['account2']);
      
      const jobs = scheduler.getAllJobs();
      expect(jobs).toHaveLength(2);
      expect(jobs.map(j => j.id)).toContain('job1');
      expect(jobs.map(j => j.id)).toContain('job2');
    });
  });

  describe('Sync Execution', () => {
    it('should execute manual sync', async () => {
      const jobId = 'test-job';
      const accountIds = ['account1'];
      
      scheduler.addJob(jobId, accountIds);
      
      const result = await scheduler.triggerSync(jobId);
      
      expect(mockApiService.syncAllData).toHaveBeenCalledWith({
        accountIds,
        onProgress: expect.any(Function),
      });
      expect(result).toEqual(mockSyncResult);
      
      const job = scheduler.getJob(jobId);
      expect(job?.lastResult).toEqual(mockSyncResult);
      expect(job?.status).toBe('idle');
    });

    it('should handle sync errors', async () => {
      const jobId = 'test-job';
      const error = new Error('Sync failed');
      
      mockApiService.syncAllData = vi.fn().mockRejectedValue(error);
      
      scheduler.addJob(jobId, ['account1']);
      
      await expect(scheduler.triggerSync(jobId)).rejects.toThrow('Sync failed');
      
      const job = scheduler.getJob(jobId);
      expect(job?.status).toBe('error');
      expect(job?.lastError).toBe('Sync failed');
      expect(job?.retryCount).toBe(1);
    });

    it('should retry failed syncs', async () => {
      const jobId = 'test-job';
      const error = new Error('Sync failed');
      
      mockApiService.syncAllData = vi.fn().mockRejectedValue(error);
      
      scheduler.addJob(jobId, ['account1']);
      
      // First attempt should fail
      await expect(scheduler.triggerSync(jobId)).rejects.toThrow('Sync failed');
      
      const job = scheduler.getJob(jobId);
      expect(job?.retryCount).toBe(1);
      expect(job?.status).toBe('error');
      expect(job?.lastError).toBe('Sync failed');
    });

    it('should respect max concurrent syncs limit', async () => {
      const job1Id = 'job1';
      const job2Id = 'job2';
      const job3Id = 'job3';
      
      scheduler.addJob(job1Id, ['account1']);
      scheduler.addJob(job2Id, ['account2']);
      scheduler.addJob(job3Id, ['account3']);
      
      // Check that we can track concurrent syncs
      const status = scheduler.getStatus();
      expect(status.activeJobCount).toBe(3);
      expect(status.runningJobCount).toBe(0);
    });
  });

  describe('Scheduled Syncs', () => {
    it('should schedule automatic syncs', async () => {
      const jobId = 'test-job';
      
      scheduler.addJob(jobId, ['account1'], {}, 1); // 1 minute interval
      scheduler.start();
      
      // Fast-forward time to trigger sync
      vi.advanceTimersByTime(2000); // 2 seconds (initial delay)
      await vi.runOnlyPendingTimersAsync();
      
      expect(mockApiService.syncAllData).toHaveBeenCalled();
      
      const job = scheduler.getJob(jobId);
      expect(job?.lastRun).toBeDefined();
    });

    it('should not schedule paused jobs', async () => {
      const jobId = 'test-job';
      
      scheduler.addJob(jobId, ['account1'], {}, 1);
      scheduler.pauseJob(jobId);
      scheduler.start();
      
      // Fast-forward time
      vi.advanceTimersByTime(60 * 1000 + 1000);
      await vi.runAllTimersAsync();
      
      expect(mockApiService.syncAllData).not.toHaveBeenCalled();
    });

    it('should reschedule after successful sync', async () => {
      const jobId = 'test-job';
      
      scheduler.addJob(jobId, ['account1'], {}, 1);
      scheduler.start();
      
      // First sync
      vi.advanceTimersByTime(2000);
      await vi.runOnlyPendingTimersAsync();
      
      // Should have been called at least once
      expect(mockApiService.syncAllData).toHaveBeenCalled();
      
      const job = scheduler.getJob(jobId);
      expect(job?.lastRun).toBeDefined();
    });
  });

  describe('Event System', () => {
    it('should emit sync events', async () => {
      const jobId = 'test-job';
      const events: SyncEvent[] = [];
      
      scheduler.addEventListener('sync_started', (event) => events.push(event));
      scheduler.addEventListener('sync_completed', (event) => events.push(event));
      scheduler.addEventListener('job_added', (event) => events.push(event));
      
      scheduler.addJob(jobId, ['account1']);
      await scheduler.triggerSync(jobId);
      
      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('job_added');
      expect(events[1].type).toBe('sync_started');
      expect(events[2].type).toBe('sync_completed');
      expect(events[1].jobId).toBe(jobId);
      expect(events[2].jobId).toBe(jobId);
    });

    it('should emit error events', async () => {
      const jobId = 'test-job';
      const events: SyncEvent[] = [];
      const error = new Error('Sync failed');
      
      mockApiService.syncAllData = vi.fn().mockRejectedValue(error);
      
      scheduler.addEventListener('sync_failed', (event) => events.push(event));
      
      scheduler.addJob(jobId, ['account1']);
      
      await expect(scheduler.triggerSync(jobId)).rejects.toThrow();
      
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('sync_failed');
      expect(events[0].jobId).toBe(jobId);
      expect(events[0].error).toBe('Sync failed');
    });

    it('should remove event listeners', () => {
      const listener = vi.fn();
      
      scheduler.addEventListener('sync_started', listener);
      scheduler.removeEventListener('sync_started', listener);
      
      scheduler.addJob('test-job', ['account1']);
      scheduler.triggerSync('test-job');
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('Sync History', () => {
    it('should track sync history', async () => {
      const jobId = 'test-job';
      
      scheduler.addJob(jobId, ['account1']);
      await scheduler.triggerSync(jobId);
      
      const history = scheduler.getSyncHistory();
      expect(history).toHaveLength(1);
      
      const entry = history[0];
      expect(entry.jobId).toBe(jobId);
      expect(entry.status).toBe('success');
      expect(entry.recordsProcessed).toBe(1);
      expect(entry.startTime).toBeDefined();
      expect(entry.endTime).toBeDefined();
      expect(entry.duration).toBeGreaterThanOrEqual(0);
    });

    it('should track failed sync history', async () => {
      const jobId = 'test-job';
      const error = new Error('Sync failed');
      
      mockApiService.syncAllData = vi.fn().mockRejectedValue(error);
      
      scheduler.addJob(jobId, ['account1']);
      
      await expect(scheduler.triggerSync(jobId)).rejects.toThrow();
      
      const history = scheduler.getSyncHistory();
      expect(history).toHaveLength(1);
      
      const entry = history[0];
      expect(entry.status).toBe('failed');
      expect(entry.errors).toContain('Sync failed');
    });

    it('should limit sync history', async () => {
      const jobId = 'test-job';
      
      scheduler.addJob(jobId, ['account1']);
      
      // Run multiple syncs
      for (let i = 0; i < 5; i++) {
        await scheduler.triggerSync(jobId);
      }
      
      const history = scheduler.getSyncHistory(3);
      expect(history).toHaveLength(3);
    });

    it('should clear sync history', async () => {
      const jobId = 'test-job';
      
      scheduler.addJob(jobId, ['account1']);
      await scheduler.triggerSync(jobId);
      
      expect(scheduler.getSyncHistory()).toHaveLength(1);
      
      scheduler.clearSyncHistory();
      expect(scheduler.getSyncHistory()).toHaveLength(0);
    });
  });

  describe('Conflict Resolution', () => {
    it('should handle sync conflicts with queue strategy', async () => {
      scheduler.setConflictResolution({ strategy: 'queue', maxQueueSize: 5 });
      
      const jobId = 'test-job';
      
      scheduler.addJob(jobId, ['account1']);
      
      // Test that conflict resolution is set
      expect(scheduler['conflictResolution'].strategy).toBe('queue');
      expect(scheduler['conflictResolution'].maxQueueSize).toBe(5);
    });

    it('should handle sync conflicts with skip strategy', async () => {
      scheduler.setConflictResolution({ strategy: 'skip' });
      
      const jobId = 'test-job';
      
      // Mock slow sync
      mockApiService.syncAllData = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSyncResult), 1000))
      );
      
      scheduler.addJob(jobId, ['account1']);
      
      // Start first sync
      const sync1Promise = scheduler.triggerSync(jobId);
      
      // Try to start second sync (should be skipped)
      await expect(scheduler.triggerSync(jobId)).rejects.toThrow('Sync already running, skipping');
      
      // Complete first sync
      vi.advanceTimersByTime(1000);
      await sync1Promise;
      
      expect(mockApiService.syncAllData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Status and Monitoring', () => {
    it('should provide scheduler status', () => {
      scheduler.addJob('job1', ['account1']);
      scheduler.addJob('job2', ['account2']);
      
      const status = scheduler.getStatus();
      
      expect(status.isRunning).toBe(false);
      expect(status.globalPaused).toBe(false);
      expect(status.activeJobCount).toBe(2);
      expect(status.runningJobCount).toBe(0);
      expect(status.queueSize).toBe(0);
    });

    it('should track running job count', async () => {
      const jobId = 'test-job';
      
      // Mock slow sync
      mockApiService.syncAllData = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockSyncResult), 1000))
      );
      
      scheduler.addJob(jobId, ['account1']);
      
      expect(scheduler.getStatus().runningJobCount).toBe(0);
      
      const syncPromise = scheduler.triggerSync(jobId);
      
      // Should show running job
      expect(scheduler.getStatus().runningJobCount).toBe(1);
      
      vi.advanceTimersByTime(1000);
      await syncPromise;
      
      // Should return to 0 after completion
      expect(scheduler.getStatus().runningJobCount).toBe(0);
    });
  });

  describe('Singleton Factory', () => {
    it('should return same instance from factory', () => {
      const scheduler1 = getFacebookSyncScheduler();
      const scheduler2 = getFacebookSyncScheduler();
      
      expect(scheduler1).toBe(scheduler2);
      
      resetFacebookSyncScheduler();
    });

    it('should create new instance after reset', () => {
      const scheduler1 = getFacebookSyncScheduler();
      resetFacebookSyncScheduler();
      const scheduler2 = getFacebookSyncScheduler();
      
      expect(scheduler1).not.toBe(scheduler2);
      
      resetFacebookSyncScheduler();
    });
  });
});