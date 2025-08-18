// Facebook Sync Scheduler
// Manages automatic background synchronization of Facebook data

import { FacebookAPIService, getFacebookAPIService, SyncOptions, SyncProgress } from './facebook-api-service';
import { FacebookSyncResult } from '@/types/facebook';

export interface SyncSchedulerConfig {
  defaultInterval: number; // minutes
  maxRetries: number;
  retryDelay: number; // milliseconds
  enableAutoSync: boolean;
  syncOnStartup: boolean;
  maxConcurrentSyncs: number;
}

export interface SyncJob {
  id: string;
  accountIds: string[];
  options: Omit<SyncOptions, 'accountIds'>;
  interval: number; // minutes
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  retryCount: number;
  maxRetries: number;
  status: 'idle' | 'running' | 'paused' | 'error';
  lastError?: string;
  lastResult?: FacebookSyncResult;
}

export interface SyncSchedulerState {
  isRunning: boolean;
  activeJobs: Map<string, SyncJob>;
  scheduledTimeouts: Map<string, NodeJS.Timeout>;
  globalPaused: boolean;
  lastGlobalSync?: Date;
  syncHistory: SyncHistoryEntry[];
}

export interface SyncHistoryEntry {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date;
  status: 'success' | 'failed' | 'cancelled';
  recordsProcessed: number;
  errors: string[];
  duration: number; // milliseconds
}

export interface SyncConflictResolution {
  strategy: 'skip' | 'queue' | 'cancel_existing';
  maxQueueSize: number;
}

export type SyncEventType = 
  | 'sync_started' 
  | 'sync_completed' 
  | 'sync_failed' 
  | 'sync_cancelled' 
  | 'job_added' 
  | 'job_removed' 
  | 'job_paused' 
  | 'job_resumed' 
  | 'scheduler_paused' 
  | 'scheduler_resumed';

export interface SyncEvent {
  type: SyncEventType;
  jobId?: string;
  timestamp: Date;
  data?: any;
  error?: string;
}

export type SyncEventListener = (event: SyncEvent) => void;

export class FacebookSyncScheduler {
  private apiService: FacebookAPIService;
  private config: SyncSchedulerConfig;
  private state: SyncSchedulerState;
  private eventListeners: Map<SyncEventType, Set<SyncEventListener>>;
  private conflictResolution: SyncConflictResolution;
  private syncQueue: Array<{ jobId: string; priority: number }>;

  constructor(
    apiService?: FacebookAPIService,
    config: Partial<SyncSchedulerConfig> = {}
  ) {
    this.apiService = apiService || getFacebookAPIService();
    this.config = {
      defaultInterval: 60, // 1 hour
      maxRetries: 3,
      retryDelay: 5000, // 5 seconds
      enableAutoSync: true,
      syncOnStartup: false,
      maxConcurrentSyncs: 2,
      ...config,
    };

    this.state = {
      isRunning: false,
      activeJobs: new Map(),
      scheduledTimeouts: new Map(),
      globalPaused: false,
      syncHistory: [],
    };

    this.eventListeners = new Map();
    this.conflictResolution = {
      strategy: 'queue',
      maxQueueSize: 10,
    };
    this.syncQueue = [];

    // Initialize event listener maps
    const eventTypes: SyncEventType[] = [
      'sync_started', 'sync_completed', 'sync_failed', 'sync_cancelled',
      'job_added', 'job_removed', 'job_paused', 'job_resumed',
      'scheduler_paused', 'scheduler_resumed'
    ];
    eventTypes.forEach(type => {
      this.eventListeners.set(type, new Set());
    });
  }

  // Start the scheduler
  start(): void {
    if (this.state.isRunning) {
      console.warn('Sync scheduler is already running');
      return;
    }

    this.state.isRunning = true;
    this.state.globalPaused = false;

    // Schedule all active jobs
    this.state.activeJobs.forEach((job) => {
      if (job.enabled && job.status !== 'paused') {
        this.scheduleJob(job);
      }
    });

    // Run startup sync if enabled
    if (this.config.syncOnStartup) {
      this.runStartupSync();
    }

    console.log('Facebook sync scheduler started');
  }

  // Stop the scheduler
  stop(): void {
    if (!this.state.isRunning) {
      return;
    }

    this.state.isRunning = false;

    // Clear all scheduled timeouts
    this.state.scheduledTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.state.scheduledTimeouts.clear();

    // Cancel any running syncs
    this.cancelAllSyncs();

    console.log('Facebook sync scheduler stopped');
  }

  // Pause all sync operations
  pause(): void {
    this.state.globalPaused = true;
    
    // Clear scheduled timeouts but keep jobs
    this.state.scheduledTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.state.scheduledTimeouts.clear();

    this.emitEvent({
      type: 'scheduler_paused',
      timestamp: new Date(),
    });

    console.log('Facebook sync scheduler paused');
  }

  // Resume sync operations
  resume(): void {
    if (!this.state.isRunning) {
      this.start();
      return;
    }

    this.state.globalPaused = false;

    // Reschedule all active jobs
    this.state.activeJobs.forEach((job) => {
      if (job.enabled && job.status !== 'paused') {
        this.scheduleJob(job);
      }
    });

    this.emitEvent({
      type: 'scheduler_resumed',
      timestamp: new Date(),
    });

    console.log('Facebook sync scheduler resumed');
  }

  // Add a new sync job
  addJob(
    id: string,
    accountIds: string[],
    options: Omit<SyncOptions, 'accountIds'> = {},
    interval: number = this.config.defaultInterval
  ): void {
    if (this.state.activeJobs.has(id)) {
      throw new Error(`Job with ID '${id}' already exists`);
    }

    const job: SyncJob = {
      id,
      accountIds,
      options,
      interval,
      enabled: true,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
      status: 'idle',
    };

    this.state.activeJobs.set(id, job);

    // Schedule the job if scheduler is running
    if (this.state.isRunning && !this.state.globalPaused) {
      this.scheduleJob(job);
    }

    this.emitEvent({
      type: 'job_added',
      jobId: id,
      timestamp: new Date(),
      data: { job },
    });

    console.log(`Added sync job: ${id}`);
  }

  // Remove a sync job
  removeJob(id: string): boolean {
    const job = this.state.activeJobs.get(id);
    if (!job) {
      return false;
    }

    // Cancel scheduled timeout
    const timeout = this.state.scheduledTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.state.scheduledTimeouts.delete(id);
    }

    // Cancel running sync if active
    if (job.status === 'running') {
      this.cancelSync(id);
    }

    this.state.activeJobs.delete(id);

    this.emitEvent({
      type: 'job_removed',
      jobId: id,
      timestamp: new Date(),
    });

    console.log(`Removed sync job: ${id}`);
    return true;
  }

  // Pause a specific job
  pauseJob(id: string): boolean {
    const job = this.state.activeJobs.get(id);
    if (!job) {
      return false;
    }

    job.status = 'paused';
    job.enabled = false;

    // Cancel scheduled timeout
    const timeout = this.state.scheduledTimeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.state.scheduledTimeouts.delete(id);
    }

    this.emitEvent({
      type: 'job_paused',
      jobId: id,
      timestamp: new Date(),
    });

    console.log(`Paused sync job: ${id}`);
    return true;
  }

  // Resume a specific job
  resumeJob(id: string): boolean {
    const job = this.state.activeJobs.get(id);
    if (!job) {
      return false;
    }

    job.status = 'idle';
    job.enabled = true;

    // Schedule the job if scheduler is running
    if (this.state.isRunning && !this.state.globalPaused) {
      this.scheduleJob(job);
    }

    this.emitEvent({
      type: 'job_resumed',
      jobId: id,
      timestamp: new Date(),
    });

    console.log(`Resumed sync job: ${id}`);
    return true;
  }

  // Update job configuration
  updateJob(
    id: string,
    updates: Partial<Pick<SyncJob, 'accountIds' | 'options' | 'interval' | 'maxRetries'>>
  ): boolean {
    const job = this.state.activeJobs.get(id);
    if (!job) {
      return false;
    }

    // Apply updates
    Object.assign(job, updates);

    // Reschedule if interval changed and job is active
    if (updates.interval && job.enabled && this.state.isRunning && !this.state.globalPaused) {
      // Cancel current schedule
      const timeout = this.state.scheduledTimeouts.get(id);
      if (timeout) {
        clearTimeout(timeout);
        this.state.scheduledTimeouts.delete(id);
      }
      
      // Reschedule with new interval
      this.scheduleJob(job);
    }

    console.log(`Updated sync job: ${id}`);
    return true;
  }

  // Manually trigger a sync job
  async triggerSync(id: string): Promise<FacebookSyncResult> {
    const job = this.state.activeJobs.get(id);
    if (!job) {
      throw new Error(`Job with ID '${id}' not found`);
    }

    return this.executeSync(job);
  }

  // Get job status
  getJob(id: string): SyncJob | undefined {
    return this.state.activeJobs.get(id);
  }

  // Get all jobs
  getAllJobs(): SyncJob[] {
    return Array.from(this.state.activeJobs.values());
  }

  // Get scheduler status
  getStatus(): {
    isRunning: boolean;
    globalPaused: boolean;
    activeJobCount: number;
    runningJobCount: number;
    lastGlobalSync?: Date;
    queueSize: number;
  } {
    const runningJobCount = Array.from(this.state.activeJobs.values())
      .filter(job => job.status === 'running').length;

    return {
      isRunning: this.state.isRunning,
      globalPaused: this.state.globalPaused,
      activeJobCount: this.state.activeJobs.size,
      runningJobCount,
      lastGlobalSync: this.state.lastGlobalSync,
      queueSize: this.syncQueue.length,
    };
  }

  // Get sync history
  getSyncHistory(limit: number = 50): SyncHistoryEntry[] {
    return this.state.syncHistory
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  // Clear sync history
  clearSyncHistory(): void {
    this.state.syncHistory = [];
  }

  // Event listener management
  addEventListener(type: SyncEventType, listener: SyncEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.add(listener);
    }
  }

  removeEventListener(type: SyncEventType, listener: SyncEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  // Set conflict resolution strategy
  setConflictResolution(resolution: Partial<SyncConflictResolution>): void {
    this.conflictResolution = { ...this.conflictResolution, ...resolution };
  }

  // Private methods

  private scheduleJob(job: SyncJob): void {
    if (this.state.scheduledTimeouts.has(job.id)) {
      return; // Already scheduled
    }

    const delay = this.calculateNextRunDelay(job);
    job.nextRun = new Date(Date.now() + delay);

    const timeout = setTimeout(() => {
      this.handleScheduledSync(job.id);
    }, delay);

    this.state.scheduledTimeouts.set(job.id, timeout);
  }

  private calculateNextRunDelay(job: SyncJob): number {
    const intervalMs = job.interval * 60 * 1000; // Convert minutes to milliseconds
    
    if (!job.lastRun) {
      // First run - schedule immediately or with small delay
      return 1000; // 1 second delay
    }

    const timeSinceLastRun = Date.now() - job.lastRun.getTime();
    const remainingTime = intervalMs - timeSinceLastRun;

    return Math.max(remainingTime, 0);
  }

  private async handleScheduledSync(jobId: string): Promise<void> {
    const job = this.state.activeJobs.get(jobId);
    if (!job || !job.enabled || this.state.globalPaused || !this.state.isRunning) {
      return;
    }

    // Remove from scheduled timeouts
    this.state.scheduledTimeouts.delete(jobId);

    try {
      await this.executeSync(job);
    } catch (error) {
      console.error(`Scheduled sync failed for job ${jobId}:`, error);
    }

    // Reschedule for next run if job is still active
    if (job.enabled && this.state.isRunning && !this.state.globalPaused) {
      this.scheduleJob(job);
    }
  }

  private async executeSync(job: SyncJob): Promise<FacebookSyncResult> {
    // Check for conflicts
    if (job.status === 'running') {
      return this.handleSyncConflict(job);
    }

    // Check concurrent sync limit
    const runningCount = Array.from(this.state.activeJobs.values())
      .filter(j => j.status === 'running').length;

    if (runningCount >= this.config.maxConcurrentSyncs) {
      if (this.conflictResolution.strategy === 'queue') {
        return this.queueSync(job);
      } else {
        throw new Error('Maximum concurrent syncs reached');
      }
    }

    return this.performSync(job);
  }

  private async performSync(job: SyncJob): Promise<FacebookSyncResult> {

  const historyEntry: SyncHistoryEntry = {
      id: `${job.id}_${Date.now()}`,
      jobId: job.id,
      startTime: new Date(),
      status: 'success',
      recordsProcessed: 0,
      errors: [],
      duration: 0,
    };

    try {
      job.status = 'running';
      job.lastRun = new Date();
      job.retryCount = 0;

      this.emitEvent({
        type: 'sync_started',
        jobId: job.id,
        timestamp: new Date(),
      });

      // Execute the sync
      const result = await this.apiService.syncAllData({
        accountIds: job.accountIds,
        ...job.options,
        onProgress: (progress) => {
          // Emit progress events if needed
          this.emitEvent({
            type: 'sync_started', // Could add a progress event type
            jobId: job.id,
            timestamp: new Date(),
            data: { progress },
          });
        },
      });

      // Update job with results
      job.lastResult = result;
      job.status = 'idle';
      job.lastError = undefined;

      // Update history
      historyEntry.endTime = new Date();
      historyEntry.duration = historyEntry.endTime.getTime() - historyEntry.startTime.getTime();
      historyEntry.recordsProcessed = result.campaigns.length;
      historyEntry.errors = result.errors;
      historyEntry.status = result.errors.length > 0 ? 'failed' : 'success';

      this.state.syncHistory.push(historyEntry);
      this.state.lastGlobalSync = new Date();

      this.emitEvent({
        type: 'sync_completed',
        jobId: job.id,
        timestamp: new Date(),
        data: { result },
      });

      // Process queued syncs
      this.processQueue();

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      job.status = 'error';
      job.lastError = errorMessage;
      job.retryCount++;

      // Update history
      historyEntry.endTime = new Date();
      historyEntry.duration = historyEntry.endTime.getTime() - historyEntry.startTime.getTime();
      historyEntry.status = 'failed';
      historyEntry.errors = [errorMessage];

      this.state.syncHistory.push(historyEntry);

      this.emitEvent({
        type: 'sync_failed',
        jobId: job.id,
        timestamp: new Date(),
        error: errorMessage,
      });

      // Retry logic
      if (job.retryCount < job.maxRetries) {
        const retryDelay = this.config.retryDelay * job.retryCount;
        setTimeout(async () => {
          if (job.enabled && this.state.isRunning && !this.state.globalPaused) {
            try {
              const retryResult = await this.performSync(job);
              // Update job status on successful retry
              job.status = 'idle';
              job.lastError = undefined;
              job.lastResult = retryResult;
            } catch (retryError) {
              console.error(`Retry failed for job ${job.id}:`, retryError);
            }
          }
        }, retryDelay);
      }

      throw error;
    }
  }

  private handleSyncConflict(job: SyncJob): Promise<FacebookSyncResult> {
    switch (this.conflictResolution.strategy) {
      case 'skip':
        return Promise.reject(new Error('Sync already running, skipping'));
      
      case 'queue':
        return this.queueSync(job);
      
      case 'cancel_existing':
        this.cancelSync(job.id);
        return this.executeSync(job);
      
      default:
        return Promise.reject(new Error('Unknown conflict resolution strategy'));
    }
  }

  private async queueSync(job: SyncJob): Promise<FacebookSyncResult> {
    if (this.syncQueue.length >= this.conflictResolution.maxQueueSize) {
      throw new Error('Sync queue is full');
    }

    // Check if already queued
    const existingIndex = this.syncQueue.findIndex(item => item.jobId === job.id);
    if (existingIndex !== -1) {
      throw new Error('Sync already queued');
    }

    this.syncQueue.push({ jobId: job.id, priority: 1 });
    
    // Wait for the sync to be processed
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;
      
      const checkQueue = () => {
        const runningCount = Array.from(this.state.activeJobs.values())
          .filter(j => j.status === 'running').length;
        
        if (runningCount < this.config.maxConcurrentSyncs) {
          const queueIndex = this.syncQueue.findIndex(item => item.jobId === job.id);
          if (queueIndex !== -1) {
            this.syncQueue.splice(queueIndex, 1);
            clearTimeout(timeoutId);
            
            // Execute sync directly without going through executeSync to avoid recursion
            this.performSync(job).then(resolve).catch(reject);
            return;
          }
        }
        
        // Check again after a short delay
        setTimeout(checkQueue, 100);
      };
      
      // Set up a timeout to reject if queued too long
      timeoutId = setTimeout(() => {
        const index = this.syncQueue.findIndex(item => item.jobId === job.id);
        if (index !== -1) {
          this.syncQueue.splice(index, 1);
          reject(new Error('Queued sync timed out'));
        }
      }, 30000); // 30 seconds timeout for tests
      
      checkQueue();
    });
  }

  private processQueue(): void {
    if (this.syncQueue.length === 0) {
      return;
    }

    const runningCount = Array.from(this.state.activeJobs.values())
      .filter(j => j.status === 'running').length;

    if (runningCount >= this.config.maxConcurrentSyncs) {
      return;
    }

    // Sort queue by priority
    this.syncQueue.sort((a, b) => b.priority - a.priority);

    const nextItem = this.syncQueue.shift();
    if (nextItem) {
      const job = this.state.activeJobs.get(nextItem.jobId);
      if (job && job.enabled) {
        this.executeSync(job).catch(console.error);
      }
    }
  }

  private cancelSync(jobId: string): void {
    const job = this.state.activeJobs.get(jobId);
    if (job && job.status === 'running') {
      job.status = 'idle';
      
      this.emitEvent({
        type: 'sync_cancelled',
        jobId,
        timestamp: new Date(),
      });
    }
  }

  private cancelAllSyncs(): void {
    this.state.activeJobs.forEach((job) => {
      if (job.status === 'running') {
        this.cancelSync(job.id);
      }
    });
  }

  private runStartupSync(): void {
    // Run a sync for all enabled jobs on startup
    this.state.activeJobs.forEach((job) => {
      if (job.enabled) {
        setTimeout(() => {
          this.executeSync(job).catch(console.error);
        }, Math.random() * 10000); // Random delay up to 10 seconds to spread load
      }
    });
  }

  private emitEvent(event: SyncEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error('Error in sync event listener:', error);
        }
      });
    }
  }

  // Cleanup method
  destroy(): void {
    this.stop();
    this.eventListeners.clear();
    this.state.activeJobs.clear();
    this.syncQueue = [];
  }
}

// Create singleton instance
let schedulerInstance: FacebookSyncScheduler | null = null;

// Factory function to get scheduler instance
export function getFacebookSyncScheduler(config?: Partial<SyncSchedulerConfig>): FacebookSyncScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new FacebookSyncScheduler(undefined, config);
  }
  
  return schedulerInstance;
}

// Reset singleton instance (useful for testing)
export function resetFacebookSyncScheduler(): void {
  if (schedulerInstance) {
    schedulerInstance.destroy();
    schedulerInstance = null;
  }
}