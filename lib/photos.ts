/*
  Editorial photography from Unsplash (https://unsplash.com/license: free to use,
  including commercially, no permission required). Only photos from the free
  library are used, not Unsplash+.

  These are inspiration images, not products. Each entry records the photo's
  Unsplash ID, its page and the photographer's handle so it can be credited
  or replaced.
*/

type Photo = {
  id: string;
  alt: string;
  page: string;
  photographer: string;
};

export const photos = {
  hero: {
    id: "1668952135120-7d997b1b3778",
    alt: "A woman in a long camel coat and matching wide trousers against a pale studio wall",
    page: "a-woman-in-a-long-coat-Qy8IEssqkYU",
    photographer: "@onurssenay",
  },
  colour: {
    id: "1524404794194-16bae22718c0",
    alt: "A neat stack of folded fabrics shading from cream through blush to coral",
    page: "pile-of-cloth-on-white-surface-4byBtNuIyIg",
    photographer: "@melpoole",
  },
  hair: {
    id: "1759396200634-2282cfe0f1e4",
    alt: "Shoulder-length curly hair seen from behind in soft daylight",
    page: "woman-with-curly-hair-in-a-black-shirt-outdoors-Re6pyBDuCAo",
    photographer: "@charlottemlj",
  },
  everyday: {
    id: "1632282005753-29f80ed13c93",
    alt: "Someone seated in a cream knit and relaxed cream trousers",
    page: "a-woman-sitting-in-a-chair-with-her-legs-crossed-_f56H_jm8jA",
    photographer: "@gabriellefaithhenderson",
  },
  minimal: {
    id: "1621341103818-01dada8c6ef8",
    alt: "Close view of a soft taupe shirt with a hand wearing a fine bracelet",
    page: "person-in-white-dress-shirt-wearing-silver-link-bracelet-round-analog-watch-EMzhgIxjPgI",
    photographer: "@aromatiche",
  },
  occasion: {
    id: "1599459183743-7ac40a55ad69",
    alt: "Black and white detail of a draped satin dress",
    page: "a-black-and-white-photo-of-a-woman-in-a-dress-N2NQzbTEtzM",
    photographer: "@kate_gliz",
  },
  flatLay: {
    id: "1614676471928-2ed0ad1061a4",
    alt: "Flat lay of rust and brown knitwear, checked trousers and leather shoes",
    page: "brown-leather-shoes-beside-brown-leather-belt-NKjIT7u5nXE",
    photographer: "@_imd",
  },
  journalColour: {
    id: "1705412877691-70f6913aaa1e",
    alt: "Overlapping woven fabrics in sage green and warm beige",
    page: "a-close-up-of-several-different-colors-of-fabric-mPCCiE4vpzQ",
    photographer: "@lensyfoxography",
  },
  journalSilhouette: {
    id: "1791064543809-5bde33c40e34",
    alt: "A cream jacket and shorts hanging on a rail against a white wall",
    page: "cream-jacket-and-shorts-on-rack-ObftURPUYZU",
    photographer: "@___atmos",
  },
  journalTexture: {
    id: "1601379327928-bedfaf9da2d0",
    alt: "A stack of folded knitwear in grey and oatmeal",
    page: "white-and-brown-knit-textile-Ds4TsdS095U",
    photographer: "@izgubljenausvemiru",
  },
  journalEveryday: {
    id: "1580682312385-e94d8de1cf3c",
    alt: "White and pale shirts hanging in a row on a clothes rail",
    page: "white-long-sleeve-shirt-on-white-clothes-hanger-jYz3EGBhDpk",
    photographer: "@dinhnext",
  },
  journalOccasion: {
    id: "1604882767135-b41fac508fff",
    alt: "Coats and knitwear in cream, camel and deep red on a rail",
    page: "brown-and-white-coat-hanged-on-rack-my5cwTzhmNI",
    photographer: "@priscilladupreez",
  },
} satisfies Record<string, Photo>;

export type PhotoName = keyof typeof photos;

// next/image resizes this for each screen, so one generous source width is enough.
export function photoUrl(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;
}
