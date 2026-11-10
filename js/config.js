// Central configuration: official palette, scene script (Arabic), hotspot content.
// World units are metres of the miniature "real" world; the AR stage scales them down.

export const PALETTE = {
  // Seven emirates — row 1 / row 2 / row 3 of the official colour scheme (Brand Guidelines p.20)
  lavender: 0xBCA9BC, coral: 0xC86757, sky: 0x7CAFDE, sun: 0xF6D178, orange: 0xD58351, peach: 0xE8C7B4, teal: 0x038C85,
  mist: 0xD5D7E3, rust: 0xAB4B23, petrol: 0x31677F, mustard: 0xE4BE59, clay: 0xA66444, linen: 0xE5DECB, olive: 0x7D9259,
  ash: 0xD3D9CF, blush: 0xF3C4BE, ice: 0xC1DEEE, cream: 0xF6E9BF, apricot: 0xF5CAA7, ivory: 0xF1ECD6, mint: 0xD1E8CC,
  // Flag
  flagRed: 0xB72B38, flagGreen: 0x388245, flagBlack: 0x111820, flagWhite: 0xFEFEFE,
  // Derived neutrals used for materials (kept inside the palette's hue family)
  skin1: 0xB98260, skin2: 0x9C6A4C, skin3: 0xC69373, kandura: 0xF4F1E8, abaya: 0x16181D,
  wood: 0x8A5634, woodDark: 0x5E3A24, frond: 0x8FAE6A, frondDry: 0xC9A86A, stone: 0xB9B2A3, brass: 0xC9A13B
};

// The seven family members — one accent colour per emirate colour (finale ring)
export const FAMILY_COLORS = [PALETTE.lavender, PALETTE.coral, PALETTE.sky, PALETTE.sun, PALETTE.orange, PALETTE.peach, PALETTE.teal];

export const BOARD = { size: 28, arWidth: 0.5 }; // 28 m miniature world shown 0.5 m wide in AR
export const AR_BASE_SCALE = BOARD.arWidth / BOARD.size;

export const SCENES = [
  {
    id: 'neighborhood', n: 1,
    title: 'الفريج القديم', en: 'The Old Emirati Neighborhood',
    narration: 'في فريجٍ قديمٍ على شاطئ الخليج، كانت البيوت تتقارب كما تتقارب القلوب. هنا تبدأ حكايتنا: حكاية أسرةٍ إماراتية تحفظ ذاكرة الوطن. اقترب من الباب الخشبي، وادخل بيت العائلة.',
    hint: 'المس الباب الخشبي لتدخل البيت، أو المس العلامات لاكتشاف الفريج',
    ambience: 'outdoor',
    frame: 12.5,
    cam: { pos: [12, 21, 29], target: [-1, 0, 1] },
    ar: { target: [0, 0, 0], zoom: 1 },
    home: 'closed',
    hotspots: ['door', 'barjeel', 'dhow', 'ghaf']
  },
  {
    id: 'home', n: 2,
    title: 'بيت العائلة', en: 'Entering the Family Home',
    narration: 'الحوش قلب البيت الإماراتي؛ ساحةٌ مفتوحة على السماء تجتمع فيها الأسرة. تحت ظل العريش تُتوارث المهارات، وفي المجلس تُروى الحكايات. تجوّل في أرجاء البيت لتلتقي بأفراد الأسرة السبعة.',
    hint: 'المس أحد أفراد الأسرة أو اختر المشهد التالي',
    ambience: 'courtyard',
    frame: 7.5,
    cam: { pos: [-1.5, 14, 15.5], target: [-2.5, 0, -1.5] },
    ar: { target: [-2.5, 0, -1.5], zoom: 1.7 },
    home: 'open',
    hotspots: ['father', 'weaving', 'majlis', 'tv']
  },
  {
    id: 'pearl', n: 3,
    title: 'الأب والغوص على اللؤلؤ', en: 'The Father and Pearl Diving',
    narration: 'قبل النفط، كان البحر مصدر الرزق. في موسم «الغوص الكبير» صيفاً، يبحر الغواصون أشهراً طويلة: يضع الغيص «الفطام» على أنفه، ويهبط بثقل «الحجر» إلى القاع، ويجمع المحار في «الديين»، ثم يسحبه «السيب» بالحبل إلى السطح. المس المحارة لتكشف سرّها.',
    hint: 'المس المحارة لتفتحها، ثم المس اللؤلؤة',
    ambience: 'courtyard',
    frame: 2.0,
    cam: { pos: [3.6, 4.6, 7.4], target: [1.1, 0.6, 0.6] },
    ar: { target: [1.1, 0, 0.6], zoom: 2.6 },
    home: 'open',
    hotspots: []
  },
  {
    id: 'weaving', n: 4,
    title: 'الأم وابنتها: حرفة السفافة', en: 'Mother and Daughter Weaving',
    narration: 'بأصابع صبورة، تعلّم الأم ابنتها «السفافة»: جدل خوص النخيل لصنع السلال والحُصر والمكبّات. هكذا تنتقل المهارة من يدٍ إلى يد، ومن جيلٍ إلى جيل.',
    hint: 'المس السلة لتتعرف على مراحل الحرفة الأربع',
    ambience: 'courtyard',
    frame: 2.3,
    cam: { pos: [-4.2, 4.4, 5.4], target: [-6.7, 0.5, -0.1] },
    ar: { target: [-6.7, 0, -0.1], zoom: 2.6 },
    home: 'open',
    hotspots: []
  },
  {
    id: 'majlis', n: 5,
    title: 'حكايات الجدة في المجلس', en: "Grandmother's Storytelling",
    narration: 'في المجلس، حيث يفوح عبق القهوة والبخور، تجمع الجدة أحفادها حولها. حكاياتها ليست للتسلية فقط؛ إنها دروسٌ في الكرم والصدق واحترام الكبير، تعبر من قلبٍ إلى قلب.',
    hint: 'المس الجدة لتسمع حكايتها',
    ambience: 'majlis',
    frame: 3.0,
    cam: { pos: [-4.3, 8.0, 0.2], target: [-5, 0.6, -5.9] },
    ar: { target: [-5, 0, -5.6], zoom: 2.4 },
    home: 'open',
    hotspots: []
  },
  {
    id: 'tv', n: 6,
    title: 'التلفاز القديم', en: 'The Old Television',
    narration: 'كان التلفاز نافذة الأسرة على الوطن والعالم، يجمعها كل مساء أمام الأخبار والبرامج. واليوم يحفظ الإعلام ذاكرتنا الوطنية، ويوثّق قصصنا للأجيال القادمة. المس التلفاز لتشاهد حكاية الاتحاد.',
    hint: 'المس التلفاز لتشغيله',
    ambience: 'majlis',
    frame: 1.6,
    cam: { pos: [-3.6, 2.6, -2.2], target: [-1.9, 0.9, -6.4] },
    ar: { target: [-2.2, 0, -5.9], zoom: 3.2 },
    home: 'open',
    hotspots: []
  },
  {
    id: 'finale', n: 7,
    title: 'ننمو معاً', en: 'Family Unity · Eid Al Etihad 55',
    narration: 'سبعة أفرادٍ في بيتٍ واحد، كما سبع إماراتٍ في وطنٍ واحد. خمسةٌ وخمسون عاماً من الاتحاد، ومع كل جيلٍ تكبر الحكاية. في عام الأسرة… ننمو معاً.',
    hint: '',
    ambience: 'finale',
    frame: 11,
    cam: { pos: [6, 17, 25], target: [-2.5, 0, 4.5] },
    ar: { target: [-2.5, 0, 3], zoom: 1.15 },
    home: 'open',
    hotspots: []
  }
];

// Info cards opened from hotspots / hero props. Illustrations are the official cut-outs.
export const INFO = {
  door: {
    kicker: 'من تفاصيل البيت', title: 'الباب الخشبي',
    img: 'assets/illustrations/house-heritage.webp',
    text: ['كانت أبواب البيوت القديمة تُصنع من الخشب المتين وتُزيَّن بالنقوش والمسامير المعدنية، وهي أول ما يستقبل الضيف في البيت الإماراتي.', 'المس الباب في المشهد ليُفتح، وادخل إلى بيت العائلة.'],
    action: 'enter'
  },
  barjeel: {
    kicker: 'عمارة البيئة', title: 'البرجيل: برج الرياح',
    img: 'assets/illustrations/house-sand.webp',
    text: ['البرجيل تقنية تبريد طبيعية في البيوت الإماراتية القديمة: برجٌ مفتوح من جهاته الأربع يلتقط النسيم ويوجّهه إلى داخل الغرف، فيخفف حرارة الصيف دون كهرباء.']
  },
  dhow: {
    kicker: 'البحر والرزق', title: 'سفينة الغوص',
    img: 'assets/illustrations/dhow.webp',
    text: ['كانت سفن الغوص الخشبية تبحر بطاقمها من الغواصين والسيوب، ومعهم «النهّام» الذي يُنشد الأهازيج ليخفف التعب ويوحّد إيقاع العمل.', 'في الداخل، يحكي الأب لأبنائه عن رحلات الغوص على اللؤلؤ.']
  },
  ghaf: {
    kicker: 'الطبيعة', title: 'شجرة الغاف',
    img: 'assets/illustrations/ghaf.webp',
    text: ['الغاف هي الشجرة الوطنية لدولة الإمارات، ورمزٌ للصمود والتسامح: تتحمّل الجفاف، وظلّ أغصانها ملتقى للناس منذ القدم.']
  },
  father: { kicker: 'المشهد 3', title: 'الأب والغوص على اللؤلؤ', img: 'assets/illustrations/net-maker.webp', text: ['يحكي الأب عن رحلات الغوص وأدواتها.'], goto: 2 },
  weaving: { kicker: 'المشهد 4', title: 'الأم وابنتها', img: 'assets/illustrations/weaver.webp', text: ['تعلّم الأم ابنتها حرفة السفافة.'], goto: 3 },
  majlis: { kicker: 'المشهد 5', title: 'مجلس الجدة', img: 'assets/illustrations/majlis.webp', text: ['تروي الجدة الحكايات لأحفادها.'], goto: 4 },
  tv: { kicker: 'المشهد 6', title: 'التلفاز القديم', img: 'assets/illustrations/family-boy.webp', text: ['نافذة الأسرة على الوطن.'], goto: 5 },

  pearl: {
    kicker: 'تراث البحر', title: 'اللؤلؤ: كنز الخليج',
    img: 'assets/illustrations/net-maker.webp',
    text: [
      'كان اللؤلؤ الطبيعي من أهم موارد المنطقة قبل اكتشاف النفط، وارتبطت به حياة الأسر والمجتمعات الساحلية.',
      'ومع انتشار اللؤلؤ المستزرع في ثلاثينيات القرن العشرين تراجعت هذه التجارة، لكن قيم الصبر والتعاون والشجاعة بقيت إرثاً يعتز به الإماراتيون.'
    ]
  },
  basket: {
    kicker: 'حرفة السفافة', title: 'من الخوص إلى السلة',
    img: 'assets/illustrations/weaver.webp',
    text: ['اختر مرحلة لترى خطوات الحرفة على السلة في المشهد.'],
    steps: [
      { tab: 'الخوص', title: 'جمع الخوص وتجفيفه', text: 'تُقطع سعفات النخيل، ويُفصل الخوص عن الجريد، ثم يُجفف تحت الشمس.' },
      { tab: 'الصباغة', title: 'التليين والصباغة', text: 'يُنقع الخوص في الماء ليلين، ويُصبغ بعضه بألوان زاهية كالأحمر والأخضر والبنفسجي.' },
      { tab: 'الجدل', title: 'الجدل (السفّ)', text: 'تُجدل الخيوط معاً في شريطٍ طويلٍ يُسمى «السفيفة».' },
      { tab: 'الخياطة', title: 'الخياطة والتشكيل', text: 'يُلفّ الشريط ويُخاط حلقةً فوق حلقة، فتتشكّل السلة أو المكبّة أو الحصير.' }
    ]
  },
  grandma: {
    kicker: 'حكاية الجدة', title: 'زرعوا فأكلنا',
    img: 'assets/illustrations/family-portrait.webp',
    story: 'تقول الجدة: مرّ رجلٌ بشيخٍ كبيرٍ يغرس فسيلة نخلة، فقال له: يا عمّ، أتزرع نخلةً قد لا تأكل من ثمرها؟ فابتسم الشيخ وقال: زرعوا فأكلنا، ونزرع فيأكلون. يا أحبابي، هكذا تُبنى الأوطان؛ كل جيلٍ يغرس لمن بعده.',
    text: ['المجلس مساحة الضيافة والحوار في البيت الإماراتي؛ فيه تُقدَّم القهوة العربية، ويتعلم الصغار آداب الحديث واحترام الكبير.', 'وقد أُدرج المجلس والقهوة العربية في قائمة اليونسكو للتراث الثقافي غير المادي عام 2015.']
  },
  tvInfo: {
    kicker: 'الإعلام وذاكرة الوطن', title: 'حكاية الاتحاد على الشاشة',
    img: 'assets/illustrations/helicopter-flag.webp',
    text: ['يعرض التلفاز تسلسلاً متحركاً قصيراً عن قيام الاتحاد ومسيرته.'],
    note: 'تنبيه: هذا المحتوى رسوم متحركة أصلية من إنتاج المشروع، وليس لقطات أرشيفية. يمكن استبداله بلقطات أرشيفية مرخّصة (انظر docs/ASSET_PLAN.md).'
  }
};

// Hotspot anchors (world coordinates) — label shown under the pin
export const HOTSPOTS = {
  door: { pos: [-2.5, 3.6, 4.6], label: 'الباب', action: 'enter' },
  barjeel: { pos: [2.3, 7.0, -5.4], label: 'البرجيل', info: 'barjeel' },
  dhow: { pos: [11.3, 5.6, -3.5], label: 'سفينة الغوص', info: 'dhow' },
  ghaf: { pos: [-12.2, 5.4, 7.4], label: 'الغاف', info: 'ghaf' },
  father: { pos: [1.0, 2.9, 0.3], label: 'الأب', goto: 2 },
  weaving: { pos: [-6.6, 3.4, -0.1], label: 'الأم وابنتها', goto: 3 },
  majlis: { pos: [-5.0, 2.6, -6.4], label: 'الجدة', goto: 4 },
  tv: { pos: [-1.9, 2.5, -6.5], label: 'التلفاز', goto: 5 }
};

// Licensed archival clip for the TV (Scene 6). Leave null to use the original animation.
// e.g. 'assets/video/tv-archive.mp4' once rights are cleared (see docs/ASSET_PLAN.md).
export const ARCHIVE_VIDEO = null;

// TV programme — original animated content (clearly labelled), not archival footage
export const TV_PROGRAM = [
  { kind: 'sea', title: 'قبل الاتحاد', sub: 'حياة البحر والصحراء', dur: 3.2 },
  { kind: 'union', title: '2 ديسمبر 1971', sub: 'قيام دولة الإمارات العربية المتحدة', dur: 4.2 },
  { kind: 'rak', title: '10 فبراير 1972', sub: 'انضمام رأس الخيمة: سبع إمارات، دولة واحدة', dur: 3.4 },
  { kind: 'build', title: 'عقودٌ من البناء', sub: 'مدنٌ ومدارس وطرق وموانئ', dur: 3.4 },
  { kind: 'mars', title: '2021', sub: 'مسبار الأمل يبلغ مدار المريخ', dur: 3.2 },
  { kind: 'family', title: '2026 · عيد الاتحاد الـ55', sub: 'عام الأسرة — ننمو معاً', dur: 4.2 }
];
