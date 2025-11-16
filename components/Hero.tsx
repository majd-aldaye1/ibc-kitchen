export default function Hero() {
  return (
    <section className="relative h-[220px] w-full overflow-hidden bg-black">
      {/* Replace with your kitchen image or muted looping video */}
      <img
        src="/hero.jpg" /* put an image in /public/hero.jpg */
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
    </section>
  )
}
