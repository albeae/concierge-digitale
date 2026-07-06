interface MapEmbedProps {
  address: string;
  ariaLabel: string;
}

/**
 * Embed di Google Maps centrato su un indirizzo.
 * Usa l'URL classico `output=embed`, che non richiede API key.
 */
export function MapEmbed({ address, ariaLabel }: MapEmbedProps) {
  const src = `https://maps.google.com/maps?q=${encodeURIComponent(
    address,
  )}&z=15&output=embed`;

  return (
    <div className="overflow-hidden rounded-3xl shadow-soft">
      <iframe
        title={ariaLabel}
        src={src}
        className="h-52 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
