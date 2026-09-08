type AppLogoProps = {
  className?: string
}

// Marca fixa do app: as cores batem com --accent e --bg do tema claro, mas não trocam com
// o tema, o mesmo critério de qualquer logo — é identidade, não superfície de UI.
export function AppLogo({ className }: AppLogoProps) {
  return (
    <svg viewBox="0 0 48 48" role="img" aria-label="Prumo" className={className}>
      <rect x="4" y="4" width="40" height="40" rx="7" fill="#406AC9" />
      <circle cx="24" cy="9.2" r="1.2" fill="#F9FAFB" />
      <line x1="24" y1="10.4" x2="24" y2="15.2" stroke="#F9FAFB" strokeWidth="1.2" />
      <path
        d="M 17.2 20 Q 17.2 15.2 24 15.2 Q 30.8 15.2 30.8 20 Q 30.8 30.4 24 38.4 Q 17.2 30.4 17.2 20 Z"
        fill="#F9FAFB"
      />
    </svg>
  )
}
