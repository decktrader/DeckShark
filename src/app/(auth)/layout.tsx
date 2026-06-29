import { Brand } from '@/components/ds/brand'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Branding panel */}
      <div className="bg-navy text-paper relative hidden flex-1 flex-col justify-center overflow-hidden p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 50% 50% at 85% 0%, rgba(193,148,88,0.16), transparent 60%), radial-gradient(ellipse 45% 55% at 0% 100%, rgba(61,122,117,0.18), transparent 60%)',
          }}
        />
        <div className="relative">
          <Brand wordmarkClassName="text-[22px] text-paper" />
          <h2 className="font-display mt-8 text-[clamp(28px,3.2vw,40px)] leading-tight font-bold tracking-[-0.02em]">
            Step onto the
            <br />
            <span className="text-brass">convention floor.</span>
          </h2>
          <p className="text-paper/[0.78] mt-4 max-w-sm text-[15px] leading-relaxed">
            Trade complete Commander decks with players near you. List what you
            built, find what you want, and meet up to make the swap.
          </p>
          <ul className="text-paper/70 mt-7 space-y-2.5 font-mono text-[12.5px]">
            <li className="flex items-center gap-2.5">
              <span className="bg-teal-bright h-1.5 w-1.5 rounded-full" />
              Browse decks across Canada and the US
            </li>
            <li className="flex items-center gap-2.5">
              <span className="bg-brass-bright h-1.5 w-1.5 rounded-full" />
              No fees, no proprietary currency
            </li>
            <li className="flex items-center gap-2.5">
              <span className="bg-terra-bright h-1.5 w-1.5 rounded-full" />
              Every trade happens in person
            </li>
          </ul>
        </div>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
        {children}
      </div>
    </div>
  )
}
