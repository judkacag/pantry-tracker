const S = { fill: "none" as const, stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function Svg({ size = 24, children }: { size?: number; children: React.ReactNode }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block" }}>{children}</svg>;
}

export function IconBack({ size = 24 }: { size?: number }) {
  return <Svg size={size}><path d="M15 5l-7 7 7 7" {...S} /></Svg>;
}
export function IconSearch({ size = 24 }: { size?: number }) {
  return <Svg size={size}><circle cx="11" cy="11" r="6.5" {...S} /><path d="M20 20l-4.2-4.2" {...S} /></Svg>;
}
export function IconPlus({ size = 24 }: { size?: number }) {
  return <Svg size={size}><path d="M12 5v14M5 12h14" {...S} /></Svg>;
}
export function IconCheck({ size = 24 }: { size?: number }) {
  return <Svg size={size}><path d="M5 12.5l4.5 4.5L19 6.5" {...S} /></Svg>;
}
export function IconX({ size = 24 }: { size?: number }) {
  return <Svg size={size}><path d="M6 6l12 12M18 6L6 18" {...S} /></Svg>;
}
export function IconMinus({ size = 24 }: { size?: number }) {
  return <Svg size={size}><path d="M5 12h14" {...S} /></Svg>;
}
export function IconCamera({ size = 24 }: { size?: number }) {
  return <Svg size={size}>
    <path d="M3 8.5A1.5 1.5 0 014.5 7h2L8 4.8h8L17.5 7h2A1.5 1.5 0 0121 8.5v9A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 17.5z" {...S} />
    <circle cx="12" cy="13" r="3.4" {...S} />
  </Svg>;
}
export function IconCalendar({ size = 24 }: { size?: number }) {
  return <Svg size={size}>
    <rect x="4" y="5.5" width="16" height="15" rx="2.5" {...S} />
    <path d="M4 10h16M8.5 3v5M15.5 3v5" {...S} />
  </Svg>;
}
export function IconTrash({ size = 24 }: { size?: number }) {
  return <Svg size={size}>
    <path d="M3.5 6.5h17" {...S} />
    <path d="M9 6.5V5.2A1.7 1.7 0 0110.7 3.5h2.6A1.7 1.7 0 0115 5.2V6.5" {...S} />
    <path d="M5.6 6.5l1.02 12.9A1.7 1.7 0 008.3 21h7.4a1.7 1.7 0 001.68-1.6L18.4 6.5" {...S} />
    <path d="M9.7 10.3v6.6M14.3 10.3v6.6" {...S} />
  </Svg>;
}
export function IconFilter({ size = 24 }: { size?: number }) {
  return <Svg size={size}>
    <path d="M4 6h16M7 12h10M10 18h4" {...S} />
  </Svg>;
}
