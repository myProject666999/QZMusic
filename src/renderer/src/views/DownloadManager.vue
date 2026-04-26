<template>
  <div class="view-container download-view">
    <div class="content-wrapper">
      <div class="download-header">
        <div class="header-left">
          <h1 class="page-title">下载管理</h1>
          <span class="download-stats">
            正在下载 {{ downloadingTasks.length }} 个 · 已完成 {{ completedTasks.length }} 个
          </span>
        </div>
        <div class="header-actions">
          <button class="action-btn" @click="handlePauseAll" :disabled="downloadingTasks.length === 0">
            <Icon icon="lucide:pause" class="btn-icon" />
            全部暂停
          </button>
          <button class="action-btn primary" @click="handleResumeAll" :disabled="pausedTasks.length === 0">
            <Icon icon="lucide:play" class="btn-icon" />
            全部继续
          </button>
        </div>
      </div>

      <div class="tab-navigation">
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'all' }"
          @click="activeTab = 'all'"
        >
          全部任务
          <span class="tab-count">{{ tasks.length }}</span>
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'downloading' }"
          @click="activeTab = 'downloading'"
        >
          下载中
          <span class="tab-count" v-if="activeDownloadsCount > 0">{{ activeDownloadsCount }}</span>
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'completed' }"
          @click="activeTab = 'completed'"
        >
          已完成
          <span class="tab-count">{{ completedTasks.length }}</span>
        </button>
        <button 
          class="tab-btn" 
          :class="{ active: activeTab === 'failed' }"
          @click="activeTab = 'failed'"
        >
          失败
          <span class="tab-count" v-if="failedTasks.length > 0">{{ failedTasks.length }}</span>
        </button>
      </div>

      <div class="settings-panel">
        <div class="setting-item">
          <span class="setting-label">同时下载数量:</span>
          <div class="download-count-selector">
            <button 
              v-for="count in [1, 2, 3, 5]" 
              :key="count"
              class="count-btn"
              :class="{ active: concurrentDownloads === count }"
              @click="concurrentDownloads = count"
            >
              {{ count }}
            </button>
          </div>
        </div>
        <div class="setting-item">
          <span class="setting-label">默认音质:</span>
          <select class="quality-select" v-model="defaultQuality">
            <option value="standard">标准</option>
            <option value="higher">较高</option>
            <option value="exhigh">极高</option>
            <option value="lossless">无损</option>
          </select>
        </div>
        <button class="clear-btn" @click="handleClearCompleted" v-if="completedTasks.length > 0">
          <Icon icon="lucide:trash-2" class="btn-icon" />
          清空已完成
        </button>
      </div>

      <div class="download-list">
        <div 
          class="download-item" 
          v-for="task in filteredTasks" 
          :key="task.id"
          :class="{ 'is-error': task.status === 'error' }"
        >
          <div class="song-cover">
            <img v-if="task.song.picUrl" :src="task.song.picUrl" loading="lazy" />
            <div v-else class="cover-placeholder">
              <Icon icon="lucide:music" class="music-icon" />
            </div>
          </div>

          <div class="song-info">
            <h4 class="song-title">{{ task.song.name }}</h4>
            <p class="song-artist">{{ task.song.artist }}</p>
            
            <div class="progress-area" v-if="task.status === 'downloading' || task.status === 'pending'">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: task.progress + '%' }"></div>
              </div>
              <div class="progress-info">
                <span class="progress-percent">{{ Math.floor(task.progress) }}%</span>
                <span class="progress-speed" v-if="task.status === 'downloading'">
                  {{ formatSpeed(task.speed) }}
                </span>
                <span class="progress-size">
                  {{ formatFileSize(task.downloadedSize) }} / {{ formatFileSize(task.totalSize) }}
                </span>
              </div>
            </div>

            <div class="status-message" v-else>
              <span class="status-badge" :class="getStatusClass(task.status)">
                <Icon :icon="getStatusIcon(task.status)" class="status-icon" />
                {{ getStatusText(task.status) }}
              </span>
              <span class="file-size" v-if="task.status === 'completed'">
                {{ formatFileSize(task.downloadedSize) }}
              </span>
              <span class="error-text" v-if="task.status === 'error' && task.errorMessage">
                {{ task.errorMessage }}
              </span>
            </div>
          </div>

          <div class="item-actions">
            <button 
              class="action-icon-btn" 
              v-if="task.status === 'downloading'"
              @click="pauseDownload(task.id)"
              title="暂停"
            >
              <Icon icon="lucide:pause" />
            </button>
            <button 
              class="action-icon-btn" 
              v-if="task.status === 'paused'"
              @click="resumeDownload(task.id)"
              title="继续"
            >
              <Icon icon="lucide:play" />
            </button>
            <button 
              class="action-icon-btn retry" 
              v-if="task.status === 'error'"
              @click="retryDownload(task.id)"
              title="重试"
            >
              <Icon icon="lucide:refresh-cw" />
            </button>
            <button 
              class="action-icon-btn danger" 
              @click="handleRemoveTask(task)"
              title="删除"
            >
              <Icon icon="lucide:x" />
            </button>
          </div>
        </div>

        <div class="empty-state" v-if="filteredTasks.length === 0">
          <div class="empty-icon">
            <Icon icon="lucide:download" class="big-icon" />
          </div>
          <p class="empty-text">{{ getEmptyText() }}</p>
        </div>
      </div>

      <div class="test-actions" v-if="activeTab === 'downloading' || activeTab === 'all'">
        <button class="test-btn" @click="addTestDownloads">
          <Icon icon="lucide:plus" class="btn-icon" />
          添加测试下载任务
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Icon } from '@iconify/vue';
import { useDownloadStore, type DownloadTask } from '../stores/download';
import { storeToRefs } from 'pinia';
import { MessagePlugin } from 'tdesign-vue-next';

const downloadStore = useDownloadStore();

const {
  tasks,
  concurrentDownloads,
  defaultQuality,
  downloadingTasks,
  pausedTasks,
  completedTasks,
  failedTasks,
  activeDownloadsCount
} = storeToRefs(downloadStore);

const {
  formatFileSize,
  formatSpeed,
  addDownloadTask,
  pauseDownload,
  resumeDownload,
  retryDownload,
  removeTask,
  clearCompleted,
  pauseAll,
  resumeAll
} = downloadStore;

const activeTab = ref<'all' | 'downloading' | 'completed' | 'failed'>('all');

const filteredTasks = computed(() => {
  switch (activeTab.value) {
    case 'downloading':
      return tasks.value.filter(t => t.status === 'downloading' || t.status === 'pending');
    case 'completed':
      return completedTasks.value;
    case 'failed':
      return failedTasks.value;
    default:
      return tasks.value.filter(t => t.status !== 'cancelled');
  }
});

const getStatusIcon = (status: DownloadTask['status']) => {
  const icons: Record<string, string> = {
    pending: 'lucide:clock',
    downloading: 'lucide:loader-2',
    paused: 'lucide:pause',
    completed: 'lucide:check',
    error: 'lucide:alert-circle',
    cancelled: 'lucide:x'
  };
  return icons[status] || 'lucide:music';
};

const getStatusText = (status: DownloadTask['status']) => {
  const texts: Record<string, string> = {
    pending: '等待中',
    downloading: '下载中',
    paused: '已暂停',
    completed: '已完成',
    error: '下载失败',
    cancelled: '已取消'
  };
  return texts[status] || '未知';
};

const getStatusClass = (status: DownloadTask['status']) => {
  const classes: Record<string, string> = {
    pending: 'status-pending',
    downloading: 'status-downloading',
    paused: 'status-paused',
    completed: 'status-completed',
    error: 'status-error',
    cancelled: 'status-cancelled'
  };
  return classes[status] || '';
};

const getEmptyText = () => {
  switch (activeTab.value) {
    case 'downloading':
      return '当前没有正在下载的任务';
    case 'completed':
      return '暂无已完成的下载任务';
    case 'failed':
      return '暂无失败的下载任务';
    default:
      return '暂无下载任务';
  }
};

const handlePauseAll = () => {
  pauseAll();
  MessagePlugin.success('已暂停所有下载');
};

const handleResumeAll = () => {
  resumeAll();
  MessagePlugin.success('已恢复所有下载');
};

const handleClearCompleted = () => {
  clearCompleted();
  MessagePlugin.success('已清空已完成的任务');
};

const handleRemoveTask = (task: DownloadTask) => {
  if (task.status === 'downloading' || task.status === 'pending') {
    MessagePlugin.confirm({
      content: '确定要删除这个下载任务吗？',
      confirmBtn: '确定',
      cancelBtn: '取消',
      onConfirm: () => {
        removeTask(task.id);
        MessagePlugin.success('已删除任务');
      }
    });
  } else {
    removeTask(task.id);
  }
};

const addTestDownloads = () => {
  const testSongs = [
    { id: 'test1', name: '测试歌曲1', artist: '歌手A', picUrl: '', url: '', source: 'test', type: 'Local' as const, duration: '03:30' },
    { id: 'test2', name: '测试歌曲2', artist: '歌手B', picUrl: '', url: '', source: 'test', type: 'Local' as const, duration: '04:15' },
    { id: 'test3', name: '测试歌曲3', artist: '歌手C', picUrl: '', url: '', source: 'test', type: 'Local' as const, duration: '02:45' }
  ];

  for (const song of testSongs) {
    addDownloadTask(song);
  }
  MessagePlugin.success('已添加3个测试下载任务');
};
</script>

<style scoped>
.download-view {
  width: 100%;
  height: 100%;
}

.content-wrapper {
  box-sizing: border-box;
  padding: 20px 30px;
}

.download-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-primary);
  position: relative;
  padding-left: 16px;
}

.page-title::before {
  content: "";
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 70%;
  background-color: var(--color-accent);
  border-radius: 4px;
}

.download-stats {
  font-size: 13px;
  color: var(--color-text-muted);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.action-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background-color: var(--color-accent-soft);
}

.action-btn.primary {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.action-btn.primary:hover:not(:disabled) {
  filter: brightness(1.1);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

.tab-navigation {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  background: var(--color-bg-secondary);
  padding: 4px;
  border-radius: var(--radius-xl);
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: var(--radius-lg);
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.tab-btn:hover {
  color: var(--color-text-primary);
}

.tab-btn.active {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--color-accent);
  color: white;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
}

.settings-panel {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  align-items: center;
  padding: 16px 20px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  margin-bottom: 24px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-label {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.download-count-selector {
  display: flex;
  gap: 8px;
}

.count-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.count-btn:hover {
  border-color: var(--color-accent);
}

.count-btn.active {
  background: var(--color-accent);
  color: white;
  border-color: var(--color-accent);
}

.quality-select {
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-base);
}

.quality-select:hover {
  border-color: var(--color-accent);
}

.clear-btn {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--transition-base);
}

.clear-btn:hover {
  border-color: #ec4141;
  color: #ec4141;
  background: rgba(236, 65, 65, 0.1);
}

.download-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.download-item {
  display: flex;
  align-items: center;
  padding: 16px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  transition: all var(--transition-base);
  border: 1px solid transparent;
}

.download-item:hover {
  background: var(--color-bg-tertiary);
}

.download-item.is-error {
  border-color: rgba(236, 65, 65, 0.3);
  background: rgba(236, 65, 65, 0.05);
}

.song-cover {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: var(--color-bg-tertiary);
  flex-shrink: 0;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.music-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.song-info {
  flex: 1;
  min-width: 0;
  margin-left: 16px;
}

.song-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-bottom: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-area {
  width: 100%;
}

.progress-bar {
  height: 4px;
  background: var(--color-bg-tertiary);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: 2px;
  transition: width 0.3s ease;
}

.progress-info {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.progress-percent {
  color: var(--color-accent);
  font-weight: 600;
}

.progress-speed {
  color: var(--color-text-secondary);
}

.status-message {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  font-size: 13px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-md);
  font-size: 12px;
  font-weight: 500;
}

.status-icon {
  width: 14px;
  height: 14px;
}

.status-downloading {
  background: rgba(79, 172, 254, 0.1);
  color: #4facfe;
}

.status-pending {
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}

.status-paused {
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
}

.status-completed {
  background: rgba(67, 233, 123, 0.1);
  color: #43e97b;
}

.status-error {
  background: rgba(236, 65, 65, 0.1);
  color: #ec4141;
}

.status-cancelled {
  background: var(--color-bg-tertiary);
  color: var(--color-text-muted);
}

.file-size {
  color: var(--color-text-muted);
}

.error-text {
  color: #ec4141;
}

.item-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 16px;
}

.action-icon-btn {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: none;
  background: var(--color-bg-tertiary);
  color: var(--color-text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.action-icon-btn:hover {
  background: var(--color-accent-soft);
  color: var(--color-accent);
}

.action-icon-btn.retry:hover {
  background: rgba(67, 233, 123, 0.1);
  color: #43e97b;
}

.action-icon-btn.danger:hover {
  background: rgba(236, 65, 65, 0.1);
  color: #ec4141;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--color-text-muted);
}

.empty-icon {
  width: 80px;
  height: 80px;
  background: var(--color-bg-secondary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.big-icon {
  width: 40px;
  height: 40px;
  color: var(--color-text-muted);
}

.empty-text {
  font-size: 15px;
}

.test-actions {
  margin-top: 24px;
  padding: 16px 20px;
  background: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  border: 1px dashed var(--color-border);
}

.test-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--color-accent);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.test-btn:hover {
  filter: brightness(1.1);
}
</style>
