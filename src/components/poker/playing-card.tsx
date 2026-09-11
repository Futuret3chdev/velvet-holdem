import { RANK_GLYPH, SUIT_GLYPH, isRed } from "@/lib/poker/cards";
import type { Card } from "@/lib/poker/types";
import { cn } from "@/lib/utils";

export function PlayingCard({
  card,
  hidden,
  size = "md",
}: {
  card: Card | null;
  hidden?: boolean;
  size?: "sm" | "md";
}) {
  const dim = size === "sm" ? "h-16 w-11" : "h-20 w-14";
  if (!card || hidden) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-elevated font-display text-sm text-fg shadow-[var(--shadow-border)]",
          dim,
        )}
      >
        VH
      </div>
    );
  }
  const red = isRed(card);
  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-md bg-card-face px-1.5 py-1 shadow-[var(--shadow-border)]",
        dim,
        red ? "text-suit-red" : "text-suit-ink",
      )}
    >
      <p className="font-display text-lg leading-none">{RANK_GLYPH[card.r]}</p>
      <p className="text-center text-xl leading-none">{SUIT_GLYPH[card.s]}</p>
      <p className="self-end rotate-180 font-display text-lg leading-none">{RANK_GLYPH[card.r]}</p>
    </div>
  );
}
