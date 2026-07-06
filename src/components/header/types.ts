export type NavLink = {
  label: string;
  href: string;
  slug: string; // matches SubCategory.slug for DB tree lookup
  highlight?: boolean;
};

export const navLinks: NavLink[] = [
  { label: "VIIT EXCLUSIVE", href: "/viit-exclusive", slug: "viit-exclusive" },
  { label: "WOMAN",          href: "/woman",          slug: "woman" },
  { label: "MAN",            href: "/man",            slug: "man" },
  { label: "KIDS",           href: "/kids",           slug: "kids" },
  { label: "ACCESSORIES",    href: "/accessories",    slug: "accessories" },
  { label: "HANDBAG",        href: "/handbag",        slug: "handbag" },
];

export const HEADER_IMAGES: Record<string, { src: string; alt: string }> = {
  woman:          { src: '/images/woman-header.jpeg',    alt: 'Women collection'    },
  man:            { src: '/images/man-header.jpeg',      alt: 'Men collection'      },
  kids:           { src: '/images/kids.PNG',             alt: 'Kids collection'     },
  accessories:    { src: '/images/accessories.PNG',      alt: 'Accessories'         },
  handbag:        { src: '/images/hand-bag.PNG',         alt: 'Hand Bags'           },
  'viit-exclusive': { src: '/images/viit-exclusive.PNG', alt: 'VIIT Exclusive'      },
};

export type NavSubSubCategory = {
  _id: string; slug: string; label: string; level: 2; parentId: string;
};

export type NavSubCategory = {
  _id: string; slug: string; label: string; level: 1; parentId: string; image?: string;
  children: NavSubSubCategory[];
};

export type NavCategory = {
  _id: string; slug: string; label: string; level: 0; image?: string;
  children: NavSubCategory[];
};
