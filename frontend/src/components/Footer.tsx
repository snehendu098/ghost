import Image from "next/image";

const columns = [
  { title: "Protocol", links: ["Lend", "Borrow", "Private Pools", "Governance"] },
  { title: "Resources", links: ["Litepaper", "Documentation", "Blog", "Architecture"] },
  { title: "Community", links: ["X", "Discord", "$gUSD", "$gETH"] },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.06] pt-16 pb-10 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between gap-12 mb-16">
          <Image src="/ghost-logo1.png" alt="Ghost" width={100} height={40} className="h-10 w-auto" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 sm:gap-16">
            {columns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-semibold text-white mb-4">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link}><a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/[0.06] gap-4">
          <p className="text-xs text-gray-500">2025. Designed with love.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Privacy</a>
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">Terms</a>
            <div className="flex items-center gap-3.5">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
