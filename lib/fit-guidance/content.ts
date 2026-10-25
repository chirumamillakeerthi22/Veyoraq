import type { Audience } from "@/lib/audience";
import type { Shape } from "./options";

/*
  The styling guidance behind Fit Guidance. It is written, reviewed text, not AI
  output, so the same choices always give the same advice and nothing is invented on
  the fly. Every tip says why it might help. The wording is deliberately flexible:
  these are options to explore, and anyone can wear whatever they enjoy.
*/

export type Tip = { title: string; why: string };

export type Guide = {
  intro: string;
  silhouettes: Tip[];
  tops: Tip[];
  bottoms: Tip[];
  // Women's guidance only (dresses, skirts and jumpsuits).
  dresses: Tip[];
  lengths: Tip[];
  layers: Tip[];
  shopping: Tip[];
};

const t = (title: string, why: string): Tip => ({ title, why });

const womenGuides: Record<Shape, Guide> = {
  hourglass: {
    intro:
      "Your shoulders and hips are close in width, with a smaller waist. Many people with this balance enjoy clothes that follow the waistline, and plenty prefer loose, boxy shapes instead. Both are good choices.",
    silhouettes: [
      t("Wrap and fit-and-flare shapes", "They follow the waist you already have without needing extra structure."),
      t("Easy, straight shapes", "If you would rather not show the waist, the matching shoulders and hips keep these looking balanced, belted or loose."),
    ],
    tops: [
      t("V, scoop or wrap necklines", "Open necklines give the bust room and keep the top half from feeling crowded."),
      t("Lightly fitted or half-tucked tops", "Tucking just the front lets the waist show in a relaxed way."),
    ],
    bottoms: [
      t("High-rise trousers and A-line or pencil skirts", "The waistband sits where you are narrowest, so it tends to stay put."),
      t("Fabrics with stretch or drape", "Stiff fabrics can gape at the waist when the hips are fuller."),
    ],
    dresses: [t("Wrap dresses and belted shirt-dresses", "The tie or belt lets you adjust the waist for comfort.")],
    lengths: [
      t("Knee to mid-calf hems", "These keep the line even from shoulder to hem."),
      t("Jackets that end at the waist or just below", "They keep the waistline visible if you like that."),
    ],
    layers: [t("Belted coats and open cardigans", "A belt adds shape, and leaving it off gives an easy long line.")],
    shopping: [
      t("If it fits your hips but gapes at the waist", "Look for stretch waists, or have the waist taken in."),
      t("Check button shirts across the bust", "If buttons pull, try a wrap or stretch style, or size up and tailor the waist."),
    ],
  },
  pear: {
    intro:
      "Your hips are a little fuller than your shoulders. Some people like to balance this with detail up top, and others prefer to keep everything simple and fluid. It is your call.",
    silhouettes: [
      t("A-line skirts and dresses", "They skim over the hips and move easily."),
      t("Wide-leg or straight trousers", "A straighter line from hip to hem keeps the proportions even."),
    ],
    tops: [
      t("Boat, off-shoulder or detailed necklines", "Interest near the shoulders adds visual width on top if you want balance."),
      t("Structured shoulders and puff or flutter sleeves", "They build the upper half a little without adding bulk."),
    ],
    bottoms: [
      t("Simple, solid-coloured bottoms", "Plain lower halves with brighter or patterned tops draw the eye upward, if you enjoy that contrast."),
      t("Bootcut or flared trousers", "A slightly wider hem balances the hip line."),
    ],
    dresses: [t("Fit-and-flare or empire dresses", "A fitted bodice with a flowing skirt follows your proportions without clinging.")],
    lengths: [t("Tops ending at the hip bone or just above", "Where a hem lands changes how the hips read, so try a few lengths and keep what feels right.")],
    layers: [t("Structured or cropped jackets", "Shoulder structure and a shorter length balance fuller hips.")],
    shopping: [
      t("You may wear different sizes on top and bottom", "Buying separates, or tops and bottoms in different sizes, often fits best."),
      t("Gaping at the back of trousers", "Look for a curved or contoured waistband, or a little stretch."),
    ],
  },
  apple: {
    intro:
      "You carry more fullness around the middle, often with slimmer legs. Many people like fluid fabrics and long vertical lines here, and that is only one option. Comfort comes first.",
    silhouettes: [
      t("Empire and A-line shapes", "They skim the middle and let fabric fall freely."),
      t("Straight, relaxed cuts", "Easy shapes are comfortable and keep a clean line."),
    ],
    tops: [
      t("V or scoop necklines", "They create a vertical line and keep the neck area open."),
      t("Longer, drapey or wrap tops", "Fluid fabric moves with you and does not pull across the middle."),
    ],
    bottoms: [
      t("Straight or bootcut trousers with a soft waistband", "A flat-front, stretch or elastic waist is comfortable all day."),
      t("A-line or flat-front skirts", "No extra gathers at the waist."),
    ],
    dresses: [t("Wrap, empire and shift dresses", "Wraps adjust at the middle, and shifts hang straight.")],
    lengths: [t("Tunic-length tops, knee-length hems", "A hem that falls past the middle is comfortable, and showing your legs is an option if you like it.")],
    layers: [t("Open-front cardigans and unbuttoned jackets", "They add long vertical lines without needing to close at the middle.")],
    shopping: [
      t("Size by the widest part", "Then have the shoulders or hem adjusted if needed, so nothing pulls."),
      t("Check the rise", "Mid or high rises with a wider band are often more comfortable than low rises."),
    ],
  },
  rectangle: {
    intro:
      "Your shoulders, waist and hips are fairly even. You can add curves with shape and detail, or embrace clean, straight lines. Neither is better.",
    silhouettes: [
      t("Wrap, peplum and belted shapes", "They create the look of a waist if you would like one."),
      t("Column and boxy shapes", "Straight lines suit even proportions and look modern."),
    ],
    tops: [
      t("Ruffles, layers and texture", "Detail adds dimension to a straighter frame."),
      t("Relaxed, straight tops", "Easy shapes look effortless and stay comfortable."),
    ],
    bottoms: [
      t("Pleated, full or A-line skirts", "They add movement and a little shape below."),
      t("Wide-leg, cargo or paperbag-waist trousers", "Volume and waist details add interest."),
    ],
    dresses: [t("Belted shirt-dresses and wrap dresses", "A belt gives instant shape, and removing it gives an easy shift.")],
    lengths: [t("Cropped jackets with high-rise bottoms", "They shorten the torso and suggest a waist.")],
    layers: [t("Belted coats and structured blazers", "A nipped waist adds shape, and an oversized blazer is a good alternative.")],
    shopping: [t("Look for waist details", "Darts, seams or adjustable ties give shape without tight fits.")],
  },
  "inverted-triangle": {
    intro:
      "Your shoulders or bust are a little broader than your hips. Some people like to add fullness below to balance this, and others love the strong shoulder line. Both work.",
    silhouettes: [
      t("A-line skirts and flared trousers", "Fullness below balances a broader upper half."),
      t("Soft, flowing dresses", "Fabric that moves keeps the line gentle from top to bottom."),
    ],
    tops: [
      t("V or scoop necklines and softer shoulders", "Raglan or dropped shoulders and open necklines keep the shoulder line soft."),
      t("Simple tops with detail kept low", "Pattern or colour on the bottom half adds visual weight below."),
    ],
    bottoms: [
      t("Wide-leg, bootcut and pleated trousers", "More fabric at the hem balances the shoulder line."),
      t("Patterned or lighter-coloured bottoms", "They draw attention below if you want balance."),
    ],
    dresses: [t("A-line and fit-and-flare dresses", "A fuller skirt balances the shoulders.")],
    lengths: [t("Hip-length tops that fall softly; midi skirts", "They add a little length and fullness lower down.")],
    layers: [t("Soft-shouldered jackets and long open layers", "Heavy shoulder pads can add width, so softer constructions are an easy choice.")],
    shopping: [
      t("Size jackets by the shoulders", "Then have the waist or sleeves tailored."),
      t("Stretch across the bust", "It makes fitted tops more comfortable."),
    ],
  },
  trapezoid: { ...({} as Guide) },
  unsure: {
    intro:
      "You do not need a body-shape label to dress well. Start with what feels comfortable, and try a few shapes to see what you enjoy wearing.",
    silhouettes: [
      t("Try straight, A-line and wrap shapes", "Comparing a few shapes in a fitting room shows what feels like you."),
      t("Notice what you reach for", "The pieces you wear most are the best clue to your fit preferences."),
    ],
    tops: [t("Try a few necklines", "V, scoop, crew and boat necks each frame the shoulders and neck differently, so choose by comfort and how you like them.")],
    bottoms: [t("Compare rises and legs", "Mid and high rises and straight or wide legs sit differently, and the right one is the one that is comfortable.")],
    dresses: [t("Wrap and shirt dresses are adjustable", "A tie or buttons let one size flex for comfort.")],
    lengths: [t("Try hems at different points", "Where a hem or jacket ends changes proportion, so try a few.")],
    layers: [t("Add one layer you love", "A cardigan, blazer or jacket in a shape you like can pull a look together.")],
    shopping: [
      t("Check shoulders, waist and hips", "A garment that fits in all three places will usually feel best."),
      t("Tailoring is normal", "Small changes like hems and waists are common and often inexpensive."),
    ],
  },
};
// Trapezoid is offered to men only.
womenGuides.trapezoid = womenGuides.unsure;

const menGuides: Record<Shape, Guide> = {
  rectangle: {
    intro:
      "Your shoulders, waist and hips are fairly even. You can add shape with structure and layers, or keep things clean and straight. Both are good looks.",
    silhouettes: [
      t("Structured jackets and layers", "Shoulder structure and layering add dimension to a straighter frame."),
      t("Tapered or straight trousers", "A clean line from hip to ankle looks sharp and is easy to wear."),
    ],
    tops: [
      t("Textured knits, overshirts and patterns", "Texture and pattern add interest and visual width on top."),
      t("Well-fitted shirts", "Shoulder seams on the shoulder point and a trim body look neat without being tight."),
    ],
    bottoms: [t("Slim-straight or tapered trousers", "They keep the leg line clean and balance a layered top.")],
    dresses: [],
    lengths: [t("Jackets that end around mid-seat", "A mid-seat hem keeps proportions even and is easy to wear.")],
    layers: [t("Structured blazers and chore jackets", "Defined shoulders and a little shaping at the waist add presence.")],
    shopping: [t("Check the shoulders first", "If the shoulders fit, the rest can be tailored easily.")],
  },
  trapezoid: {
    intro:
      "You have broad shoulders and a chest that tapers toward the waist. Many cuts suit this balance, so choose by comfort and how you like to look.",
    silhouettes: [
      t("Tailored and regular fits", "Most standard cuts sit well when shoulders are broader than the waist."),
      t("Single-breasted jackets", "A clean front follows the shoulder-to-waist line."),
    ],
    tops: [
      t("Shirts that fit the shoulders with a slight taper", "Fitting the shoulders first avoids excess fabric at the waist."),
      t("Crew and V necks", "Both frame broader shoulders cleanly."),
    ],
    bottoms: [t("Straight or lightly tapered trousers", "They balance the upper body without looking tight.")],
    dresses: [],
    lengths: [t("Shirts that end below the belt", "A little extra length stays tucked in or looks neat untucked.")],
    layers: [t("Fitted blazers and bombers", "They follow the natural taper and add polish.")],
    shopping: [t("Look for slim or athletic cuts", "They add room in the chest and shoulders and less at the waist.")],
  },
  "inverted-triangle": {
    intro:
      "Your shoulders and chest are noticeably broader than your waist. Some people like to add visual weight below, and others enjoy the strong V. Pick what you like.",
    silhouettes: [
      t("Straight and relaxed trousers", "A little more room through the leg balances broad shoulders."),
      t("Easy, unstructured layers", "Softer shapes keep the shoulder line from dominating."),
    ],
    tops: [
      t("V-necks and open collars", "They add a vertical line and break up the chest area."),
      t("Soft, unpadded shoulders", "Padding adds width, so lighter constructions are comfortable."),
    ],
    bottoms: [t("Straight-leg trousers with room in the thigh", "They sit comfortably and balance the upper body.")],
    dresses: [],
    lengths: [t("Untucked tops that end at mid-hip", "A softer hem is comfortable and avoids a tight waist.")],
    layers: [t("Unstructured blazers and overshirts", "They add layers without extra shoulder bulk.")],
    shopping: [
      t("Size by the chest and shoulders", "Then taper the body or sleeves if there is extra fabric at the waist."),
      t("Look for stretch", "It adds comfort across the chest and arms."),
    ],
  },
  pear: {
    intro:
      "Your hips are a little fuller than your shoulders. Some people like to add visual weight on top, and others keep everything even. It is a matter of preference.",
    silhouettes: [
      t("Structured shoulders and layering on top", "A little extra presence above balances fuller hips."),
      t("Straight or bootcut trousers", "A straight line from hip to ankle keeps things even."),
    ],
    tops: [
      t("Shoulder details, lighter colours and textures", "Visual interest near the shoulders balances the lower half."),
      t("Overshirts and jackets", "Layers add width up top."),
    ],
    bottoms: [t("Darker, simple trousers with room at the hip", "A plain lower half lets the top take the lead.")],
    dresses: [],
    lengths: [t("Jackets that end at or just below the hip", "A longer jacket skims over the hips comfortably.")],
    layers: [t("Structured blazers", "Defined shoulders balance hip width.")],
    shopping: [t("Check the seat and thigh", "If trousers fit there but gape at the waist, a belt or small tailoring change helps.")],
  },
  apple: {
    intro:
      "You carry more fullness around the middle. Many people like straight lines and soft fabrics here, and comfort should lead. Style it your way.",
    silhouettes: [
      t("Straight, vertical lines", "They look clean and keep fabric from clinging at the middle."),
      t("Relaxed rather than tight fits", "Comfortable shapes move well."),
    ],
    tops: [
      t("V-necks and longer, untucked shirts", "They add vertical lines and give the middle space."),
      t("Dark or solid tops", "A single colour from top to bottom creates a long line."),
    ],
    bottoms: [t("Mid-rise, straight trousers with a comfortable waistband", "A flat-front or soft stretch waist stays comfortable.")],
    dresses: [],
    lengths: [t("Shirts that end below the belt line", "Extra length gives coverage and a neat line.")],
    layers: [t("Unbuttoned single-breasted jackets and long cardigans", "They add vertical lines without needing to close.")],
    shopping: [
      t("Size by the widest part", "Then have the shoulders or sleeves tailored."),
      t("Look for stretch and a flexible waist", "Both make all-day wear easier."),
    ],
  },
  hourglass: { ...({} as Guide) },
  unsure: {
    intro:
      "You do not need a body-shape label to dress well. Start with what feels comfortable, and try a few shapes to see what you enjoy wearing.",
    silhouettes: [
      t("Try straight, tapered and relaxed cuts", "Comparing a few in a fitting room shows what feels like you."),
      t("Notice what you reach for", "The pieces you wear most are the best clue to your fit preferences."),
    ],
    tops: [t("Try different collars and necklines", "Crew, V, polo and open collars frame the neck and shoulders differently.")],
    bottoms: [t("Compare rises and legs", "Straight, tapered and relaxed legs sit differently, and comfort is a good guide.")],
    dresses: [],
    lengths: [t("Try jacket and shirt lengths", "Where a hem ends changes proportion, so try a few.")],
    layers: [t("Add one layer you love", "An overshirt, blazer or jacket in a shape you like can pull a look together.")],
    shopping: [
      t("Check shoulders, chest and waist", "A garment that fits in all three places will usually feel best."),
      t("Tailoring is normal", "Small changes like hems and sleeves are common and often inexpensive."),
    ],
  },
};
// Hourglass is offered to women only.
menGuides.hourglass = menGuides.unsure;

export function guideFor(audience: Audience, shape: Shape): Guide {
  return (audience === "women" ? womenGuides : menGuides)[shape];
}

/* ---------- Extra notes that reflect a person's own choices ---------- */

export const fitPrefNotes: Record<string, string> = {
  relaxed: "You prefer a relaxed fit, so look for room through the body and a softer shoulder, and choose size by comfort.",
  regular: "You prefer a regular fit, which sits close without clinging. Standard cuts are a good starting point.",
  tailored: "You prefer a tailored fit, so look for darts, shaped seams and structure, and plan on small alterations.",
  close: "You prefer a close fit, so choose fabrics with some stretch and check you can move and sit comfortably.",
};

export const focusNotes: Record<string, string> = {
  "define-waist": "To show your waist: wraps, belts, darts and high-rise bottoms give definition without needing a tight fit.",
  "balance-proportions": "To balance upper and lower halves: use colour, pattern and detail on the half you would like to emphasise, and keep the other plainer.",
  "add-structure": "To add structure: blazers, firm fabrics and defined shoulders give shape, with room to move.",
  "lengthen-line": "To create a longer line: monochrome outfits, high-rise bottoms and vertical details such as open layers help.",
  "keep-easy": "To keep things easy: choose forgiving fabrics, simple shapes and pieces that mix and match without effort.",
};

export const comfortNotes: Record<string, string> = {
  "covered-arms": "For covered arms: look for three-quarter or long sleeves in light, breathable fabrics, and open layers you can add or remove.",
  "longer-hemlines": "For more coverage: midi and maxi lengths, longer tops and straight-leg trousers all work and stay easy to move in.",
  "no-tight-waist": "To avoid tight waistbands: elastic, drawstring and stretch waists, wrap styles and tops that fall past the waist are all options.",
  stretch: "For stretch: look for a small amount of elastane in trousers and fitted tops, and knits that move with you.",
  "easy-movement": "For easy movement: check you can lift your arms, sit and walk comfortably, and prefer gussets, stretch and roomier cuts where needed.",
};

export const occasionNotes: Record<string, string> = {
  everyday: "Everyday: comfortable, mix-and-match pieces in the shapes above will do most of the work.",
  work: "Work: structured jackets, well-fitted trousers and simple tops look polished, with tailoring where it helps.",
  occasion: "Parties and occasions: a more structured or draped piece, and trying it on with the shoes you will wear, makes a difference.",
  travel: "Travel: choose fabrics that resist creasing, layers you can add or remove, and cuts that stay comfortable seated.",
};
