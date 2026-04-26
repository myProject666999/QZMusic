<template>
  <div class="driving-mode">
    <div class="background-overlay">
      <div class="animated-circles">
        <div class="circle c1" :class="{ active: isPlaying }"></div>
        <div class="circle c2" :class="{ active: isPlaying }"></div>
        <div class="circle c3" :class="{ active: isPlaying }"></div>
      </div>
    </div>

    <div class="driving-content">
      <div class="header-bar">
        <button class="back-btn" @click="handleBack">
          <Icon icon="lucide:chevron-left" class="back-icon" />
        </button>
        <h1 class="page-title">驾驶模式</h1>
        <div class="header-spacer"></div>
      </div>

      <div class="main-display">
        <div class="album-display" :class="{ rotating: isPlaying }">
          <div class="album-container">
            <img 
              v-if="currentSong?.picUrl" 
              :src="currentSong.picUrl" 
              class="album-art"
              loading="lazy"
            />
            <div v-else class="album-placeholder">
              <Icon icon="lucide:music" class="placeholder-icon" />
            </div>
          </div>
          <div class="vinyl-ring" v-if="currentSong?.picUrl"></div>
        </div>

        <div class="song-info">
          <h2 class="song-title">{{ currentSong?.name || '未播放' }}</h2>
          <p class="song-artist">{{ currentSong?.artist || '未知歌手' }}</p>
        </div>
      </div>

      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
          <div 
            class="progress-thumb" 
            :style="{ left: progressPercent + '%' }"
          ></div>
        </div>
        <div class="time-display">
          <span class="time current">{{ formatTime(currentTime) }}</span>
          <span class="time total">{{ formatTime(duration) }}</span>
        </div>
      </div>

      <div class="controls-section">
        <button class="control-btn" @click="handlePrev">
          <Icon icon="lucide:skip-back" class="control-icon" />
          <span class="control-label">上一首</span>
        </button>

        <button class="play-btn main" @click="handleTogglePlay">
          <Icon :icon="isPlaying ? 'lucide:pause' : 'lucide:play'" class="play-icon" />
        </button>

        <button class="control-btn" @click="handleNext">
          <Icon icon="lucide:skip-forward" class="control-icon" />
          <span class="control-label">下一首</span>
        </button>
      </div>

      <div class="bottom-controls">
        <div class="volume-control">
          <button class="volume-btn" @click="handleVolumeDown">
            <Icon icon="lucide:volume-1" class="volume-icon" />
          </button>
          <div class="volume-slider">
            <div class="volume-track">
              <div class="volume-fill" :style="{ width: volume + '%' }"></div>
            </div>
          </div>
          <button class="volume-btn" @click="handleVolumeUp">
            <Icon icon="lucide:volume-2" class="volume-icon" />
          </button>
        </div>

        <div class="mode-controls">
          <button class="mode-btn" :class="{ active: playMode === 'list' }" @click="handleToggleMode">
            <Icon :icon="modeIcon" class="mode-icon" />
            <span class="mode-label">{{ modeLabel }}</span>
          </button>
          <button class="mode-btn" @click="handleVoiceHint">
            <Icon icon="lucide:mic" class="mode-icon" />
            <span class="mode-label">语音</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { usePlayerStore, PlayMode } from '../stores/player';
import { storeToRefs } from 'pinia';
import { MessagePlugin } from 'tdesign-vue-next';

const router = useRouter();
const playerStore = usePlayerStore();

const { isPlaying, currentSong, currentTime, duration, volume, playMode, playlist } = storeToRefs(playerStore);

const volumeDisplay = ref(volume.value);

watch(volume, (newVal) => {
  volumeDisplay.value = newVal;
});

const progressPercent = computed(() => {
  if (!duration.value || duration.value === 0) return 0;
  return (currentTime.value / duration.value) * 100;
});

const modeIcon = computed(() => {
  switch (playMode.value) {
    case PlayMode.Single: return 'lucide:repeat-1';
    case PlayMode.Random: return 'lucide:shuffle';
    default: return 'lucide:repeat';
  }
});

const modeLabel = computed(() => {
  switch (playMode.value) {
    case PlayMode.Single: return '单曲';
    case PlayMode.Random: return '随机';
    default: return '列表';
  }
});

const handleBack = () => {
  router.back();
};

const handleTogglePlay = () => {
  if (!currentSong.value && playlist.value.length > 0) {
    playerStore.playSong(playlist.value[0]);
  } else {
    playerStore.togglePlay();
  }
};

const handleNext = () => {
  playerStore.next();
};

const handlePrev = () => {
  playerStore.prev();
};

const handleVolumeUp = () => {
  const newVol = Math.min(100, volume.value + 10);
  playerStore.setVolume(newVol);
};

const handleVolumeDown = () => {
  const newVol = Math.max(0, volume.value - 10);
  playerStore.setVolume(newVol);
};

const handleToggleMode = () => {
  playerStore.toggleMode();
  const labels: Record<PlayMode, string> = {
    [PlayMode.List]: '列表循环',
    [PlayMode.Single]: '单曲循环',
    [PlayMode.Random]: '随机播放'
  };
  MessagePlugin.info(labels[playMode.value]);
};

const handleVoiceHint = () => {
  MessagePlugin.info('语音控制功能开发中...');
};

const formatTime = (ms2: number) => {
  const ms = Math.floor(ms2 / 1000);
  if (!ms || isNaN(ms)) return '00:00';
  const m = Math.floor(ms / 60);
  const s = Math.floor(ms % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
</script>

<style scoped>
.driving-mode {
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 50%, #0f0f23 100%);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

.background-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.animated-circles {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circle {
  position: absolute;
  border-radius: 50%;
  border: 2px solid rgba(79, 172, 254, 0.1);
  transform: scale(0.8);
  opacity: 0;
  transition: all 0.8s ease;
}

.circle.active {
  opacity: 1;
  animation: pulse-ring 3s ease-in-out infinite;
}

.c1 {
  width: 400px;
  height: 400px;
  animation-delay: 0s;
}

.c2 {
  width: 500px;
  height: 500px;
  animation-delay: 0.5s;
}

.c3 {
  width: 600px;
  height: 600px;
  animation-delay: 1s;
}

@keyframes pulse-ring {
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.6;
  }
}

.driving-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 20px 40px;
  box-sizing: border-box;
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-shrink: 0;
}

.back-btn {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.back-icon {
  width: 28px;
  height: 28px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: white;
  letter-spacing: 2px;
}

.header-spacer {
  width: 56px;
}

.main-display {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
}

.album-display {
  position: relative;
  width: 280px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.album-container {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 0 60px rgba(79, 172, 254, 0.3);
  z-index: 2;
}

.album-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #2a2a4a, #1a1a3a);
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-icon {
  width: 64px;
  height: 64px;
  color: rgba(255, 255, 255, 0.3);
}

.vinyl-ring {
  position: absolute;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  border: 3px solid rgba(79, 172, 254, 0.2);
  background: transparent;
}

.album-display.rotating .album-container {
  animation: spin 20s linear infinite;
}

.album-display.rotating .vinyl-ring {
  animation: spin 15s linear infinite reverse;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.song-info {
  text-align: center;
}

.song-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.song-artist {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.6);
}

.progress-section {
  flex-shrink: 0;
  margin: 20px 0;
  padding: 0 20px;
}

.progress-bar {
  position: relative;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
}

.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #4facfe, #00f2fe);
  border-radius: 4px;
  transition: width 0.1s ease;
}

.progress-thumb {
  position: absolute;
  top: 50%;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
  transition: left 0.1s ease;
}

.time-display {
  display: flex;
  justify-content: space-between;
  margin-top: 12px;
  padding: 0 4px;
}

.time {
  font-size: 16px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
}

.time.current {
  color: #4facfe;
}

.controls-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 60px;
  flex-shrink: 0;
  margin: 20px 0;
}

.control-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: white;
  transition: all 0.3s ease;
}

.control-btn:hover {
  transform: scale(1.1);
}

.control-icon {
  width: 40px;
  height: 40px;
  color: rgba(255, 255, 255, 0.8);
}

.control-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
}

.play-btn {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: none;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 40px rgba(79, 172, 254, 0.4);
  transition: all 0.3s ease;
}

.play-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 60px rgba(79, 172, 254, 0.6);
}

.play-btn.main {
  width: 120px;
  height: 120px;
}

.play-icon {
  width: 50px;
  height: 50px;
}

.bottom-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px 0;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: auto;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 16px;
}

.volume-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.volume-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.volume-icon {
  width: 24px;
  height: 24px;
}

.volume-slider {
  width: 160px;
  height: 6px;
}

.volume-track {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.volume-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(90deg, #4facfe, #00f2fe);
  border-radius: 3px;
  transition: width 0.2s ease;
}

.mode-controls {
  display: flex;
  gap: 20px;
}

.mode-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 24px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
}

.mode-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.mode-btn.active {
  background: rgba(79, 172, 254, 0.2);
  border-color: rgba(79, 172, 254, 0.3);
  color: #4facfe;
}

.mode-icon {
  width: 24px;
  height: 24px;
}

.mode-label {
  font-size: 12px;
  font-weight: 500;
}
</style>
