import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Song } from '../types/song';

export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'error' | 'cancelled';

export interface DownloadTask {
  id: string;
  song: Song;
  status: DownloadStatus;
  progress: number;
  totalSize: number;
  downloadedSize: number;
  speed: number;
  quality: string;
  savePath: string;
  errorMessage?: string;
  createdAt: number;
  completedAt?: number;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatSpeed = (bytesPerSecond: number): string => {
  if (bytesPerSecond === 0) return '0 KB/s';
  const k = 1024;
  const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k));
  return parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const useDownloadStore = defineStore('download', () => {
  const savedDownloads = localStorage.getItem('qz-downloads');
  
  const tasks = ref<DownloadTask[]>([]);
  const concurrentDownloads = ref(2);
  const defaultQuality = ref('standard');
  const defaultSavePath = ref('');

  if (savedDownloads) {
    try {
      const parsed = JSON.parse(savedDownloads);
      tasks.value = parsed.map((t: DownloadTask) => ({
        ...t,
        status: t.status === 'downloading' ? 'paused' : t.status
      }));
    } catch {
      tasks.value = [];
    }
  }

  const pendingTasks = computed(() => 
    tasks.value.filter(t => t.status === 'pending')
  );

  const downloadingTasks = computed(() => 
    tasks.value.filter(t => t.status === 'downloading')
  );

  const pausedTasks = computed(() => 
    tasks.value.filter(t => t.status === 'paused')
  );

  const completedTasks = computed(() => 
    tasks.value.filter(t => t.status === 'completed')
  );

  const failedTasks = computed(() => 
    tasks.value.filter(t => t.status === 'error')
  );

  const activeDownloadsCount = computed(() => 
    downloadingTasks.value.length
  );

  const totalDownloadedSize = computed(() => 
    completedTasks.value.reduce((sum, t) => sum + t.downloadedSize, 0)
  );

  const addDownloadTask = (song: Song, quality?: string, savePath?: string): DownloadTask => {
    const existingTask = tasks.value.find(t => t.song.id === song.id && t.status !== 'cancelled');
    if (existingTask) {
      return existingTask;
    }

    const task: DownloadTask = {
      id: `download_${Date.now()}_${song.id}`,
      song,
      status: 'pending',
      progress: 0,
      totalSize: 0,
      downloadedSize: 0,
      speed: 0,
      quality: quality || defaultQuality.value,
      savePath: savePath || defaultSavePath.value,
      createdAt: Date.now()
    };

    tasks.value.unshift(task);
    processPendingTasks();
    return task;
  };

  const processPendingTasks = () => {
    const availableSlots = concurrentDownloads.value - activeDownloadsCount.value;
    if (availableSlots <= 0) return;

    const toStart = pendingTasks.value.slice(0, availableSlots);
    for (const task of toStart) {
      startDownload(task.id);
    }
  };

  const startDownload = (taskId: string) => {
    const task = tasks.value.find(t => t.id === taskId);
    if (!task) return;

    if (task.status === 'downloading') return;

    if (activeDownloadsCount.value >= concurrentDownloads.value) {
      task.status = 'pending';
      return;
    }

    task.status = 'downloading';
    simulateDownload(taskId);
  };

  const pauseDownload = (taskId: string) => {
    const task = tasks.value.find(t => t.id === taskId);
    if (task && (task.status === 'downloading' || task.status === 'pending')) {
      task.status = 'paused';
      processPendingTasks();
    }
  };

  const resumeDownload = (taskId: string) => {
    const task = tasks.value.find(t => t.id === taskId);
    if (task && task.status === 'paused') {
      startDownload(taskId);
    }
  };

  const cancelDownload = (taskId: string) => {
    const task = tasks.value.find(t => t.id === taskId);
    if (task && task.status !== 'completed') {
      task.status = 'cancelled';
      processPendingTasks();
    }
  };

  const retryDownload = (taskId: string) => {
    const task = tasks.value.find(t => t.id === taskId);
    if (task && (task.status === 'error' || task.status === 'cancelled')) {
      task.status = 'pending';
      task.progress = 0;
      task.errorMessage = undefined;
      processPendingTasks();
    }
  };

  const removeTask = (taskId: string) => {
    const index = tasks.value.findIndex(t => t.id === taskId);
    if (index !== -1) {
      const task = tasks.value[index];
      if (task.status === 'downloading') {
        cancelDownload(taskId);
      }
      tasks.value.splice(index, 1);
    }
  };

  const clearCompleted = () => {
    tasks.value = tasks.value.filter(t => t.status !== 'completed');
  };

  const clearFailed = () => {
    tasks.value = tasks.value.filter(t => t.status !== 'error');
  };

  const pauseAll = () => {
    for (const task of tasks.value) {
      if (task.status === 'downloading') {
        task.status = 'paused';
      }
    }
  };

  const resumeAll = () => {
    for (const task of tasks.value) {
      if (task.status === 'paused') {
        task.status = 'pending';
      }
    }
    processPendingTasks();
  };

  const simulateDownload = (taskId: string) => {
    const task = tasks.value.find(t => t.id === taskId);
    if (!task) return;

    const totalSize = Math.floor(Math.random() * 10 * 1024 * 1024) + 2 * 1024 * 1024;
    task.totalSize = totalSize;

    const interval = setInterval(() => {
      const currentTask = tasks.value.find(t => t.id === taskId);
      if (!currentTask || currentTask.status !== 'downloading') {
        clearInterval(interval);
        return;
      }

      const chunkSize = Math.floor(Math.random() * 500 * 1024) + 100 * 1024;
      currentTask.downloadedSize = Math.min(currentTask.downloadedSize + chunkSize, totalSize);
      currentTask.progress = (currentTask.downloadedSize / totalSize) * 100;
      currentTask.speed = chunkSize / 0.5;

      if (currentTask.downloadedSize >= totalSize) {
        clearInterval(interval);
        currentTask.status = 'completed';
        currentTask.completedAt = Date.now();
        currentTask.progress = 100;
        currentTask.speed = 0;
        processPendingTasks();
      }

      if (Math.random() < 0.01) {
        clearInterval(interval);
        currentTask.status = 'error';
        currentTask.errorMessage = '网络连接中断，请重试';
        currentTask.speed = 0;
        processPendingTasks();
      }
    }, 500);
  };

  watch(tasks, (newTasks) => {
    localStorage.setItem('qz-downloads', JSON.stringify(newTasks));
  }, { deep: true });

  watch(concurrentDownloads, (newVal) => {
    localStorage.setItem('qz-download-concurrent', newVal.toString());
  });

  watch(defaultQuality, (newVal) => {
    localStorage.setItem('qz-download-quality', newVal);
  });

  const savedConcurrent = localStorage.getItem('qz-download-concurrent');
  if (savedConcurrent) {
    concurrentDownloads.value = parseInt(savedConcurrent, 10);
  }

  const savedQuality = localStorage.getItem('qz-download-quality');
  if (savedQuality) {
    defaultQuality.value = savedQuality;
  }

  return {
    tasks,
    concurrentDownloads,
    defaultQuality,
    defaultSavePath,
    pendingTasks,
    downloadingTasks,
    pausedTasks,
    completedTasks,
    failedTasks,
    activeDownloadsCount,
    totalDownloadedSize,
    formatFileSize,
    formatSpeed,
    addDownloadTask,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    retryDownload,
    removeTask,
    clearCompleted,
    clearFailed,
    pauseAll,
    resumeAll
  };
});
