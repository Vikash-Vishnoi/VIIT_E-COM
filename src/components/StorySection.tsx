import Image from "next/image";

const quotes = [
  "I wear pieces that feel like a vacation on my skin.",
  "Confidence is quiet. Let the colors do the talking.",
  "Every look is a memory in motion.",
];

export default function StorySection() {
  return (
    <section className="w-full px-6 md:px-10 py-10 bg-gradient-to-br from-[#fff4e8] via-white to-[#f4f7ff]">
      <div className="mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-[1.05fr_1fr] gap-8 md:gap-12 items-stretch">
        <div className="relative flex flex-col justify-center bg-white/70 border border-black/10 p-8 md:p-12 shadow-[0_20px_60px_-40px_rgba(0,0,0,0.35)]">
          <p className="text-xs md:text-sm font-bold uppercase tracking-[0.35em] text-black/60">Story</p>
          <blockquote
            className="mt-6 space-y-4 text-lg md:text-2xl font-semibold leading-snug text-black/90"
          >
            {quotes.map((quote) => (
              <p key={quote}>"{quote}"</p>
            ))}
          </blockquote>
          <p className="mt-6 text-xs md:text-sm font-bold uppercase tracking-[0.3em] text-black/60">- The Model</p>
        </div>
        <div className="relative min-h-[360px] md:min-h-[520px] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-transparent" />
          <Image
            src="/images/about.png"
            alt="Model portrait"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-top"
          />
        </div>
      </div>
    </section>
  );
}
