import { ArrowUpRight, FileText, Bell, MessageCircle } from "lucide-react";

export default function FollowAlong() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl sm:text-[40px] font-semibold tracking-tight leading-tight mb-12 text-white">Follow along.</h2>

        {/* Top row: Blog (wider) + Dev alerts (narrower) */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 mb-4">
          {/* Blog — 3/5 width, border only, no arrow */}
          <a
            href="#"
            className="sm:col-span-3 flex flex-col justify-between p-7 rounded-2xl border border-white/[0.08] transition-all hover:border-white/[0.14] min-h-[160px]"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-gray-400" />
              <h4 className="font-semibold text-white text-base">Blog</h4>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mt-auto pt-8">News and insights from the team.</p>
          </a>

          {/* Dev alerts — 2/5 width, filled bg, arrow */}
          <a
            href="#"
            className="sm:col-span-2 flex flex-col justify-between p-7 rounded-2xl bg-[#161616] border border-white/[0.04] transition-all hover:border-white/[0.1] group min-h-[160px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 text-gray-400" />
                <h4 className="font-semibold text-white text-base">Dev alerts</h4>
              </div>
              <ArrowUpRight className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mt-auto pt-8">Get notified about latest developer updates.</p>
          </a>
        </div>

        {/* Bottom row: X + Discord (equal width) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* X */}
          <a
            href="#"
            className="flex flex-col justify-between p-7 rounded-2xl bg-[#161616] border border-white/[0.04] transition-all hover:border-white/[0.1] group min-h-[150px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                <h4 className="font-semibold text-white text-base">X</h4>
              </div>
              <ArrowUpRight className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mt-auto pt-8">Follow @ghostprotocol on X for latest announcements.</p>
          </a>

          {/* Discord */}
          <a
            href="#"
            className="flex flex-col justify-between p-7 rounded-2xl bg-[#161616] border border-white/[0.04] transition-all hover:border-white/[0.1] group min-h-[150px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MessageCircle className="w-5 h-5 text-gray-400" />
                <h4 className="font-semibold text-white text-base">Discord</h4>
              </div>
              <ArrowUpRight className="w-4.5 h-4.5 text-gray-600 group-hover:text-gray-400 transition-colors shrink-0" />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mt-auto pt-8">Hang out with and meet new friends from our Ghost fam!</p>
          </a>
        </div>
      </div>
    </section>
  );
}
