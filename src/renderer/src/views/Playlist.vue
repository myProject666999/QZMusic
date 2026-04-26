<template>
  <div class="view-container playlist-view">
    <div class="content-wrapper">
      <div class="playlist-header">
        <div class="header-bg" :class="themeClass">
          <div class="flow-circle c1" :style="{ background: headerColor }"></div>
          <div class="flow-circle c2" :style="{ background: secondaryColor }"></div>
        </div>
        
        <div class="header-content">
          <div class="cover-box" :style="{ background: coverGradient }">
            <div class="icon-wrapper" v-if="!hasCustomCover">
              <Icon :icon="iconName" class="big-icon" />
            </div>
            <img v-else :src="playlist?.cover" class="cover-img" alt="Cover" />
          </div>
          
          <div class="info-box">
            <div class="sub-title">{{ subTitle }}</div>
            <h1 class="title">{{ title }}</h1>
            <div class="meta-info">
              <div class="avatar-row">
                <div class="user-avatar">
                  <Icon icon="lucide:user" />
                </div>
                <span class="user-name">User</span>
              </div>
              <span class="divider">•</span>
              <span class="count">{{ songCount }} 首歌曲</span>
              <span class="divider" v-if="playlist?.description">•</span>
              <span class="description" v-if="playlist?.description">{{ playlist.description }}</span>
            </div>
            
            <div class="action-row">
              <button class="play-all-btn" :style="{ background: primaryColor }" @click="handlePlayAll" :disabled="songs.length === 0">
                <Icon icon="lucide:play" class="btn-icon" />
                播放全部
              </button>
              <button class="action-btn" @click="handleDownloadAll" :disabled="songs.length === 0">
                <Icon icon="lucide:download" />
              </button>
              <button class="action-btn">
                <Icon icon="lucide:share-2" />
              </button>
              <button class="action-btn" @click="handleShowMenu" v-if="isUserPlaylist">
                <Icon icon="lucide:more-horizontal" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="song-list-container">
        <div class="list-header">
           <div class="col-index">#</div>
           <div class="col-title">标题</div>
           <div class="col-album">专辑</div>
           <div class="col-time">时长</div>
        </div>
        
        <div class="song-list">
          <div 
            class="song-item" 
            v-for="(song, i) in songs" 
            :key="song.id" 
            @dblclick="handlePlaySong(i)"
            :class="{ 'is-playing': isCurrentSong(song) }"
          >
            <div class="song-index">
              <span v-if="!isCurrentSong(song)">{{ i + 1 }}</span>
              <div v-else class="playing-indicator">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
              </div>
            </div>
            <div class="song-cover">
              <img v-if="song.picUrl" :src="song.picUrl" loading="lazy" />
              <div v-else class="cover-gradient" :style="{ background: coverGradient }"></div>
            </div>
            <div class="song-info">
              <h4 class="song-title">{{ song.name }}</h4>
              <p class="song-artist">{{ song.artist }}</p>
            </div>
            <div class="song-album">{{ song.albumName || '-' }}</div>
            <div class="song-duration">{{ song.duration }}</div>
            <div class="song-actions">
              <button class="action-icon-btn" @click.stop="handleAddToPlaylist(song)" title="添加到歌单">
                <Icon icon="lucide:plus-circle" />
              </button>
              <button class="action-icon-btn" @click.stop="handleDownloadSong(song)" title="下载">
                <Icon icon="lucide:download" />
              </button>
              <button class="action-icon-btn danger" @click.stop="handleRemoveSong(song.id)" v-if="isUserPlaylist" title="从歌单移除">
                <Icon icon="lucide:x" />
              </button>
            </div>
          </div>
        </div>

        <div class="empty-state" v-if="songs.length === 0">
          <div class="empty-icon">
            <Icon :icon="iconName" class="big-empty-icon" />
          </div>
          <p class="empty-text">歌单里还没有歌曲</p>
          <button class="empty-action-btn" @click="handleExplore">
            去发现音乐
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { usePlayerStore } from '../stores/player';
import { usePlaylistsStore } from '../stores/playlists';
import { useDownloadStore } from '../stores/download';
import { storeToRefs } from 'pinia';
import { MessagePlugin } from 'tdesign-vue-next';
import type { Song } from '../types/song';

const route = useRoute();
const router = useRouter();
const playerStore = usePlayerStore();
const playlistsStore = usePlaylistsStore();
const downloadStore = useDownloadStore();

const { currentSong, isPlaying } = storeToRefs(playerStore);

const isLiked = computed(() => route.path.includes('liked'));
const isRecent = computed(() => route.path.includes('recent'));
const isDynamicPlaylist = computed(() => route.params.id !== undefined);

const playlistId = computed(() => route.params.id as string);
const playlist = computed(() => {
  if (isDynamicPlaylist.value) {
    return playlistsStore.getPlaylistById(playlistId.value);
  }
  return null;
});

const isUserPlaylist = computed(() => playlist.value?.type === 'user');
const hasCustomCover = computed(() => playlist.value?.cover && playlist.value.cover.length > 0);

const subTitle = computed(() => {
  if (isDynamicPlaylist.value && playlist.value) {
    return playlist.value.type === 'system' ? 'SYSTEM PLAYLIST' : 'MY PLAYLIST';
  }
  return 'PLAYLIST';
});

const title = computed(() => {
  if (isLiked.value) return '我喜欢的音乐';
  if (isRecent.value) return '最近播放';
  if (playlist.value) return playlist.value.name;
  return '歌单';
});

const iconName = computed(() => {
  if (isLiked.value) return 'lucide:heart';
  if (isRecent.value) return 'lucide:clock';
  if (playlist.value?.icon) return playlist.value.icon;
  return 'lucide:music';
});

const themeClass = computed(() => {
  if (isLiked.value) return 'theme-liked';
  if (isRecent.value) return 'theme-recent';
  return 'theme-default';
});

const primaryColor = computed(() => {
  if (isLiked.value) return '#ec4141';
  if (isRecent.value) return '#a18cd1';
  if (playlist.value?.color) return playlist.value.color;
  return '#667eea';
});

const secondaryColor = computed(() => {
  if (isLiked.value) return '#f093fb';
  if (isRecent.value) return '#fbc2eb';
  return '#4facfe';
});

const headerColor = computed(() => primaryColor.value);

const coverGradient = computed(() => {
  if (isLiked.value) return 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)';
  if (isRecent.value) return 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)';
  if (playlist.value?.color) {
    return `linear-gradient(135deg, ${playlist.value.color} 0%, ${secondaryColor.value} 100%)`;
  }
  return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
});

const songs = computed((): Song[] => {
  if (isDynamicPlaylist.value && playlist.value) {
    return playlist.value.songs;
  }
  return [];
});

const songCount = computed(() => songs.value.length);

const isCurrentSong = (song: Song) => {
  return currentSong.value?.id === song.id;
};

const handlePlayAll = () => {
  if (songs.value.length > 0) {
    playerStore.setPlaylist(songs.value);
    MessagePlugin.success('已开始播放全部歌曲');
  }
};

const handlePlaySong = (index: number) => {
  playerStore.playFromList(songs.value[index], songs.value);
};

const handleDownloadAll = () => {
  if (songs.value.length === 0) return;
  for (const song of songs.value) {
    downloadStore.addDownloadTask(song);
  }
  MessagePlugin.success(`已添加 ${songs.value.length} 个下载任务`);
};

const handleDownloadSong = (song: Song) => {
  downloadStore.addDownloadTask(song);
  MessagePlugin.success('已添加到下载队列');
};

const handleAddToPlaylist = (song: Song) => {
  MessagePlugin.info('添加到歌单功能开发中...');
};

const handleRemoveSong = (songId: string) => {
  if (playlist.value) {
    playlistsStore.removeSongFromPlaylist(playlist.value.id, songId);
    MessagePlugin.success('已从歌单移除');
  }
};

const handleShowMenu = () => {
  MessagePlugin.info('歌单菜单功能开发中...');
};

const handleExplore = () => {
  router.push('/search');
};
</script>

<style scoped>
.playlist-view {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.content-wrapper {
  box-sizing: border-box;
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
}

.playlist-header {
  position: relative;
  height: 240px;
  border-radius: var(--radius-2xl);
  overflow: hidden;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  padding: 0 40px;
  box-sizing: border-box;
  box-shadow: var(--shadow-lg);
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
  z-index: 1;
}

.header-bg {
  background-image: linear-gradient(-45deg, #1e1e1e, #2a2a2a, #3a1c1c, #1a1a1a);
}

.header-bg.theme-liked {
  background-image: linear-gradient(-45deg, #2a1a1a, #4a2c2c, #3a1c1c, #1a1a1a);
}

.header-bg.theme-recent {
  background-image: linear-gradient(-45deg, #1a1a2a, #2c2c4a, #1c1c3a, #1a1a1a);
}

@keyframes gradientBG {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.flow-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;
  animation: float 10s infinite ease-in-out;
}

.c1 {
  width: 300px;
  height: 300px;
  background: #ec4141;
  top: -50px;
  left: -50px;
  animation-delay: 0s;
}

.c2 {
  width: 400px;
  height: 400px;
  background: #4facfe;
  bottom: -100px;
  right: -50px;
  animation-delay: -5s;
}

@keyframes float {
  0%, 100% { transform: translateY(0) scale(1); }
  50% { transform: translateY(20px) scale(1.1); }
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  gap: 32px;
  align-items: center;
  width: 100%;
}

.cover-box {
  width: 160px;
  height: 160px;
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  overflow: hidden;
  flex-shrink: 0;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-wrapper {
  background: rgba(255,255,255,0.2);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
}

.big-icon {
  color: #fff;
  width: 40px;
  height: 40px;
  fill: currentColor;
}

.info-box {
  flex: 1;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.sub-title {
  font-size: 12px;
  letter-spacing: 2px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.title {
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 16px;
  letter-spacing: -1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  flex-wrap: wrap;
}

.avatar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 24px;
  height: 24px;
  background: #555;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.divider {
  opacity: 0.4;
}

.description {
  opacity: 0.7;
}

.action-row {
  display: flex;
  gap: 12px;
}

.play-all-btn {
  background: #ec4141;
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: var(--radius-full);
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.play-all-btn:hover:not(:disabled) {
  transform: scale(1.05);
  filter: brightness(1.1);
}

.play-all-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.2);
  background: transparent;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.1);
  border-color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.song-list-container {
  background: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  padding: 16px;
}

.list-header {
  display: grid;
  grid-template-columns: 50px 40px 4fr 3fr 60px 100px;
  gap: 16px;
  padding: 0 16px;
  margin-bottom: 8px;
  color: var(--color-text-muted);
  font-size: 13px;
}

.list-header .col-title {
  grid-column: 3;
}

.list-header .col-album {
  grid-column: 4;
}

.list-header .col-time {
  grid-column: 5;
}

.col-index { width: 40px; text-align: center; }
.col-title { flex: 1; }
.col-album { width: 200px; }
.col-time { width: 60px; text-align: right; }

.song-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.song-item {
  box-sizing: border-box;
  display: grid;
  grid-template-columns: 50px 40px 4fr 3fr 60px 100px;
  gap: 16px;
  align-items: center;
  padding: 10px 16px;
  border-radius: var(--radius-lg);
  transition: background-color 0.2s;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.song-item:hover {
  background-color: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.song-item.is-playing {
  background-color: var(--color-accent-soft);
}

.song-item:hover .song-index {
  color: var(--color-text-primary);
}

.song-index {
  width: 40px;
  text-align: center;
  font-size: 14px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
}

.playing-indicator {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  height: 16px;
}

.playing-indicator .bar {
  width: 3px;
  background: var(--color-accent);
  border-radius: 1px;
  animation: playing-bounce 0.6s ease-in-out infinite;
}

.playing-indicator .bar:nth-child(1) { animation-delay: 0s; height: 8px; }
.playing-indicator .bar:nth-child(2) { animation-delay: 0.2s; height: 12px; }
.playing-indicator .bar:nth-child(3) { animation-delay: 0.4s; height: 6px; }

@keyframes playing-bounce {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.5); }
}

.song-cover {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #333;
  overflow: hidden;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, #667eea, #764ba2);
}

.song-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
}

.song-title {
  font-size: 15px;
  color: var(--color-text-primary);
  margin-bottom: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-album {
  font-size: 13px;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-duration {
  text-align: right;
  font-size: 13px;
  color: var(--color-text-muted);
}

.song-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.song-item:hover .song-actions {
  opacity: 1;
}

.action-icon-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-icon-btn:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-accent);
}

.action-icon-btn.danger:hover {
  color: #ec4141;
  background: rgba(236, 65, 65, 0.1);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: var(--color-text-muted);
}

.empty-icon {
  width: 100px;
  height: 100px;
  background: var(--color-bg-tertiary);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.big-empty-icon {
  width: 48px;
  height: 48px;
  color: var(--color-text-muted);
}

.empty-text {
  font-size: 15px;
  margin-bottom: 20px;
}

.empty-action-btn {
  padding: 10px 28px;
  border-radius: var(--radius-full);
  border: none;
  background: var(--color-accent);
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.empty-action-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}
</style>
