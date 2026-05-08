/**
 * Mock Database
 * ---------------------------------------------------------------------------
 * In a real backend, this data would live in a database (PostgreSQL, MongoDB,
 * etc.) and be queried by the server. Here we simulate it in-memory so the
 * frontend can be developed independently.
 *
 * To swap to a real backend: delete this file and point `api/client.js` at
 * your live API base URL. The shape of every record matches the API contract
 * documented in API_REFERENCE.md.
 */

export const MOCK_PRODUCTS = [
  {
    id: 'p_001',
    name: 'Aged Brass Desk Lamp',
    slug: 'aged-brass-desk-lamp',
    category: 'lighting',
    price: 189.00,
    currency: 'EUR',
    stock: 12,
    description:
      'A weighted brass lamp with an articulating arm and a hand-spun shade. ' +
      'Patinated by hand to give every piece a slightly different finish.',
    longDescription:
      'Inspired by mid-century drafting lamps, this piece is built from solid ' +
      'brass with a cast-iron base. The shade pivots through a full 180° and ' +
      'the arm extends to 60 cm. Wired for E27 bulbs (not included). Each ' +
      'lamp is finished by hand in our Lyon workshop, so the patina varies.',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&q=80',
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=1200&q=80',
      'https://images.unsplash.com/photo-1565374395542-0ce18882c857?w=1200&q=80',
    ],
    tags: ['lighting', 'brass', 'desk', 'workspace'],
    rating: 4.7,
    reviews: 38,
    createdAt: '2025-09-12T10:00:00Z',
  },
  {
    id: 'p_002',
    name: 'Linen Field Apron',
    slug: 'linen-field-apron',
    category: 'apparel',
    price: 64.00,
    currency: 'EUR',
    stock: 27,
    description:
      'Heavyweight Belgian linen apron, sandstone-washed for softness. Two ' +
      'deep front pockets and adjustable leather straps.',
    longDescription:
      'Cut from 280 g/m² Belgian linen and stonewashed for a worn-in feel ' +
      'from day one. Vegetable-tanned leather straps adjust at the back with ' +
      'solid brass hardware. Fits chest 90–115 cm. Designed for the kitchen, ' +
      'the workshop, or the studio.',
    image: 'https://images.unsplash.com/photo-1591375275624-c4ce7e537818?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1591375275624-c4ce7e537818?w=1200&q=80',
      'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=1200&q=80',
    ],
    tags: ['apparel', 'linen', 'apron', 'kitchen'],
    rating: 4.9,
    reviews: 112,
    createdAt: '2025-08-30T14:22:00Z',
  },
  {
    id: 'p_003',
    name: 'Hand-Thrown Stoneware Bowl',
    slug: 'hand-thrown-stoneware-bowl',
    category: 'ceramics',
    price: 42.00,
    currency: 'EUR',
    stock: 48,
    description:
      'Wheel-thrown in small batches. Glazed in a soft oat finish that pools ' +
      'beautifully along the rim.',
    longDescription:
      'Each bowl is thrown by hand in a single sitting. The clay is a coarse ' +
      'stoneware fired to 1260°C, which makes the piece chip-resistant and ' +
      'safe for the dishwasher. Variations in glaze and silhouette are part ' +
      'of the character. Diameter ~18 cm, height ~7 cm.',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=1200&q=80',
      'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&q=80',
    ],
    tags: ['ceramics', 'tableware', 'handmade'],
    rating: 4.8,
    reviews: 64,
    createdAt: '2025-10-02T09:15:00Z',
  },
  {
    id: 'p_004',
    name: 'Walnut Cutting Board',
    slug: 'walnut-cutting-board',
    category: 'kitchen',
    price: 98.00,
    currency: 'EUR',
    stock: 19,
    description:
      'A generous end-grain board in American black walnut with a routed ' +
      'juice channel and bevelled hand grip.',
    longDescription:
      'Made from FSC-certified American black walnut, finished with a food-' +
      'safe blend of mineral oil and beeswax. End-grain construction means ' +
      'the board is gentler on knife edges and more durable over time. ' +
      'Dimensions: 40 × 28 × 4 cm.',
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80',
    ],
    tags: ['kitchen', 'wood', 'walnut'],
    rating: 4.6,
    reviews: 41,
    createdAt: '2025-07-18T11:00:00Z',
  },
  {
    id: 'p_005',
    name: 'Waxed Canvas Tote',
    slug: 'waxed-canvas-tote',
    category: 'bags',
    price: 128.00,
    currency: 'EUR',
    stock: 31,
    description:
      'Waxed cotton canvas with bridle leather handles. Generous enough for ' +
      'a market run or a long weekend.',
    longDescription:
      'Built from 18oz British waxed canvas that softens and develops a ' +
      'patina with use. Hand-cut bridle leather handles are stitched with ' +
      'waxed thread. Inside there is one zip pocket and two slip pockets. ' +
      '46 × 38 × 18 cm.',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=1200&q=80',
    ],
    tags: ['bags', 'canvas', 'leather'],
    rating: 4.7,
    reviews: 87,
    createdAt: '2025-06-04T15:40:00Z',
  },
  {
    id: 'p_006',
    name: 'Cast Iron Skillet, 26 cm',
    slug: 'cast-iron-skillet-26cm',
    category: 'kitchen',
    price: 78.00,
    currency: 'EUR',
    stock: 22,
    description:
      'Pre-seasoned cast iron skillet with a long handle and a generous pour ' +
      'spout on either side.',
    longDescription:
      'A workhorse pan that improves the more you cook with it. Pre-seasoned ' +
      'with flaxseed oil at the foundry, ready to use out of the box. Oven, ' +
      'grill, and induction safe. 26 cm cooking surface, 1.9 kg.',
    image: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=1200&q=80',
    ],
    tags: ['kitchen', 'cookware', 'iron'],
    rating: 4.9,
    reviews: 203,
    createdAt: '2025-05-21T08:00:00Z',
  },
  {
    id: 'p_007',
    name: 'Wool Throw Blanket',
    slug: 'wool-throw-blanket',
    category: 'home',
    price: 156.00,
    currency: 'EUR',
    stock: 14,
    description:
      'Heavyweight throw woven from 100% lambswool in a muted herringbone ' +
      'pattern. Made in Yorkshire.',
    longDescription:
      'Woven on traditional looms in West Yorkshire, England. The wool comes ' +
      'from British flocks and is naturally water-resistant. Generous size ' +
      '(140 × 200 cm) with hand-tied fringe at both ends.',
    image: 'https://images.unsplash.com/photo-1584346133934-2a8e3a4a2e57?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1584346133934-2a8e3a4a2e57?w=1200&q=80',
    ],
    tags: ['home', 'wool', 'textile'],
    rating: 4.8,
    reviews: 56,
    createdAt: '2025-10-15T12:30:00Z',
  },
  {
    id: 'p_008',
    name: 'Leather Journal, A5',
    slug: 'leather-journal-a5',
    category: 'stationery',
    price: 54.00,
    currency: 'EUR',
    stock: 60,
    description:
      'Vegetable-tanned leather cover with 240 pages of cream cotton paper. ' +
      'Refillable.',
    longDescription:
      'Full-grain Italian leather that ages beautifully. 120 g/m² acid-free ' +
      'cotton paper inside, lay-flat binding, ribbon marker and elastic ' +
      'closure. 240 pages, A5 (148 × 210 mm). Refill blocks sold separately.',
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=1200&q=80',
    ],
    tags: ['stationery', 'leather', 'journal'],
    rating: 4.6,
    reviews: 91,
    createdAt: '2025-09-01T09:45:00Z',
  },
  {
    id: 'p_009',
    name: 'Hand-Blown Wine Glass, Set of 2',
    slug: 'hand-blown-wine-glass-set',
    category: 'glassware',
    price: 72.00,
    currency: 'EUR',
    stock: 16,
    description:
      'Slender hand-blown wine glasses with a slight imperfection in every ' +
      'piece. No two are exactly alike.',
    longDescription:
      'Mouth-blown by master glassblowers in northern Bohemia. Each glass ' +
      'holds 280 ml and stands 22 cm tall. Sold as a pair. Hand-wash only.',
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=1200&q=80',
    ],
    tags: ['glassware', 'tableware', 'handmade'],
    rating: 4.7,
    reviews: 33,
    createdAt: '2025-08-12T16:00:00Z',
  },
  {
    id: 'p_010',
    name: 'Olivewood Pepper Mill',
    slug: 'olivewood-pepper-mill',
    category: 'kitchen',
    price: 46.00,
    currency: 'EUR',
    stock: 38,
    description:
      'Turned from a single piece of seasoned olivewood. Adjustable ceramic ' +
      'grinder.',
    longDescription:
      'Each mill is turned from a single block of Mediterranean olivewood, ' +
      'so the grain is unique. The grinder mechanism is high-grade ceramic ' +
      'and adjusts from a fine dust to a coarse crack. Height 18 cm.',
    image: 'https://images.unsplash.com/photo-1599909533515-d6cdc527d6f0?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1599909533515-d6cdc527d6f0?w=1200&q=80',
    ],
    tags: ['kitchen', 'wood', 'tableware'],
    rating: 4.5,
    reviews: 28,
    createdAt: '2025-04-08T13:20:00Z',
  },
  {
    id: 'p_011',
    name: 'Indigo Linen Cushion',
    slug: 'indigo-linen-cushion',
    category: 'home',
    price: 88.00,
    currency: 'EUR',
    stock: 21,
    description:
      'Stonewashed linen cover dyed with natural indigo. Hidden zip and a ' +
      'duck-down inner.',
    longDescription:
      'Cover is 100% stonewashed Belgian linen, hand-dyed with natural ' +
      'indigo so each one varies in tone. Inner is European duck-down with ' +
      'a feather-proof cotton ticking. 50 × 50 cm. Cover is removable for ' +
      'gentle washing.',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=1200&q=80',
    ],
    tags: ['home', 'linen', 'cushion'],
    rating: 4.6,
    reviews: 47,
    createdAt: '2025-10-22T11:10:00Z',
  },
  {
    id: 'p_012',
    name: 'Copper Moka Pot, 6 cup',
    slug: 'copper-moka-pot-6cup',
    category: 'kitchen',
    price: 112.00,
    currency: 'EUR',
    stock: 9,
    description:
      'Hammered copper moka pot with a wooden handle. Brews a rich, ' +
      'concentrated coffee on any gas hob.',
    longDescription:
      'Hand-hammered copper exterior with a tin-lined interior. Wooden ' +
      'handle stays cool on the hob. Makes 6 espresso-style cups (about ' +
      '300 ml). Not induction compatible.',
    image: 'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=1200&q=80',
    ],
    tags: ['kitchen', 'coffee', 'copper'],
    rating: 4.7,
    reviews: 52,
    createdAt: '2025-03-30T07:55:00Z',
  },
];

export const MOCK_CATEGORIES = [
  { id: 'lighting', label: 'Lighting' },
  { id: 'apparel', label: 'Apparel' },
  { id: 'ceramics', label: 'Ceramics' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'bags', label: 'Bags' },
  { id: 'home', label: 'Home' },
  { id: 'stationery', label: 'Stationery' },
  { id: 'glassware', label: 'Glassware' },
];

/**
 * Mock users. In a real backend, passwords would be hashed (bcrypt/argon2)
 * and never returned to the client. Here we keep them in plain text only
 * so the demo can validate logins client-side.
 */
export const MOCK_USERS = [
  {
    id: 'u_001',
    email: 'alice@example.com',
    password: 'password123',
    name: 'Alice Durand',
    role: 'customer',
    createdAt: '2025-01-15T10:00:00Z',
  },
  {
    id: 'u_002',
    email: 'bob@example.com',
    password: 'password123',
    name: 'Bob Mansouri',
    role: 'customer',
    createdAt: '2025-02-20T14:30:00Z',
  },
  {
    id: 'u_admin',
    email: 'admin@atelier.shop',
    password: 'admin1234',
    name: 'Atelier Admin',
    role: 'admin',
    createdAt: '2024-12-01T08:00:00Z',
  },
];
