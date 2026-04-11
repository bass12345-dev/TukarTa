import { Mic, Music, Piano, Briefcase } from 'lucide-react-native';

export const ROLES = [
  { id: 'singer', label: 'Singer / Vocalist', sub: 'Lead, backing, or both', icon: Mic },
  { id: 'guitar', label: 'Guitarist', sub: 'Lead, rhythm, or acoustic', icon: Music },
  { id: 'bass', label: 'Bassist', sub: 'Electric or upright bass', icon: Music },
  { id: 'drums', label: 'Drummer', sub: 'Full kit or cajon', icon: Mic }, 
  { id: 'keys', label: 'Keys / Piano', sub: 'Keyboard or piano', icon: Piano },
  { id: 'session', label: 'Session Musician', sub: 'Available for hire', icon: Briefcase },
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
