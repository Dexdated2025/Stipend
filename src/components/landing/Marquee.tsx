const ITEMS = [
  ["Base", "settlement"],
  ["USDC", "unit of account"],
  ["x402", "agent payments"],
  ["ERC-4337", "smart accounts"],
  ["MCP", "agent tooling"],
];

export function BuiltOnMarquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <section aria-label="Built on open standards" className="border-y border-white/[0.05] py-8">
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul className="flex w-max animate-marquee gap-14 pr-14">
          {[...row, ...row].map(([name, role], k) => (
            <li key={k} className="flex items-baseline gap-2 whitespace-nowrap" aria-hidden={k >= ITEMS.length}>
              <span className="font-mono text-lg text-fg">{name}</span>
              <span className="font-mono text-xs text-muted">{role}</span>
              <span className="ml-12 text-electric/50">◆</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
