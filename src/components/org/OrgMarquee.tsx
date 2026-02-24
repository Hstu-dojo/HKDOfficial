interface OrgMarqueeProps {
  items: string[];
}

export default function OrgMarquee({ items }: OrgMarqueeProps) {
  if (items.length === 0) return null;

  const words = items.length < 5 ? [...items, ...items, ...items] : items;

  return (
    <div
      className="bg-accent overflow-hidden py-2.5 md:py-3 relative"
      role="marquee"
      aria-label="Highlights"
    >
      <div className="flex animate-marquee whitespace-nowrap">
        {[...words, ...words].map((word, i) => (
          <span
            key={`${word}-${i}`}
            className="font-display text-lg md:text-3xl text-accent-foreground mx-3 md:mx-10 tracking-wider uppercase"
          >
            {word}
            <span className="text-accent-foreground/40 mx-3 md:mx-10">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
