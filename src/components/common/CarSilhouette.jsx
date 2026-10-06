/**
 * Стилизованный силуэт хэтчбека (вид сбоку) в «чертёжной» манере.
 * Используется в онбординге, карточке авто и на схеме запчастей.
 */
export default function CarSilhouette({
  stroke = "#00D6FF",
  fill = "rgba(0,102,255,.08)",
  width = "100%",
  className = "",
  wheels = true,
}) {
  return (
    <svg viewBox="0 0 480 190" width={width} className={className} fill="none" aria-hidden="true">
      {/* корпус */}
      <path
        d="M32 138 C30 120 34 112 52 108 L92 100 C112 74 150 56 208 54 C262 52 300 64 322 88 L384 96 C420 100 446 108 450 122 C453 132 450 138 444 140 L420 142
           M32 138 L60 142
           M60 142 A26 26 0 0 1 112 142 L188 142 A26 26 0 0 1 240 142 L368 142 A26 26 0 0 1 420 142"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill={fill}
      />
      {/* окна */}
      <path d="M118 96 C134 76 164 64 206 62 L206 92 Z" stroke={stroke} strokeWidth="1.5" opacity=".7" fill="rgba(0,214,255,.06)" />
      <path d="M214 62 C252 62 284 72 302 90 L214 92 Z" stroke={stroke} strokeWidth="1.5" opacity=".7" fill="rgba(0,214,255,.06)" />
      {/* фары / стопы */}
      <path d="M438 112 L452 118" stroke="#FFB800" strokeWidth="3" strokeLinecap="round" />
      <path d="M34 118 L46 114" stroke="#FF3B5C" strokeWidth="3" strokeLinecap="round" />
      {/* пороги и детали */}
      <path d="M120 132 H180 M248 132 H360" stroke={stroke} strokeWidth="1" opacity=".4" />
      {wheels && (
        <g>
          {[86, 394].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="142" r="26" stroke={stroke} strokeWidth="2.5" />
              <circle cx={cx} cy="142" r="15" stroke={stroke} strokeWidth="1.5" opacity=".8" />
              <circle cx={cx} cy="142" r="4" fill={stroke} />
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <line
                  key={a}
                  x1={cx + 6 * Math.cos((a * Math.PI) / 180)}
                  y1={142 + 6 * Math.sin((a * Math.PI) / 180)}
                  x2={cx + 14 * Math.cos((a * Math.PI) / 180)}
                  y2={142 + 14 * Math.sin((a * Math.PI) / 180)}
                  stroke={stroke}
                  strokeWidth="1.5"
                  opacity=".6"
                />
              ))}
            </g>
          ))}
        </g>
      )}
      {/* размерные линии — «технический чертёж» */}
      <g stroke={stroke} strokeWidth="1" opacity=".35">
        <line x1="32" y1="176" x2="450" y2="176" />
        <line x1="32" y1="170" x2="32" y2="182" />
        <line x1="450" y1="170" x2="450" y2="182" />
      </g>
    </svg>
  );
}
