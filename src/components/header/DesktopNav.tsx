import Link from "next/link";
import Image from "next/image";
import { NavCategory, navLinks, HEADER_IMAGES } from "./types";

type NavLabelWithArrowProps = {
  label: string;
};

function NavLabelWithArrow({ label }: NavLabelWithArrowProps) {
  return (
    <span className="inline-flex items-center">
      {label}
      <svg
        className="ml-1 h-7 w-7 transition-transform duration-200 group-hover:rotate-180"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M5.25 7.5L10 12.25L14.75 7.5H5.25Z" />
      </svg>
    </span>
  );
}

export default function DesktopNav({ navTreeBySlug }: { navTreeBySlug: Map<string, NavCategory> }) {
  return (
    <nav className="hidden lg:flex items-center gap-7 mx-8">
      {navLinks.map((link) => {
        // Look up this level-0 slug in the dynamic tree
        const cat = navTreeBySlug.get(link.slug);
        const hasChildren = cat && cat.children.length > 0;

        if (!hasChildren) {
          // No dropdown (VIIT Exclusive, or if DB has no children yet)
          return (
            <Link
              key={link.label}
              href={link.href}
              className={`group text-sm font-bold tracking-wider uppercase transition-opacity hover:opacity-70 whitespace-nowrap ${link.highlight ? "text-[#FFCC00]" : "text-black"}`}
            >
              {link.label}
            </Link>
          );
        }

        const headerImg = HEADER_IMAGES[link.slug];

        // Determine layout: if any sub-category has children → two-column, else simple
        const hasSubSub = cat.children.some(sub => sub.children.length > 0);

        return (
          <div key={link.label} className="group">
            <Link
              href={link.href}
              className={`relative inline-flex text-[15px] font-bold tracking-wider uppercase transition-opacity hover:opacity-70 whitespace-nowrap after:absolute after:left-0 after:-bottom-1 after:h-[2px] after:w-full after:origin-left after:scale-x-0 after:transition-transform after:duration-200 after:content-[''] group-hover:after:scale-x-100 ${link.highlight ? "text-[#FFCC00] after:bg-[#FFCC00]" : "text-black after:bg-current"}`}
            >
              <NavLabelWithArrow label={link.label} />
            </Link>

            <div className="absolute left-0 right-0 top-full mt-0 w-screen rounded-lg border border-gray-200 bg-white shadow-lg pt-4 opacity-0 translate-y-2 pointer-events-none transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto z-50 before:absolute before:left-0 before:right-0 before:-top-10 before:h-10 before:content-[''] before:block">
              {hasSubSub ? (
                // ── Two-column layout: each level-1 becomes a column ──
                <div className="grid gap-6 px-5 pb-5" style={{ gridTemplateColumns: `auto repeat(${cat.children.length}, minmax(0,1fr))` }}>
                  {/* Header image */}
                  {headerImg && (
                    <div className="relative min-w-0 w-[370px] aspect-[4/5] justify-self-start">
                      <Image src={headerImg.src} alt={headerImg.alt} fill sizes="(max-width: 768px) 100vw, 370px" className="rounded-md object-cover" />
                    </div>
                  )}
                  {cat.children.map(sub => (
                    <div key={sub._id} className="min-w-0">
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-3">
                        <Link href={`/${link.slug}/${sub.slug}`} className="hover:underline">{sub.label}</Link>
                      </div>
                      <div className="flex flex-col gap-2">
                        {sub.children.map(subsub => (
                          <Link
                            key={subsub._id}
                            href={`/${link.slug}/${sub.slug}/${subsub.slug}`}
                            className="text-sm font-semibold text-black hover:opacity-70 hover:underline underline-offset-4"
                          >
                            {subsub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // ── Simple layout: flat list of level-1 sub-categories ──
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-6 px-5 pb-5">
                  {headerImg && (
                    <div className="relative min-w-0 w-[370px] aspect-[4/5] justify-self-start">
                      <Image src={headerImg.src} alt={headerImg.alt} fill sizes="(max-width: 768px) 100vw, 370px" className="rounded-md object-cover" />
                    </div>
                  )}
                  <div className="flex flex-col gap-2">
                    {cat.children.map(sub => (
                      <Link
                        key={sub._id}
                        href={`/${link.slug}/${sub.slug}`}
                        className="text-sm font-semibold text-black hover:opacity-70 hover:underline underline-offset-4 whitespace-nowrap"
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
