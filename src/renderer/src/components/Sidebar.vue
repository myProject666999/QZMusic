<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <div class="logo-area">
        <div class="logo-icon">🎶</div>
        <span class="app-name">QZ Music</span>
      </div>
    </div>

    <div class="nav-section">
      <router-link to="/" class="nav-item" active-class="active">
        <Icon icon="lucide:home" class="nav-icon" />
        <span class="nav-text">推荐</span>
      </router-link>
      <router-link to="/local" class="nav-item" active-class="active">
        <Icon icon="lucide:hard-drive" class="nav-icon" />
        <span class="nav-text">本地音乐</span>
      </router-link>
    </div>

    <div class="divider"></div>

    <div class="nav-section">
      <div class="section-title">我的音乐</div>
      <router-link to="/liked" class="nav-item" active-class="active">
        <Icon icon="lucide:heart" class="nav-icon" />
        <span class="nav-text">我喜欢的</span>
      </router-link>
      <router-link to="/recent" class="nav-item" active-class="active">
        <Icon icon="lucide:clock" class="nav-icon" />
        <span class="nav-text">最近播放</span>
      </router-link>
      <router-link to="/download" class="nav-item" active-class="active">
        <Icon icon="lucide:download" class="nav-icon" />
        <span class="nav-text">下载管理</span>
        <span class="download-badge" v-if="activeDownloadsCount > 0">
          {{ activeDownloadsCount }}
        </span>
      </router-link>
    </div>

    <div class="divider"></div>

    <div class="nav-section">
      <div class="section-header" @click="togglePlaylists">
        <span class="section-title">我的歌单</span>
        <Icon 
          icon="lucide:chevron-down" 
          class="collapse-icon"
          :class="{ 'collapsed': !isPlaylistsOpen }"
        />
      </div>
      
      <div class="playlists-list" v-show="isPlaylistsOpen">
        <div 
          class="nav-item playlist-item system" 
          v-for="playlist in systemPlaylists" 
          :key="playlist.id"
          @click="handleSystemPlaylistClick(playlist)"
        >
          <div class="playlist-cover" :style="{ background: playlist.color }">
            <Icon :icon="playlist.icon || 'lucide:music'" />
          </div>
          <span class="nav-text">{{ playlist.name }}</span>
          <span class="song-count" v-if="playlist.songs.length > 0">
            {{ playlist.songs.length }}
          </span>
        </div>

        <div 
          class="nav-item playlist-item" 
          v-for="playlist in userPlaylists" 
          :key="playlist.id"
          @click="handlePlaylistClick(playlist)"
          @contextmenu.prevent="showPlaylistMenu(playlist, $event)"
        >
          <div class="playlist-cover" :style="{ background: playlist.color }">
            <Icon :icon="playlist.icon || 'lucide:music'" />
          </div>
          <span class="nav-text">{{ playlist.name }}</span>
          <span class="song-count" v-if="playlist.songs.length > 0">
            {{ playlist.songs.length }}
          </span>
        </div>

        <div class="nav-item create-playlist" @click="showCreateDialog = true">
          <Icon icon="lucide:plus" class="nav-icon" />
          <span class="nav-text">新建歌单</span>
        </div>
      </div>
    </div>

    <transition name="fade">
      <div class="create-dialog-overlay" v-if="showCreateDialog" @click.self="closeCreateDialog">
        <div class="create-dialog">
          <div class="dialog-header">
            <h3 class="dialog-title">新建歌单</h3>
            <button class="close-btn" @click="closeCreateDialog">
              <Icon icon="lucide:x" />
            </button>
          </div>
          <div class="dialog-body">
            <div class="form-group">
              <label class="form-label">歌单名称</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="newPlaylistName" 
                placeholder="请输入歌单名称"
                maxlength="30"
                @keyup.enter="createNewPlaylist"
                ref="nameInputRef"
              />
            </div>
            <div class="form-group">
              <label class="form-label">选择颜色</label>
              <div class="color-options">
                <button 
                  v-for="color in colorOptions" 
                  :key="color"
                  class="color-option"
                  :class="{ selected: selectedColor === color }"
                  :style="{ background: color }"
                  @click="selectedColor = color"
                >
                  <Icon icon="lucide:check" class="check-icon" v-if="selectedColor === color" />
                </button>
              </div>
            </div>
          </div>
          <div class="dialog-footer">
            <button class="cancel-btn" @click="closeCreateDialog">取消</button>
            <button class="confirm-btn" @click="createNewPlaylist" :disabled="!newPlaylistName.trim()">
              创建
            </button>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div 
        class="context-menu" 
        v-if="contextMenu.show" 
        :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
        ref="contextMenuRef"
      >
        <div class="context-menu-item" @click="handleRenamePlaylist">
          <Icon icon="lucide:edit-2" class="menu-icon" />
          重命名
        </div>
        <div class="context-menu-item" @click="handleClearPlaylist">
          <Icon icon="lucide:trash-2" class="menu-icon" />
          清空歌单
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item danger" @click="handleDeletePlaylist">
          <Icon icon="lucide:trash" class="menu-icon" />
          删除歌单
        </div>
      </div>
    </transition>

    <transition name="fade">
      <div class="rename-dialog-overlay" v-if="showRenameDialog" @click.self="closeRenameDialog">
        <div class="rename-dialog">
          <div class="dialog-header">
            <h3 class="dialog-title">重命名歌单</h3>
            <button class="close-btn" @click="closeRenameDialog">
              <Icon icon="lucide:x" />
            </button>
          </div>
          <div class="dialog-body">
            <div class="form-group">
              <label class="form-label">新歌单名称</label>
              <input 
                type="text" 
                class="form-input" 
                v-model="renamePlaylistName" 
                placeholder="请输入新名称"
                maxlength="30"
                @keyup.enter="confirmRename"
                ref="renameInputRef"
              />
            </div>
          </div>
          <div class="dialog-footer">
            <button class="cancel-btn" @click="closeRenameDialog">取消</button>
            <button class="confirm-btn" @click="confirmRename" :disabled="!renamePlaylistName.trim()">
              确定
            </button>
          </div>
        </div>
      </div>
    </transition>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next';
import { usePlaylistsStore, type Playlist } from '../stores/playlists';
import { useDownloadStore } from '../stores/download';

const router = useRouter();
const playlistsStore = usePlaylistsStore();
const downloadStore = useDownloadStore();

const { systemPlaylists, userPlaylists } = storeToRefs(playlistsStore);
const { createPlaylist, updatePlaylist, clearPlaylist, deletePlaylist, getPlaylistById } = playlistsStore;
const { activeDownloadsCount } = storeToRefs(downloadStore);

const isPlaylistsOpen = ref(true);
const showCreateDialog = ref(false);
const newPlaylistName = ref('');
const selectedColor = ref('#667eea');
const nameInputRef = ref<HTMLInputElement | null>(null);

const showRenameDialog = ref(false);
const renamePlaylistName = ref('');
const renameInputRef = ref<HTMLInputElement | null>(null);

const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  playlist: null as Playlist | null
});

const colorOptions = ['#ec4141', '#667eea', '#4facfe', '#f093fb', '#43e97b', '#fa709a', '#fee140', '#30cfd0'];

const togglePlaylists = () => {
  isPlaylistsOpen.value = !isPlaylistsOpen.value;
};

const handleSystemPlaylistClick = (playlist: Playlist) => {
  if (playlist.id === 'driving') {
    router.push('/driving');
  } else if (playlist.id === 'relax') {
    router.push('/relax');
  } else {
    router.push(`/playlist/${playlist.id}`);
  }
};

const handlePlaylistClick = (playlist: Playlist) => {
  router.push(`/playlist/${playlist.id}`);
};

const showPlaylistMenu = (playlist: Playlist, event: MouseEvent) => {
  event.stopPropagation();
  contextMenu.value = {
    show: true,
    x: event.clientX,
    y: event.clientY,
    playlist
  };
};

const closeContextMenu = () => {
  contextMenu.value.show = false;
};

const handleRenamePlaylist = () => {
  if (contextMenu.value.playlist) {
    renamePlaylistName.value = contextMenu.value.playlist.name;
    showRenameDialog.value = true;
    closeContextMenu();
    nextTick(() => {
      renameInputRef.value?.focus();
      renameInputRef.value?.select();
    });
  }
};

const confirmRename = () => {
  if (contextMenu.value.playlist && renamePlaylistName.value.trim()) {
    updatePlaylist(contextMenu.value.playlist.id, {
      name: renamePlaylistName.value.trim()
    });
    MessagePlugin.success('歌单已重命名');
    closeRenameDialog();
  }
};

const handleClearPlaylist = () => {
  if (contextMenu.value.playlist) {
    DialogPlugin.confirm({
      header: '清空歌单',
      body: `确定要清空歌单"${contextMenu.value.playlist.name}"吗？`,
      confirmBtn: '确定',
      cancelBtn: '取消',
      onConfirm: () => {
        clearPlaylist(contextMenu.value.playlist!.id);
        MessagePlugin.success('歌单已清空');
      }
    });
    closeContextMenu();
  }
};

const handleDeletePlaylist = () => {
  if (contextMenu.value.playlist) {
    DialogPlugin.confirm({
      header: '删除歌单',
      body: `确定要删除歌单"${contextMenu.value.playlist.name}"吗？此操作不可恢复。`,
      confirmBtn: '删除',
      cancelBtn: '取消',
      theme: 'danger',
      onConfirm: () => {
        deletePlaylist(contextMenu.value.playlist!.id);
        MessagePlugin.success('歌单已删除');
      }
    });
    closeContextMenu();
  }
};

watch(showCreateDialog, (val) => {
  if (val) {
    newPlaylistName.value = '';
    selectedColor.value = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    nextTick(() => {
      nameInputRef.value?.focus();
    });
  }
});

const closeCreateDialog = () => {
  showCreateDialog.value = false;
};

const closeRenameDialog = () => {
  showRenameDialog.value = false;
  renamePlaylistName.value = '';
};

const createNewPlaylist = () => {
  if (!newPlaylistName.value.trim()) {
    MessagePlugin.warning('请输入歌单名称');
    return;
  }

  const playlist = createPlaylist(newPlaylistName.value.trim(), '');
  playlist.color = selectedColor.value;
  MessagePlugin.success(`歌单 "${playlist.name}" 创建成功`);
  closeCreateDialog();
  
  router.push(`/playlist/${playlist.id}`);
};

document.addEventListener('click', () => {
  closeContextMenu();
});
</script>

<style scoped>
.sidebar {
  box-sizing: border-box;
  width: var(--sidebar-width);
  height: 100vh;
  background-color: var(--color-bg-secondary);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 3px;
  transition: background 0.2s ease;
}

.sidebar:hover::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
}

.sidebar:hover::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-muted);
}

.sidebar-header {
  padding: 8px 8px 24px;
  margin-bottom: 8px;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: var(--radius-lg);
  transition: all var(--transition-base);
}

.logo-area:hover {
  background-color: var(--color-bg-tertiary);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ec4141, #ff6b6b);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  font-weight: bold;
  box-shadow: var(--shadow-sm);
}

.app-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: -0.02em;
}

.nav-section {
  margin-bottom: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
  text-decoration: none;
  position: relative;
  overflow: hidden;
}

.nav-item:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.nav-item.active {
  background-color: var(--color-accent-soft);
  color: var(--color-accent);
  font-weight: 500;
}

.nav-icon {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  flex-shrink: 0;
  transition: transform var(--transition-base);
}

.nav-text {
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.download-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--color-accent);
  color: white;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
}

.divider {
  height: 1px;
  background: linear-gradient(to right, transparent, var(--color-border), transparent);
  margin: 16px 8px;
  opacity: 0.6;
  flex-shrink: 0;
}

.section-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  margin-bottom: 8px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all var(--transition-base);
  border-radius: var(--radius-md);
}

.section-header:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-tertiary);
}

.collapse-icon {
  transition: transform var(--transition-base);
  width: 16px;
  height: 16px;
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.playlists-list {
  overflow-y: auto;
}

.playlist-item {
  padding: 10px 16px;
  display: flex;
  align-items: center;
}

.playlist-cover {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: white;
  font-size: 14px;
  box-shadow: var(--shadow-sm);
  flex-shrink: 0;
}

.playlist-item:hover .playlist-cover {
  transform: scale(1.05);
  box-shadow: var(--shadow-md);
}

.song-count {
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-bg-tertiary);
  padding: 2px 6px;
  border-radius: 4px;
}

.create-playlist {
  color: var(--color-text-muted);
  margin-top: 8px;
  border: 1px dashed var(--color-border-light);
}

.create-playlist:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
  background-color: var(--color-accent-soft);
}

.create-dialog-overlay,
.rename-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.create-dialog,
.rename-dialog {
  background: var(--color-bg-primary);
  border-radius: var(--radius-xl);
  width: 400px;
  max-width: 90vw;
  box-shadow: var(--shadow-elevated);
  overflow: hidden;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.dialog-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.close-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.dialog-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 10px;
}

.form-input {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  font-size: 14px;
  transition: all var(--transition-base);
}

.form-input:focus {
  outline: none;
  border-color: var(--color-accent);
  box-shadow: 0 0 0 3px var(--color-accent-soft);
}

.color-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.color-option {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-base);
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: var(--color-text-primary);
}

.check-icon {
  color: white;
  width: 16px;
  height: 16px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--color-border);
}

.cancel-btn {
  padding: 10px 24px;
  border-radius: var(--radius-full);
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.cancel-btn:hover {
  border-color: var(--color-text-muted);
  color: var(--color-text-primary);
}

.confirm-btn {
  padding: 10px 28px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--color-accent);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
}

.confirm-btn:hover:not(:disabled) {
  filter: brightness(1.1);
}

.confirm-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.context-menu {
  position: fixed;
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-elevated);
  border: 1px solid var(--color-border);
  padding: 8px;
  min-width: 160px;
  z-index: 2000;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  color: var(--color-text-secondary);
  transition: all var(--transition-base);
}

.context-menu-item:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.context-menu-item.danger:hover {
  background: rgba(236, 65, 65, 0.1);
  color: #ec4141;
}

.menu-icon {
  width: 16px;
  height: 16px;
}

.context-menu-divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
