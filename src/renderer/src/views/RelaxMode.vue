<template>
  <div class="relax-mode">
    <div class="background-layer">
      <div class="floating-particles">
        <div 
          v-for="i in 30" 
          :key="i" 
          class="particle"
          :style="getParticleStyle(i)"
        ></div>
      </div>
      <div class="gradient-overlay" :style="{ background: currentGradient }"></div>
    </div>

    <div class="relax-content">
      <div class="header-bar">
        <button class="back-btn" @click="handleBack">
          <Icon icon="lucide:chevron-left" class="back-icon" />
        </button>
        <h1 class="page-title">放松时刻</h1>
        <div class="header-spacer"></div>
      </div>

      <div class="timer-section" v-if="showTimer">
        <div class="timer-display">
          <span class="timer-value">{{ formatTimer(remainingTime) }}</span>
        </div>
        <div class="timer-controls">
          <button class="timer-btn" @click="toggleTimer">
            <Icon :icon="timerRunning ? 'lucide:pause' : 'lucide:play'" />
          </button>
          <button class="timer-btn" @click="resetTimer">
            <Icon icon="lucide:rotate-ccw" />
          </button>
        </div>
      </div>

      <div class="mood-selector">
        <button 
          v-for="mood in moods" 
          :key="mood.id"
          class="mood-btn"
          :class="{ active: currentMood === mood.id }"
          @click="selectMood(mood)"
        >
          <div class="mood-icon" :style="{ background: mood.color }">
            <Icon :icon="mood.icon" />
          </div>
          <span class="mood-name">{{ mood.name }}</span>
        </button>
      </div>

      <div class="sound-selector">
        <div class="section-header">
          <span class="section-title">环境音效</span>
        </div>
        <div class="sound-grid">
          <div 
            v-for="sound in sounds" 
            :key="sound.id"
            class="sound-card"
            :class="{ active: activeSounds.includes(sound.id) }"
            @click="toggleSound(sound.id)"
          >
            <div class="sound-icon" :style="{ background: sound.color }">
              <Icon :icon="sound.icon" class="icon" />
            </div>
            <span class="sound-name">{{ sound.name }}</span>
            <div class="sound-volume" v-if="activeSounds.includes(sound.id)">
              <input 
                type="range" 
                min="0" 
                max="100" 
                :value="getSoundVolume(sound.id)"
                class="volume-slider"
                @input="setSoundVolume(sound.id, $event)"
                @click.stop
              />
            </div>
          </div>
        </div>
      </div>

      <div class="timer-preset">
        <div class="section-header">
          <span class="section-title">定时关闭</span>
        </div>
        <div class="preset-grid">
          <button 
            v-for="preset in timerPresets" 
            :key="preset.value"
            class="preset-btn"
            :class="{ active: selectedTimerPreset === preset.value }"
            @click="selectTimerPreset(preset)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>

      <div class="player-controls">
        <div class="player-bar" v-if="currentSong">
          <div class="player-info">
            <div class="player-cover">
              <img 
                v-if="currentSong.picUrl" 
                :src="currentSong.picUrl" 
                class="cover-img"
              />
              <div v-else class="cover-placeholder">
                <Icon icon="lucide:music" />
              </div>
            </div>
            <div class="player-text">
              <span class="player-title">{{ currentSong.name }}</span>
              <span class="player-artist">{{ currentSong.artist }}</span>
            </div>
          </div>
          <div class="player-actions">
            <button class="player-btn" @click="handlePrev">
              <Icon icon="lucide:skip-back" />
            </button>
            <button class="player-btn play" @click="handleTogglePlay">
              <Icon :icon="isPlaying ? 'lucide:pause' : 'lucide:play'" />
            </button>
            <button class="player-btn" @click="handleNext">
              <Icon icon="lucide:skip-forward" />
            </button>
          </div>
        </div>
        <div class="player-empty" v-else>
          <Icon icon="lucide:music-2" class="empty-icon" />
          <span class="empty-text">点击下方歌曲开始放松</span>
        </div>
      </div>

      <div class="relax-playlist">
        <div class="section-header">
          <span class="section-title">推荐放松音乐</span>
          <button class="play-all-btn" @click="handlePlayAll">
            <Icon icon="lucide:play" class="play-icon" />
            播放全部
          </button>
        </div>
        <div class="song-list">
          <div 
            v-for="(song, index) in relaxSongs" 
            :key="song.id"
            class="song-item"
            @click="handlePlaySong(index)"
            :class="{ 'is-playing': isCurrentSong(song) }"
          >
            <div class="song-index">
              <span v-if="!isCurrentSong(song)">{{ index + 1 }}</span>
              <div v-else class="playing-indicator">
                <span class="bar"></span>
                <span class="bar"></span>
                <span class="bar"></span>
              </div>
            </div>
            <div class="song-cover">
              <img v-if="song.picUrl" :src="song.picUrl" loading="lazy" />
              <div v-else class="cover-small" :style="{ background: getRandomColor(index) }"></div>
            </div>
            <div class="song-info">
              <span class="song-name">{{ song.name }}</span>
              <span class="song-artist">{{ song.artist }}</span>
            </div>
            <span class="song-duration">{{ song.duration }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { Icon } from '@iconify/vue';
import { usePlayerStore } from '../stores/player';
import { storeToRefs } from 'pinia';
import { MessagePlugin } from 'tdesign-vue-next';
import type { Song } from '../types/song';

const router = useRouter();
const playerStore = usePlayerStore();
const { isPlaying, currentSong, playlist } = storeToRefs(playerStore);

const showTimer = ref(false);
const timerRunning = ref(false);
const remainingTime = ref(30 * 60);
const selectedTimerPreset = ref(30);
const timerInterval = ref<number | null>(null);

const currentMood = ref('peaceful');
const activeSounds = ref<string[]>([]);
const soundVolumes = ref<Record<string, number>>({});

const moods = [
  { id: 'peaceful', name: '宁静', icon: 'lucide:moon', color: '#667eea' },
  { id: 'focus', name: '专注', icon: 'lucide:brain', color: '#4facfe' },
  { id: 'sleep', name: '助眠', icon: 'lucide:cloud-moon', color: '#f093fb' },
  { id: 'nature', name: '自然', icon: 'lucide:tree-pine', color: '#43e97b' }
];

const sounds = [
  { id: 'rain', name: '雨声', icon: 'lucide:cloud-rain', color: '#4facfe' },
  { id: 'waves', name: '海浪', icon: 'lucide:waves', color: '#30cfd0' },
  { id: 'forest', name: '森林', icon: 'lucide:trees', color: '#43e97b' },
  { id: 'cafe', name: '咖啡厅', icon: 'lucide:coffee', color: '#fa709a' },
  { id: 'fire', name: '篝火', icon: 'lucide:flame', color: '#fee140' },
  { id: 'wind', name: '风声', icon: 'lucide:wind', color: '#a8edea' }
];

const timerPresets = [
  { label: '15分钟', value: 15 },
  { label: '30分钟', value: 30 },
  { label: '45分钟', value: 45 },
  { label: '60分钟', value: 60 },
  { label: '不限时', value: 0 }
];

const relaxSongs = ref<Song[]>([
  { id: 'relax_1', name: '星空下的梦', artist: '轻音乐大师', picUrl: '', url: '', source: 'local', type: 'Local' as const, duration: '05:30' },
  { id: 'relax_2', name: '晨曦之光', artist: '自然之声', picUrl: '', url: '', source: 'local', type: 'Local' as const, duration: '06:15' },
  { id: 'relax_3', name: '海浪轻拍', artist: '海洋系列', picUrl: '', url: '', source: 'local', type: 'Local' as const, duration: '04:45' },
  { id: 'relax_4', name: '森林鸟鸣', artist: '自然疗愈', picUrl: '', url: '', source: 'local', type: 'Local' as const, duration: '07:20' },
  { id: 'relax_5', name: '月光流水', artist: '古典钢琴', picUrl: '', url: '', source: 'local', type: 'Local' as const, duration: '08:10' },
  { id: 'relax_6', name: '雨后彩虹', artist: '轻音乐精选', picUrl: '', url: '', source: 'local', type: 'Local' as const, duration: '05:55' }
]);

const gradients: Record<string, string> = {
  peaceful: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  focus: 'linear-gradient(180deg, #0a1628 0%, #1a3a5c 50%, #0d2840 100%)',
  sleep: 'linear-gradient(180deg, #1a0a2e 0%, #2e1a5c 50%, #1a0a3c 100%)',
  nature: 'linear-gradient(180deg, #0a2e1a 0%, #1a5c3a 50%, #0d4028 100%)'
};

const currentGradient = computed(() => gradients[currentMood.value] || gradients.peaceful);

const getParticleStyle = (index: number) => {
  const colors = ['rgba(102, 126, 234, 0.3)', 'rgba(79, 172, 254, 0.3)', 'rgba(67, 233, 123, 0.2)'];
  return {
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    width: `${4 + Math.random() * 8}px`,
    height: `${4 + Math.random() * 8}px`,
    background: colors[index % colors.length],
    animationDelay: `${index * 0.2}s`,
    animationDuration: `${4 + Math.random() * 4}s`
  };
};

const selectMood = (mood: { id: string }) => {
  currentMood.value = mood.id;
  MessagePlugin.info(`已切换到${moods.find(m => m.id === mood.id)?.name}模式`);
};

const toggleSound = (soundId: string) => {
  const index = activeSounds.value.indexOf(soundId);
  if (index > -1) {
    activeSounds.value.splice(index, 1);
    delete soundVolumes.value[soundId];
  } else {
    activeSounds.value.push(soundId);
    soundVolumes.value[soundId] = 50;
  }
};

const getSoundVolume = (soundId: string) => {
  return soundVolumes.value[soundId] || 50;
};

const setSoundVolume = (soundId: string, event: Event) => {
  const target = event.target as HTMLInputElement;
  soundVolumes.value[soundId] = parseInt(target.value, 10);
};

const selectTimerPreset = (preset: { value: number }) => {
  selectedTimerPreset.value = preset.value;
  if (preset.value === 0) {
    showTimer.value = false;
    stopTimer();
  } else {
    showTimer.value = true;
    remainingTime.value = preset.value * 60;
    timerRunning.value = false;
    stopTimer();
  }
};

const toggleTimer = () => {
  if (timerRunning.value) {
    stopTimer();
  } else {
    startTimer();
  }
};

const startTimer = () => {
  timerRunning.value = true;
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
  }
  timerInterval.value = window.setInterval(() => {
    if (remainingTime.value > 0) {
      remainingTime.value--;
    } else {
      stopTimer();
      if (isPlaying.value) {
        playerStore.togglePlay();
      }
      MessagePlugin.info('定时结束，已停止播放');
    }
  }, 1000);
};

const stopTimer = () => {
  timerRunning.value = false;
  if (timerInterval.value) {
    clearInterval(timerInterval.value);
    timerInterval.value = null;
  }
};

const resetTimer = () => {
  stopTimer();
  remainingTime.value = selectedTimerPreset.value * 60;
};

const formatTimer = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const handleBack = () => {
  router.back();
};

const handlePlayAll = () => {
  playerStore.setPlaylist(relaxSongs.value);
};

const handlePlaySong = (index: number) => {
  playerStore.playFromList(relaxSongs.value[index], relaxSongs.value);
};

const isCurrentSong = (song: Song) => {
  return currentSong.value?.id === song.id;
};

const getRandomColor = (index: number) => {
  const colors = ['#667eea', '#4facfe', '#f093fb', '#43e97b', '#fa709a', '#30cfd0'];
  return colors[index % colors.length];
};

const handleTogglePlay = () => {
  playerStore.togglePlay();
};

const handlePrev = () => {
  playerStore.prev();
};

const handleNext = () => {
  playerStore.next();
};

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.relax-mode {
  position: fixed;
  inset: 0;
  overflow: hidden;
  z-index: 9999;
}

.background-layer {
  position: absolute;
  inset: 0;
  transition: background 1s ease;
}

.gradient-overlay {
  position: absolute;
  inset: 0;
  transition: background 1s ease;
}

.floating-particles {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  border-radius: 50%;
  animation: float-particle 8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes float-particle {
  0%, 100% {
    transform: translateY(0) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translateY(-30px) scale(1.2);
    opacity: 0.8;
  }
}

.relax-content {
  position: relative;
  z-index: 10;
  height: 100%;
  padding: 20px 30px;
  box-sizing: border-box;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.relax-content::-webkit-scrollbar {
  width: 6px;
}

.relax-content::-webkit-scrollbar-track {
  background: transparent;
}

.relax-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.relax-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-shrink: 0;
}

.back-btn {
  width: 44px;
  height: 44px;
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

.back-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.back-icon {
  width: 22px;
  height: 22px;
}

.page-title {
  font-size: 22px;
  font-weight: 600;
  color: white;
  letter-spacing: 1px;
}

.header-spacer {
  width: 44px;
}

.timer-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.timer-display {
  font-size: 64px;
  font-weight: 300;
  color: white;
  letter-spacing: 4px;
  font-variant-numeric: tabular-nums;
}

.timer-controls {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.timer-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.timer-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.mood-selector {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.mood-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.mood-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.mood-btn.active {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  transform: scale(1.05);
}

.mood-icon {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.mood-name {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.sound-selector,
.timer-preset,
.relax-playlist {
  margin-bottom: 28px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.play-all-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-all-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.play-icon {
  width: 14px;
  height: 14px;
}

.sound-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.sound-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 20px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  cursor: pointer;
  transition: all 0.3s ease;
}

.sound-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
}

.sound-card.active {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
}

.sound-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.icon {
  width: 22px;
  height: 22px;
}

.sound-name {
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}

.sound-volume {
  width: 100%;
  margin-top: 8px;
}

.volume-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  cursor: pointer;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
}

.preset-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 10px 20px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.03);
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.preset-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.preset-btn.active {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
  color: white;
}

.player-controls {
  margin-bottom: 28px;
}

.player-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.player-cover {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  overflow: hidden;
  flex-shrink: 0;
}

.cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #667eea, #f093fb);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.player-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.player-title {
  font-size: 14px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-artist {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.player-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.player-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.player-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.player-btn.play {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
}

.player-btn.play:hover {
  transform: scale(1.05);
}

.player-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 20px;
  border: 1px dashed rgba(255, 255, 255, 0.1);
}

.empty-icon {
  width: 40px;
  height: 40px;
  color: rgba(255, 255, 255, 0.3);
}

.empty-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
}

.song-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.song-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.song-item.is-playing {
  background: rgba(255, 255, 255, 0.08);
}

.song-index {
  width: 24px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.4);
  font-size: 13px;
}

.playing-indicator {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  height: 16px;
}

.playing-indicator .bar {
  width: 3px;
  background: #667eea;
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
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-small {
  width: 100%;
  height: 100%;
}

.song-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.song-name {
  font-size: 14px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-duration {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}
</style>
