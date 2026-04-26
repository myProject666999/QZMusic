import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Song } from '../types/song';

export interface Playlist {
  id: string;
  name: string;
  description: string;
  cover: string;
  songs: Song[];
  createdAt: number;
  updatedAt: number;
  type: 'user' | 'system';
  color: string;
  icon?: string;
}

const DEFAULT_COLORS = [
  '#ec4141',
  '#667eea',
  '#4facfe',
  '#f093fb',
  '#43e97b',
  '#fa709a',
  '#fee140',
  '#30cfd0'
];

const DEFAULT_ICONS = {
  driving: 'lucide:car',
  relax: 'lucide:coffee',
  focus: 'lucide:headphones',
  liked: 'lucide:heart'
};

export const usePlaylistsStore = defineStore('playlists', () => {
  const savedPlaylists = localStorage.getItem('qz-playlists');
  
  const playlists = ref<Playlist[]>([]);
  
  if (savedPlaylists) {
    try {
      playlists.value = JSON.parse(savedPlaylists);
    } catch {
      playlists.value = [];
    }
  }
  
  if (playlists.value.length === 0) {
    playlists.value = [
      {
        id: 'driving',
        name: '驾驶模式',
        description: '适合驾驶时的动感音乐',
        cover: '',
        songs: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        type: 'system',
        color: '#4facfe',
        icon: 'lucide:car'
      },
      {
        id: 'relax',
        name: '放松时光',
        description: '舒缓放松的轻音乐',
        cover: '',
        songs: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        type: 'system',
        color: '#f093fb',
        icon: 'lucide:coffee'
      },
      {
        id: 'focus',
        name: '工作专注',
        description: '帮助专注工作的纯音乐',
        cover: '',
        songs: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        type: 'system',
        color: '#43e97b',
        icon: 'lucide:headphones'
      }
    ];
  }

  const userPlaylists = computed(() => 
    playlists.value.filter(p => p.type === 'user')
  );

  const systemPlaylists = computed(() => 
    playlists.value.filter(p => p.type === 'system')
  );

  const getPlaylistById = (id: string) => {
    return playlists.value.find(p => p.id === id) || null;
  };

  const createPlaylist = (name: string, description: string = ''): Playlist => {
    const randomIndex = Math.floor(Math.random() * DEFAULT_COLORS.length);
    const newPlaylist: Playlist = {
      id: `playlist_${Date.now()}`,
      name: name.trim(),
      description,
      cover: '',
      songs: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      type: 'user',
      color: DEFAULT_COLORS[randomIndex]
    };
    
    playlists.value.push(newPlaylist);
    return newPlaylist;
  };

  const updatePlaylist = (id: string, updates: Partial<Playlist>) => {
    const index = playlists.value.findIndex(p => p.id === id);
    if (index !== -1) {
      playlists.value[index] = {
        ...playlists.value[index],
        ...updates,
        updatedAt: Date.now()
      };
    }
  };

  const deletePlaylist = (id: string) => {
    const index = playlists.value.findIndex(p => p.id === id);
    if (index !== -1 && playlists.value[index].type !== 'system') {
      playlists.value.splice(index, 1);
    }
  };

  const addSongToPlaylist = (playlistId: string, song: Song) => {
    const playlist = getPlaylistById(playlistId);
    if (playlist) {
      const exists = playlist.songs.some(s => s.id === song.id);
      if (!exists) {
        playlist.songs.push(song);
        playlist.updatedAt = Date.now();
      }
    }
  };

  const addSongsToPlaylist = (playlistId: string, songs: Song[]) => {
    const playlist = getPlaylistById(playlistId);
    if (playlist) {
      for (const song of songs) {
        const exists = playlist.songs.some(s => s.id === song.id);
        if (!exists) {
          playlist.songs.push(song);
        }
      }
      playlist.updatedAt = Date.now();
    }
  };

  const removeSongFromPlaylist = (playlistId: string, songId: string) => {
    const playlist = getPlaylistById(playlistId);
    if (playlist) {
      const index = playlist.songs.findIndex(s => s.id === songId);
      if (index !== -1) {
        playlist.songs.splice(index, 1);
        playlist.updatedAt = Date.now();
      }
    }
  };

  const reorderPlaylistSongs = (playlistId: string, fromIndex: number, toIndex: number) => {
    const playlist = getPlaylistById(playlistId);
    if (playlist && fromIndex !== toIndex) {
      const [removed] = playlist.songs.splice(fromIndex, 1);
      playlist.songs.splice(toIndex, 0, removed);
      playlist.updatedAt = Date.now();
    }
  };

  const clearPlaylist = (playlistId: string) => {
    const playlist = getPlaylistById(playlistId);
    if (playlist) {
      playlist.songs = [];
      playlist.updatedAt = Date.now();
    }
  };

  watch(playlists, (newPlaylists) => {
    localStorage.setItem('qz-playlists', JSON.stringify(newPlaylists));
  }, { deep: true });

  return {
    playlists,
    userPlaylists,
    systemPlaylists,
    getPlaylistById,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    addSongsToPlaylist,
    removeSongFromPlaylist,
    reorderPlaylistSongs,
    clearPlaylist
  };
});
