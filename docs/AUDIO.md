# Audio and narration structure

## How narration plays

For every narration id the app tries, in order:

1. **Recorded voice-over:** `assets/audio/narration/<id>.mp3`, used only if the id is listed in `assets/audio/narration/manifest.json` (so missing files never cause network errors).
2. **The device Arabic text-to-speech voice** (Web Speech API, prefers ar-AE). This is a **temporary placeholder**: quality varies by phone and some devices have no Arabic voice.
3. **Captions only.** The Arabic text is always on screen in every case, which also serves deaf and hard-of-hearing visitors.

While a voice plays, ambience and music duck automatically. Visitors can mute narration (microphone button) and ambience (speaker button) separately, and replay the current narration (play button on the caption).

## Recording specification

* Emirati Arabic narrator, warm and unhurried (about 150 words per minute); the grandmother story ideally voiced by an older female voice.
* 48 kHz WAV masters → deliver **MP3 128 kbps mono**, normalised to −16 LUFS, with 150 ms head and tail silence.
* File name = id below, e.g. `neighborhood.mp3`; then add the id to `manifest.json` → `"files": ["neighborhood", ...]`.

## Narration script

| id | Scene | Arabic text |
|---|---|---|
| `neighborhood` | 1 · الفريج القديم | في فريجٍ قديمٍ على شاطئ الخليج، كانت البيوت تتقارب كما تتقارب القلوب. هنا تبدأ حكايتنا: حكاية أسرةٍ إماراتية تحفظ ذاكرة الوطن. اقترب من الباب الخشبي، وادخل بيت العائلة. |
| `home` | 2 · بيت العائلة | الحوش قلب البيت الإماراتي؛ ساحةٌ مفتوحة على السماء تجتمع فيها الأسرة. تحت ظل العريش تُتوارث المهارات، وفي المجلس تُروى الحكايات. تجوّل في أرجاء البيت لتلتقي بأفراد الأسرة السبعة. |
| `pearl` | 3 · الأب والغوص على اللؤلؤ | قبل النفط، كان البحر مصدر الرزق. في موسم «الغوص الكبير» صيفاً، يبحر الغواصون أشهراً طويلة: يضع الغيص «الفطام» على أنفه، ويهبط بثقل «الحجر» إلى القاع، ويجمع المحار في «الديين»، ثم يسحبه «السيب» بالحبل إلى السطح. المس المحارة لتكشف سرّها. |
| `weaving` | 4 · الأم وابنتها: حرفة السفافة | بأصابع صبورة، تعلّم الأم ابنتها «السفافة»: جدل خوص النخيل لصنع السلال والحُصر والمكبّات. هكذا تنتقل المهارة من يدٍ إلى يد، ومن جيلٍ إلى جيل. |
| `majlis` | 5 · حكايات الجدة في المجلس | في المجلس، حيث يفوح عبق القهوة والبخور، تجمع الجدة أحفادها حولها. حكاياتها ليست للتسلية فقط؛ إنها دروسٌ في الكرم والصدق واحترام الكبير، تعبر من قلبٍ إلى قلب. |
| `tv` | 6 · التلفاز القديم | كان التلفاز نافذة الأسرة على الوطن والعالم، يجمعها كل مساء أمام الأخبار والبرامج. واليوم يحفظ الإعلام ذاكرتنا الوطنية، ويوثّق قصصنا للأجيال القادمة. المس التلفاز لتشاهد حكاية الاتحاد. |
| `finale` | 7 · ننمو معاً | سبعة أفرادٍ في بيتٍ واحد، كما سبع إماراتٍ في وطنٍ واحد. خمسةٌ وخمسون عاماً من الاتحاد، ومع كل جيلٍ تكبر الحكاية. في عام الأسرة… ننمو معاً. |
| `grandma-story` | 5 · story (tap the grandmother) | تقول الجدة: مرّ رجلٌ بشيخٍ كبيرٍ يغرس فسيلة نخلة، فقال له: يا عمّ، أتزرع نخلةً قد لا تأكل من ثمرها؟ فابتسم الشيخ وقال: زرعوا فأكلنا، ونزرع فيأكلون. يا أحبابي، هكذا تُبنى الأوطان؛ كل جيلٍ يغرس لمن بعده. |
| `pearl-info` | 3 · pearl card (tap the pearl) | كان اللؤلؤ الطبيعي من أهم موارد المنطقة قبل اكتشاف النفط، وارتبطت به حياة الأسر والمجتمعات الساحلية. ومع انتشار اللؤلؤ المستزرع في ثلاثينيات القرن العشرين تراجعت هذه التجارة، لكن قيم الصبر والتعاون والشجاعة بقيت إرثاً يعتز به الإماراتيون. |

## Sound design (procedural, `js/audio/audioEngine.js`)

All ambience and effects are synthesised live with the Web Audio API, so there are no downloads and the site works offline. Each one can later be replaced with a recorded file.

| Ambience | Content |
|---|---|
| outdoor (scene 1) | Filtered wind, slow sea swell, occasional bird calls |
| courtyard (2–4) | Softer wind, distant birds, occasional oud-like phrase |
| majlis (5–6) | Low room tone, oud-like plucked phrases in maqam Hijaz |
| finale (7) | Frame-drum (daf) pulse with festive plucked phrases |

| Effect | Trigger |
|---|---|
| door | wooden door creak and thud when the house opens |
| oyster / shimmer | shell opening, pearl reveal |
| rustle | palm-frond weaving |
| tv-on | CRT whine and static |
| celebrate | finale drum roll and phrase |
| tap | soft confirmation on any interaction |

Recommended upgrade: a short licensed or commissioned recording of Emirati folk instrumentation (for example *ayyala*-style percussion for the finale and a *nahma* sea-song fragment for scene 3), with rights cleared for public exhibition.
