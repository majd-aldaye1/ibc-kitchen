export default function SiteFooter() {
  return (
    <footer className="mt-12 bg-[var(--coal)] text-white/90">
      <div className="mx-auto max-w-6xl px-4 py-10 space-y-6 text-center">
        <div className="h-condensed tracking-widest">Employment</div>

        <p className="text-sm">
          Ithaca Beer, 122 Ithaca Beer Drive, Ithaca, NY 14850 · 607-273-0766 · customerservice@ithacabeer.com
        </p>

        <div className="h-condensed text-xl text-white/80">The Spirit of the Kitchen</div>

        <p className="text-xs text-white/60">© {new Date().getFullYear()} IBC Kitchen Recipes. All rights reserved.</p>
      </div>
    </footer>
  )
}
