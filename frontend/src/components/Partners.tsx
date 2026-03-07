const partners = [
  {
    name: "Chainlink",
    logo: (
      <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
        <path d="M16 0L6.4 5.6v12.8L16 24l9.6-5.6V5.6L16 0zm6.4 16.48L16 20.08l-6.4-3.6V8.88L16 5.28l6.4 3.6v7.6z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    name: "Ethereum",
    logo: (
      <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
        <path d="M16 2l-0.2 0.7v18.2l0.2 0.2 8.5-5L16 2z" fill="currentColor" opacity="0.6"/>
        <path d="M16 2L7.5 16.1l8.5 5V2z" fill="currentColor"/>
        <path d="M16 22.9l-0.1 0.1v6.5l0.1 0.3 8.5-12L16 22.9z" fill="currentColor" opacity="0.6"/>
        <path d="M16 29.8v-6.9l-8.5-5 8.5 11.9z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    name: "Polygon",
    logo: (
      <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
        <path d="M22.1 12.2c-.5-.3-1.1-.3-1.5 0l-3.6 2.1-2.4 1.4-3.6 2.1c-.5.3-1.1.3-1.5 0l-2.8-1.7c-.5-.3-.8-.8-.8-1.4v-3.3c0-.6.3-1.1.8-1.4l2.8-1.6c.5-.3 1.1-.3 1.5 0l2.8 1.6c.5.3.8.8.8 1.4v2.1l2.4-1.4v-2.1c0-.6-.3-1.1-.8-1.4l-5.2-3c-.5-.3-1.1-.3-1.5 0l-5.3 3c-.5.3-.8.8-.8 1.4v6.1c0 .6.3 1.1.8 1.4l5.2 3c.5.3 1.1.3 1.5 0l3.6-2.1 2.4-1.4 3.6-2.1c.5-.3 1.1-.3 1.5 0l2.8 1.6c.5.3.8.8.8 1.4v3.3c0 .6-.3 1.1-.8 1.4l-2.8 1.7c-.5.3-1.1.3-1.5 0l-2.8-1.6c-.5-.3-.8-.8-.8-1.4v-2.1l-2.4 1.4v2.1c0 .6.3 1.1.8 1.4l5.2 3c.5.3 1.1.3 1.5 0l5.2-3c.5-.3.8-.8.8-1.4v-6.1c0-.6-.3-1.1-.8-1.4l-5.3-3z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    name: "Arbitrum",
    logo: (
      <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
        <path d="M16.6 17.4l3.5 5.7 3.2-1.9-4.8-7.8-1.9 4zm7.8-1.6l-5-8.1c-.3-.4-.7-.7-1.2-.7h-1l6.2 10.1 2.4-1.4v-.1c0-.4-.1-.7-.4-1.1v.3z" fill="currentColor" opacity="0.5"/>
        <path d="M6.6 21.2l2.1 1.2 6.6-10.8h-2.2c-.5 0-.9.2-1.2.7l-5.3 8.6v.3zm10.7-.1l-3.3-5.4-2 3.3 3.2 5.2 3.3-1.9-1.2-1.2z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    name: "Avalanche",
    logo: (
      <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
        <path d="M20.4 20.8h3.7c.4 0 .6-.1.8-.4.2-.3.2-.6 0-.9l-6.8-12c-.2-.3-.5-.5-.8-.5s-.6.2-.8.5l-2 3.5 3.9 6.8c.7 1.2 1.3 2.2 2 3z" fill="currentColor"/>
        <path d="M14.1 20.8h-6.2c-.4 0-.6-.1-.8-.4-.2-.3-.2-.6 0-.9l3.1-5.4c.2-.3.5-.5.8-.5s.6.2.8.5l3.1 5.4c.2.3.2.6 0 .9-.2.3-.4.4-.8.4z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    name: "Wormhole",
    logo: (
      <svg className="w-6 h-6" viewBox="0 0 80 80" fill="none">
        <path d="M40 10c-16.57 0-30 13.43-30 30s13.43 30 30 30 30-13.43 30-30-13.43-30-30-30zm0 52.5c-12.43 0-22.5-10.07-22.5-22.5S27.57 17.5 40 17.5 62.5 27.57 62.5 40 52.43 62.5 40 62.5z" fill="currentColor"/>
        <path d="M40 22c-9.94 0-18 8.06-18 18s8.06 18 18 18 18-8.06 18-18-8.06-18-18-18zm0 28.5c-5.8 0-10.5-4.7-10.5-10.5S34.2 29.5 40 29.5 50.5 34.2 50.5 40 45.8 50.5 40 50.5z" fill="currentColor"/>
        <circle cx="40" cy="40" r="6" fill="currentColor"/>
      </svg>
    ),
  },
  {
    name: "Base",
    logo: (
      <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" fill="currentColor" opacity="0.2"/>
        <path d="M15.9 24.8c-4.9 0-8.8-4-8.8-8.8s4-8.8 8.8-8.8c4.4 0 8 3.2 8.7 7.3h-11.5v3h11.5c-.7 4.2-4.3 7.3-8.7 7.3z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    name: "Optimism",
    logo: (
      <svg className="w-6 h-6" viewBox="0 0 32 32" fill="none">
        <circle cx="16" cy="16" r="12" fill="currentColor" opacity="0.15"/>
        <path d="M11.4 19.3c-1.8 0-3.1-1.4-3.1-3.3 0-2.5 1.7-4.7 4.3-4.7 1.8 0 3.1 1.3 3.1 3.2 0 2.6-1.8 4.8-4.3 4.8zm.9-6.3c-1.3 0-2.2 1.3-2.2 2.8 0 1 .5 1.7 1.4 1.7 1.3 0 2.2-1.3 2.2-2.8 0-1-.5-1.7-1.4-1.7zm8.2-.8h-1.9l-1.5 7h1.9l.5-2.4h.7c1.9 0 3.2-1 3.2-2.6 0-1.2-.8-2-2.2-2h-.7zm-.3 3h-.5l.4-1.6h.6c.5 0 .8.3.8.7 0 .6-.5.9-1.3.9z" fill="currentColor"/>
      </svg>
    ),
  },
];

export default function Partners() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-[40px] font-semibold tracking-tight leading-tight mb-2 text-white">
          Supported by top teams.
        </h2>
        <p className="text-gray-400 text-base mb-10">From DeFi&apos;s largest projects to established CEXes.</p>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
          {partners.map((p) => (
            <div key={p.name} className="flex items-center gap-2 text-gray-500 select-none shrink-0">
              {p.logo}
              <span className="text-sm font-semibold tracking-wide whitespace-nowrap">{p.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
