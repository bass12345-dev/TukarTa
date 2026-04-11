import { Mic2, Music, Drum, Keyboard, Info } from 'lucide-react-native';

export const ROLES = [
  { id: 'singer', label: 'Singer / Vocalist', sub: 'Lead, backing, or both', icon: Mic2, color: '#00D4FF' },
  { id: 'guitar', label: 'Guitarist', sub: 'Lead, rhythm, or acoustic', icon: Music, color: '#8B5CF6' },
  { id: 'bass', label: 'Bassist', sub: 'Electric or upright bass', icon: Music, color: '#F59E0B' },
  { id: 'drums', label: 'Drummer', sub: 'Full kit or cajon', icon: Drum, color: '#F472B6' }, 
  { id: 'keys', label: 'Keys / Piano', sub: 'Keyboard or piano', icon: Keyboard, color: '#34D399' },
  { id: 'session', label: 'Session Musician', sub: 'Available for hire', icon: Info, color: '#94A3B8' },
];

export const CITIES = [
  { name: 'Cebu City', region: 'Central Visayas', count: '847 musicians' },
  { name: 'Metro Manila', region: 'NCR', count: '2,400 musicians' },
  { name: 'Davao City', region: 'Davao del Sur', count: '630 musicians' },
  { name: 'Iloilo City', region: 'Western Visayas', count: '310 musicians' },
  { name: 'Cagayan de Oro', region: 'Misamis Oriental', count: '290 musicians' },
];

export const GENRES = [
  'OPM', 'Acoustic', 'Pop', 'Rock', 'R&B / Soul', 'Jazz', 'Worship / CCM', '80s / 90s', 
  'Classic Rock', 'Wedding / Events', 'Reggae', 'Indie / Alternative', 'Kundiman', 'Country'
];

export const AVAILABILITY = [
  'Bar / Café gigs',
  'Weddings & corporate events',
  'Church / worship team'
];

export const MOCK_SONGS = [
  { id: '1', title: 'Hotel California', artist: 'Eagles', genre: 'Classic Rock', duration: '6:30', hasLyrics: true, color: '#00D4FF' },
  { id: '2', title: 'Hotel California (Live)', artist: 'Eagles', genre: 'Classic Rock', duration: '7:04', hasLyrics: true, color: '#8B5CF6' },
  { id: '3', title: 'Paraluman', artist: 'Adie', genre: 'OPM', duration: '3:58', hasLyrics: true, color: '#34D399' },
  { id: '4', title: 'Kundiman', artist: 'Parokya ni Edgar', genre: 'OPM', duration: '4:10', hasLyrics: false, color: '#F59E0B' },
  { id: '5', title: 'Faithfully', artist: 'Journey', genre: 'Rock', duration: '4:26', hasLyrics: true, color: '#F472B6' },
];
