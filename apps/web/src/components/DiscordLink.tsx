/**
 * Discord invite (F9). Renders only when NEXT_PUBLIC_DISCORD_URL is configured — no link is
 * shown (and nothing is hard-coded) until the owner sets up the server.
 */
export function DiscordLink({
  className,
  label = "Join our Discord",
}: {
  className?: string;
  label?: string;
}) {
  const url = process.env.NEXT_PUBLIC_DISCORD_URL;
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={className ?? "hover:text-brand-600"}>
      {label}
    </a>
  );
}
