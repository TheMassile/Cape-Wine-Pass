// Cape Wine Pass look: ink-black backgrounds, wine red and gold, Cormorant Garamond headings.
export const colors = {
  background: '#1A1410',
  card: '#2C2420',
  border: 'rgba(184,150,90,0.18)',
  text: '#F5F0E8',
  muted: '#8C8070',
  soft: '#B8AFA0',
  gold: '#B8965A',
  goldLight: '#D4AE7A',
  wine: '#6B1A2A',
  wineLight: '#8C3042',
  success: '#8CB87A',
  danger: '#E07070',
} as const;

export const fonts = {
  serif: 'CormorantGaramond_400Regular',
  serifLight: 'CormorantGaramond_300Light',
  sans: 'Montserrat_400Regular',
  sansLight: 'Montserrat_300Light',
  sansMedium: 'Montserrat_500Medium',
} as const;

export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;
