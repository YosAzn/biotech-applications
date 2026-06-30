import React, { useState, useEffect, useRef } from 'react';
import {
  Microscope, Activity, ChevronLeft, ChevronRight, Info, List, ClipboardList,
  LineChart, TestTube2, Droplets, Beaker, Thermometer, Clock,
  GitMerge, Fingerprint, Dna, Zap, Image as ImageIcon,
  CheckCircle2, BrainCircuit, FileText, X, Upload, Trash2, Images, ExternalLink,
  Sun, Moon, Calculator, BookOpen, RefreshCw, TableProperties, ListChecks
} from 'lucide-react';

// --- Neon accent (hex) per station, derived from its Tailwind textAccent ---
const NEON = {
  purple: '#c084fc', cyan: '#22d3ee', emerald: '#34d399', orange: '#fb923c',
  pink: '#f472b6', yellow: '#facc15', lime: '#a3e635', teal: '#2dd4bf',
  blue: '#60a5fa', rose: '#fb7185', amber: '#fbbf24',
};
const neonOf = (textAccent = '') => {
  const key = Object.keys(NEON).find(k => textAccent.includes(k));
  return NEON[key] || '#22d3ee';
};

// --- Google Drive helpers: turn share links into inline preview embeds ---
const driveId = (url = '') => {
  const m = url.match(/\/d\/([^/]+)/) || url.match(/[?&]id=([^&]+)/) || url.match(/\/folders\/([^/?]+)/);
  return m ? m[1] : null;
};
const drivePreview = (url = '') => {
  const id = driveId(url);
  if (!id) return url;
  if (url.includes('/folders/')) return `https://drive.google.com/embeddedfolderview?id=${id}#grid`;
  return `https://drive.google.com/file/d/${id}/preview`;
};
const fileKind = (mime = '') =>
  mime.startsWith('image/') ? 'image' : (mime === 'application/pdf' ? 'pdf' : 'other');

// --- מצגות מקומיות (PDF) המוטמעות ישירות מתוך האתר (public/decks) — המצגת עצמה, לא לינק ---
const DECK = (file, title) => ({ kind: 'pdf', src: `${import.meta.env.BASE_URL}decks/${file}`, title });
const IMG = (file, title) => ({ kind: 'image', src: `${import.meta.env.BASE_URL}decks/${file}`, title });
// תיקיית הפרויקט בדרייב + יעד הגשה (זמני — להחליף בטופס/תיקיית הגשה ייעודית)
const DRIVE_FOLDER = 'https://drive.google.com/drive/folders/1hJkd1kZHuDRVsauHBMWgFMxf68jhhg1N';
const SUBMIT_URL = DRIVE_FOLDER;

// --- IndexedDB: persist user-uploaded files (images / PDFs) across reloads ---
const IDB_NAME = 'bioapps-uploads';
const IDB_STORE = 'files';
function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbAll() {
  try {
    const db = await openIDB();
    return await new Promise((resolve) => {
      const req = db.transaction(IDB_STORE).objectStore(IDB_STORE).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch { return []; }
}
async function idbPut(rec) {
  const db = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(rec);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function idbDelete(id) {
  const db = await openIDB();
  return new Promise((resolve) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
}

// --- מדד תלוי משותף לכל הניסויים: פעימות + ביטוי הגן HSP70 ---
const DEP_VAR = "קצב פעימות הפוליפ, וכן ביטוי הגן HSP70 (חלבון עקה — סמן ביולוגי; טרם נמדד בשלב זה)";
const HSP70_NOTE = "ביטוי הגן HSP70 (חלבון עקה) טרם נמדד/נותח בשלב זה, ולכן עדיין אי אפשר לקבוע את הקשר בין התגובה הפיזיולוגית הנצפית לבין ביטוי הגן.";

// =====================================================================
//  DATA — תחנות פרויקט החקר ביישומים בביוטכנולוגיה
//  נושא: קסניה פועמת כביו-אינדיקטור — השפעת עקות סביבתיות על שונית האלמוגים
//  מבוסס על תיקיית הקורס בדרייב (מחזור תשפ"ז). הדאטה בגרפים = תוצאות אמיתיות
//  מגיליונות הניסוי (טמפרטורה / אוקסיבנזון / חומציות). שאר הניסויים — בעיבוד.
// =====================================================================
const stationsData = [
  // 1 — סקירת ספרות -------------------------------------------------
  {
    id: 1, type: 'writing',
    title: "סקירת ספרות",
    subtitle: "איתור והערכה של מקורות מדעיים",
    pillar: "כתיבה מדעית",
    icon: <BookOpen />,
    textAccent: "text-purple-400", borderAccent: "border-purple-500/40", color: "from-purple-500 to-pink-500",
    metrics: [{ label: "שלב במחקר", value: "1 · פתיחה" }, { label: "תוצר", value: "מאגר מקורות" }],
    intro: "סקירת הספרות היא השלב הראשון בעבודת חקר: איתור, קריאה והערכה ביקורתית של מקורות מדעיים אמינים (מאמרים, מאגרי מידע, אתרי מחקר וכתבי-עת) כדי לבסס את הרקע המדעי ולמקד את שאלת המחקר. בפרויקט זה אספו הקבוצות מקורות בנושא אלמוגים, הלבנת אלמוגים, קסניה פועמת והשפעת עקות סביבתיות על שונית האלמוגים.",
    steps: [
      "הגדרת הנושא ומילות-מפתח לחיפוש (אלמוגים, הלבנה, קסניה, עקה סביבתית).",
      "חיפוש במקורות אמינים: NOAA, Nature, כתבי-עת מדעיים, ויקיפדיה מדעית ואתרי מחקר.",
      "קריאה וסינון לפי רלוונטיות ואמינות, והבחנה בין מקור ראשוני למשני.",
      "רישום ביבליוגרפי וציטוט מסודר של כל מקור.",
      "ארגון המידע לפי נושאים — בסיס לכתיבת המבוא."
    ],
    keyPoints: [
      "להעדיף מקורות ראשוניים וכותבים מומחים.",
      "לבדוק תאריך פרסום, מחבר וגוף מפרסם.",
      "לצטט כל מקור — להימנע מהעתקה.",
      "להבחין בין עובדה, פרשנות ודעה."
    ],
    buttons: [
      { label: "מקורות מדעיים (עברית)", icon: <FileText className="w-6 h-6" />, color: "blue",
        items: [{ kind: 'drive', src: "https://drive.google.com/file/d/1dPx5AS24hKwPcvubBhs3aN24FViA_D1U/view", title: "מאמרים ומקורות מידע על האלמוגים (עברית)" }] },
      { label: "תיקיית מאמרי הקבוצות", icon: <BookOpen className="w-6 h-6" />, color: "emerald",
        items: [{ kind: 'drive', src: "https://drive.google.com/drive/folders/1-st1lq2mJECk43SDHXqRwzYzrSu7P4Z7", title: "סקירת ספרות — מאמרי הקבוצות" }] },
      { label: "תכנית הלימודים — יישומים", icon: <ListChecks className="w-6 h-6" />, color: "blue",
        items: [DECK('curriculum-plan.pdf', 'תכנית הלימודים — יישומים בביוטכנולוגיה')] },
    ],
  },
  // 2 — כתיבת מבוא --------------------------------------------------
  {
    id: 2, type: 'writing',
    title: "כתיבת מבוא",
    subtitle: "בניית הרקע המדעי אל שאלת המחקר",
    pillar: "כתיבה מדעית",
    icon: <FileText />,
    textAccent: "text-cyan-400", borderAccent: "border-cyan-500/40", color: "from-blue-500 to-cyan-400",
    metrics: [{ label: "שלב במחקר", value: "2 · רקע" }, { label: "מבנה", value: "משפך" }],
    intro: "המבוא בונה את הרקע המדעי המוביל אל שאלת המחקר וההשערה. הוא נכתב כ\"משפך\": מהכללי (מהם אלמוגים, מבנה הפוליפ, סימביוזה עם אצות, שונית) אל הספציפי (עקה והלבנה, קסניה כביו-אינדיקטור, המזהם הנבדק) ועד מטרות המחקר. כל טענה מגובה במקור מסקירת הספרות.",
    steps: [
      "מהם אלמוגים — והקשר לביוטכנולוגיה.",
      "הפוליפ: מבנה ודרך יצירת המושבה (הנצה).",
      "סוגי אלמוגים, השונית וחשיבותה האקולוגית.",
      "ההולוביונט והסימביוזה עם אצות הזואוקסנטלות.",
      "עקה והלבנת אלמוגים; חלבוני עקה (HSP70) כסמן ביולוגי.",
      "קסניה פועמת כביו-אינדיקטור והמזהם הנבדק → מטרות המחקר."
    ],
    keyPoints: [
      "מהכללי אל הפרטי — מבנה משפך.",
      "כל פסקה מובילה אל שאלת המחקר.",
      "שילוב איורים (מבנה הפוליפ, סימביוזה).",
      "ציטוט מקור לכל טענה מדעית."
    ],
    researchQuestion: "כיצד עקות סביבתיות שונות — טמפרטורה, אוקסיבנזון (קרם הגנה), החמצה (pH), נחושת, אמוניה ומליחות — משפיעות על קצב הפעימות של הקסניה הפועמת ועל ביטוי הגן HSP70? כל קבוצה התמקדה בגורם עקה אחד. המבואות המלאים שכתבו הקבוצות (כולל שאלות המחקר וההשערות שלהן) מקושרים בכפתורי החומרים.",
    hsp70: "HSP70 (Heat Shock Protein 70) הוא חלבון עקה ממשפחת ה-chaperones, המסייע לקיפול תקין של חלבונים ולהגנה עליהם בתנאי עקה. עלייה בביטוי הגן HSP70 משמשת כסמן מולקולרי לעקה תאית — ולכן הוא המדד התלוי השני במחקר (לצד קצב הפעימות).",
    buttons: [
      { label: "איך כותבים מבוא (+ משפך הכתיבה)", icon: <FileText className="w-6 h-6" />, color: "blue",
        items: [DECK('how-to-write-intro.pdf', 'איך כותבים מבוא'), DECK('intro-funnel.pdf', 'משפך כתיבת המבוא')] },
      { label: "עבודה בקבוצות", icon: <ListChecks className="w-6 h-6" />, color: "emerald",
        items: [DECK('group-work.pdf', 'עבודה בקבוצות — חיפוש חומרים וכתיבה')] },
      { label: "ראשי הפרקים למבוא (Drive)", icon: <ListChecks className="w-6 h-6" />, color: "blue",
        items: [{ kind: 'drive', src: "https://docs.google.com/document/d/1ZFrbs3SYCPla30cDWBAYDsNqYo0BTtthYZRssWMZloU/view", title: "מבוא — ראשי פרקים" }] },
      { label: "מבואות הקבוצות — מה שכתבו", icon: <FileText className="w-6 h-6" />, color: "emerald",
        items: [
          { kind: 'drive', src: "https://docs.google.com/document/d/1YTDcxPy4yLkel3TcnjRqUrTp2NBN_gPAE7bHSpn6tMw/view", title: "מבוא — הדר, תומי, טל" },
          { kind: 'drive', src: "https://docs.google.com/document/d/1dSWXD4KH0z2pdLtZLbRe1ieFOowRcSbNPMFIRiZ2Dw8/view", title: "מבוא — ליה, עידו, נדב" },
          { kind: 'drive', src: "https://docs.google.com/document/d/1G4WFltRMgwSs3iwbyNpKoZMpGsDA3OkFnYa9Ffoc9-E/view", title: "מבוא — נויה, עמרי, יונתן" },
        ] },
    ],
  },
  // 3 — רקע מדעי: מסע מן הפוליפ אל השונית ----------------------------
  {
    id: 3, type: 'background',
    title: "מסע מן הפוליפ אל השונית",
    subtitle: "הרקע המדעי — מבנה, סימביוזה ועקה",
    pillar: "רקע מדעי",
    icon: <Fingerprint />,
    textAccent: "text-teal-400", borderAccent: "border-teal-500/40", color: "from-teal-400 to-emerald-500",
    metrics: [{ label: "היחידה", value: "פוליפ" }, { label: "המערכת", value: "שונית" }],
    intro: "מסע מהיחידה הבסיסית — הפוליפ — אל המבנה המורכב של שונית האלמוגים. הפוליפ הוא יצור גלילי בעל פתח-פה מוקף זרועות-ציד ותאים צורבים, המפריש שלד גירני ובונה מושבה בעזרת הנצה. רוב האלמוגים חיים בסימביוזה עם אצות זואוקסנטלות המספקות עד 90% מהאנרגיה בפוטוסינתזה. עקת חום או החמצה משבשת את הסימביוזה וגורמת להלבנה. הקסניה הפועמת היא אלמוג רך ש\"פועם\" — תנועת זרועות מחזורית הרגישה לתנאי הסביבה — ולכן משמשת כביו-אינדיקטור חי לעקה.",
    steps: [
      "פוליפ — מבנה ותפקוד (פה, זרועות, תאים צורבים, שלד גירני).",
      "סימביוזה עם זואוקסנטלות — מקור האנרגיה והצבע.",
      "מושבה ושונית — בנייה דרך הנצה לאורך שנים.",
      "עקה והלבנה — קריסת הסימביוזה תחת חום/החמצה.",
      "קסניה פועמת — הפעימה כחיישן רגיש לסביבה."
    ],
    keyPoints: [
      "שוניות = ~1% מהאוקיינוס, רבע מהמינים הימיים.",
      "סימביוזה: אצה מספקת אנרגיה, אלמוג מספק מחסה.",
      "הלבנה = פליטת האצות עקב עקה.",
      "קסניה פועמת = ביו-אינדיקטור לאיכות המים."
    ],
    buttons: [
      { label: "מצגת: מסע מן הפוליפ אל השונית", icon: <FileText className="w-6 h-6" />, color: "blue",
        items: [DECK('journey-to-reef.pdf', 'מסע מן הפוליפ אל השונית')] },
      { label: "אינפוגרפיקה: שומרי סף האוקיינוס", icon: <ImageIcon className="w-6 h-6" />, color: "emerald",
        items: [IMG('coral-infographic.png', 'עולם האלמוגים — שומרי סף האוקיינוס')] },
      { label: "הלבנת אלמוגים + יערות הים החיים", icon: <FileText className="w-6 h-6" />, color: "blue",
        items: [DECK('bleaching-eilat.pdf', 'הלבנת אלמוגים — אילת'), DECK('coral-living-forests.pdf', 'אלמוגים — יערות הים החיים')] },
    ],
  },
  // 4 — שיטות מחקר --------------------------------------------------
  {
    id: 4, type: 'writing',
    title: "שיטות מחקר",
    subtitle: "תיאור מערך הניסוי לשחזור",
    pillar: "כתיבה מדעית",
    icon: <ListChecks />,
    textAccent: "text-emerald-400", borderAccent: "border-emerald-500/40", color: "from-emerald-400 to-green-500",
    metrics: [{ label: "שלב במחקר", value: "3 · שיטות" }, { label: "עיקרון", value: "שחזוריות" }],
    intro: "פרק השיטות מתאר במדויק כיצד בוצע המחקר, כך שכל קורא יוכל לשחזר אותו. הוא כולל את מערכת הניסוי, המשתנים, הטיפולים, מספר החזרות, שיטת המדידה והתנאים הקבועים. בפרויקט זה — מערכת של פוליפי קסניה פועמת, חשיפה לגורם עקה, וספירת פעימות מתוך תיעוד וידאו.",
    steps: [
      "תיאור מערכת הניסוי (אקווריום עם פוליפי קסניה).",
      "הגדרת המשתנים: בלתי-תלוי, תלוי, קבועים וקבוצת ביקורת.",
      "תיאור הטיפולים והריכוזים שנבדקו.",
      "מספר החזרות לכל טיפול (9 פוליפים).",
      "שיטת המדידה: ספירת פעימות מתוך וידאו לאורך זמן קבוע.",
      "תנאים קבועים ובקרת איכות; הבחנה בין המתוכנן למבוצע בפועל."
    ],
    keyPoints: [
      "כתיבה בלשון עבר וסביל (\"נמדד\", \"נחשפו\").",
      "מספיק פירוט כדי לשחזר את הניסוי.",
      "להבחין בין מה שתוכנן למה שבוצע בפועל.",
      "לציין את מגבלות השיטה."
    ],
    buttons: [
      { label: "מצגת: התלמיד כחוקר", icon: <FileText className="w-6 h-6" />, color: "blue",
        items: [DECK('student-as-researcher.pdf', 'התלמיד כחוקר — סוגי מחקר, שלבים ומבנה המחקר המדעי')] },
      { label: "שלבי המחקר + האנטומיה של מחקר מדעי", icon: <ListChecks className="w-6 h-6" />, color: "emerald",
        items: [DECK('research-stages.pdf', 'שלבי המחקר המדעי'), DECK('research-anatomy.pdf', 'האנטומיה של מחקר מדעי')] },
    ],
  },
  // 5 — ניסוי מקדים -------------------------------------------------
  {
    id: 5, type: 'media',
    title: "ניסוי מקדים",
    subtitle: "כיול שיטת המדידה (Pilot)",
    pillar: "ניסוי",
    icon: <TestTube2 />,
    textAccent: "text-lime-400", borderAccent: "border-lime-500/40", color: "from-lime-400 to-green-500",
    metrics: [{ label: "מטרה", value: "כיול שיטה" }, { label: "תיעוד", value: "וידאו + תמונות" }],
    intro: "הניסוי המקדים (pilot) נועד לכייל את שיטת המדידה לפני הניסוי המרכזי: לוודא שניתן לספור פעימות באופן עקבי, לבחור טווחי מינון/טמפרטורה מתאימים, ולזהות בעיות בשיטה. נבדקו פוליפי ביקורת מול גורמי-עקה ראשוניים (נחושת, אמוניה, חומציות, מליחות), והתגובה תועדה בוידאו ובתמונות לצורך ספירה חוזרת ומדויקת.",
    steps: [
      "הצבת פוליפי קסניה בתנאי ביקורת ותיעוד קצב פעימות בסיסי.",
      "חשיפה לגורם עקה בודד (למשל נחושת / אמוניה / חומצה / מלח).",
      "צילום וידאו של הפוליפים לכל טיפול.",
      "ספירת פעימות חוזרת מתוך הוידאו (דיוק וחזרתיות).",
      "הסקת מסקנות לכיול טווחי הטיפול בניסוי המרכזי."
    ],
    keyPoints: [
      "Pilot = בודקים את השיטה, לא מסיקים מסקנות סופיות.",
      "וידאו מאפשר ספירה חוזרת ומדויקת.",
      "מזהים טווח מינון שמראה הבדל מדיד.",
      "מגדירים תנאים קבועים לניסוי המרכזי."
    ],
    buttons: [
      { label: "סרטוני הניסוי המקדים", icon: <Images className="w-6 h-6" />, color: "blue",
        items: [
          { kind: 'drive', src: "https://drive.google.com/file/d/1blZvmkt8TfyOVRqsfj769KYqDlaYZkWL/view", title: "וידאו פעימות חומציות — מקדים" },
          { kind: 'drive', src: "https://drive.google.com/file/d/1O55Sr955IpyVppnrJuwS7txXGuzMUIK-/view", title: "וידאו פעימות נחושת — מקדים" },
          { kind: 'drive', src: "https://drive.google.com/file/d/1-pAuyL31Dyemvlx3tlgP0vUcNiKaTGnb/view", title: "אמוניה — ניסוי מקדים" },
        ] },
      { label: "תיקיית הסרטונים והתמונות", icon: <ExternalLink className="w-6 h-6" />, color: "emerald",
        items: [{ kind: 'drive', src: "https://drive.google.com/drive/folders/1SICAqBZ6An4Qo36CV6L-UPS8H3ez20Rz", title: "ניסוי מקדים — סרטונים ותמונות" }] },
    ],
  },
  // 6 — ניסוי: טמפרטורה (דאטה אמיתית) -------------------------------
  {
    id: 6, type: 'experiment',
    title: "ניסוי: השפעת טמפרטורה",
    subtitle: "עקת חום, פעימות ו-HSP70",
    pillar: "ניסוי + תוצאות",
    icon: <Thermometer />,
    textAccent: "text-orange-400", borderAccent: "border-orange-500/40", color: "from-orange-400 to-red-500",
    metrics: [{ label: "משתנה ב\"ת", value: "טמפרטורה" }, { label: "משתנה תלוי", value: "פעימות + HSP70" }],
    researchQuestion: "כיצד עליית טמפרטורת המים משפיעה על קצב הפעימות של פוליפי הקסניה הפועמת ועל ביטוי הגן HSP70?",
    hypothesis: "ככל שטמפרטורת המים תעלה, קצב הפעימות ירד — עקת חום משבשת את התהליכים המטבוליים ואת הסימביוזה עם האצות. במקביל צפוי שביטוי הגן HSP70 (חלבון עקה) יעלה, כמנגנון הגנה תאי בתגובה לחום.",
    variables: { indep: "טמפרטורת המים (ביקורת, 25°C, 27°C, 29°C)", dep: DEP_VAR, control: "פוליפים בטמפרטורת אקווריום רגילה", constants: "אותם פוליפים, אותו זמן מדידה, אותה תאורה ומליחות" },
    materials: ["אקווריום ימי עם פוליפי קסניה פועמת", "מד טמפרטורה ומקור חימום מבוקר", "מצלמה/מיקרוסקופ לתיעוד וידאו", "סטופר לספירת פעימות", "9 פוליפים לכל טיפול (חזרות)"],
    procedure: [
      "מדידת קצב פעימות בסיסי בתנאי ביקורת (9 פוליפים).",
      "העלאת הטמפרטורה בהדרגה לערכי היעד (25, 27, 29°C).",
      "המתנה לייצוב טמפרטורה לפני המדידה.",
      "ספירת פעימות לכל פוליפ לאורך זמן קבוע, לכל טמפרטורה.",
      "חישוב ממוצע, סטיית-תקן וטעות-תקן והשוואה לביקורת.",
      "(בהמשך) דגימת RNA ומדידת ביטוי הגן HSP70."
    ],
    tableHeaders: ["טמפרטורה", "קצב פעימות ממוצע"],
    chartType: "bar",
    graphTitle: "קצב פעימות הקסניה כתלות בטמפרטורה",
    xAxis: "טמפרטורת המים", yAxis: "קצב פעימות ממוצע",
    chartData: [{ x: "ביקורת", y: 20.67 }, { x: "25°C", y: 15.0 }, { x: "27°C", y: 12.0 }, { x: "29°C", y: 9.2 }],
    conclusion: "ככל שהטמפרטורה עלתה, קצב הפעימות ירד באופן עקבי (מ-~20.7 בביקורת ל-~9.2 ב-29°C). התוצאות מצביעות על כך שעקת חום פוגעת בפעילות הפיזיולוגית של הקסניה — בהתאם להשערה. " + HSP70_NOTE,
    buttons: [
      { label: "גיליון תוצאות — טמפרטורה", icon: <TableProperties className="w-6 h-6" />, color: "blue",
        items: [{ kind: 'drive', src: "https://docs.google.com/spreadsheets/d/1_8wXuZSnKyto6FUtuUjAsqTTjDr80Fp0e8AoSUFCQb8/view", title: "טבלאות ספירת פוליפים — טמפרטורה" }] },
    ],
  },
  // 7 — ניסוי: אוקסיבנזון (דאטה אמיתית) -----------------------------
  {
    id: 7, type: 'experiment',
    title: "ניסוי: השפעת אוקסיבנזון",
    subtitle: "מזהם קרם-הגנה, פעימות ו-HSP70",
    pillar: "ניסוי + תוצאות",
    icon: <Droplets />,
    textAccent: "text-blue-400", borderAccent: "border-blue-500/40", color: "from-blue-500 to-indigo-500",
    metrics: [{ label: "משתנה ב\"ת", value: "ריכוז אוקסיבנזון" }, { label: "משתנה תלוי", value: "פעימות + HSP70" }],
    researchQuestion: "כיצד חשיפה לריכוזים עולים של אוקסיבנזון (החומר הפעיל בקרמי הגנה, מזהם ימי) משפיעה על קצב הפעימות של הקסניה ועל ביטוי הגן HSP70?",
    hypothesis: "חשיפה לריכוז גבוה של אוקסיבנזון תפגע בפעילות הקסניה ותוריד את קצב הפעימות — אוקסיבנזון ידוע כרעיל לאלמוגים (פוגע בהתפתחות, ברבייה ובסימביוזה). במקביל צפוי שביטוי הגן HSP70 יעלה כתגובת עקה.",
    variables: { indep: "ריכוז אוקסיבנזון במים (ביקורת 0, 25, 50, 75 µg/L)", dep: DEP_VAR, control: "מי ים ללא אוקסיבנזון", constants: "אותם פוליפים, נפח מים זהה, טמפרטורה וזמן מדידה זהים" },
    materials: ["אקווריום ימי עם פוליפי קסניה פועמת", "תמיסת אוקסיבנזון (Oxybenzone / BP-3)", "מיקרופיפטה למינון מדויק", "מצלמה לתיעוד וידאו", "9 פוליפים לכל טיפול (חזרות)"],
    procedure: [
      "מדידת קצב פעימות בסיסי בביקורת (ללא אוקסיבנזון).",
      "חשיפה לריכוזים עולים של אוקסיבנזון (25, 50, 75 µg/L).",
      "ערבוב עדין והמתנה לפיזור אחיד.",
      "ספירת פעימות לכל פוליפ לכל ריכוז, לאורך זמן קבוע.",
      "חישוב ממוצע, סטיית-תקן וטעות-תקן והשוואה לביקורת.",
      "(בהמשך) דגימת RNA ומדידת ביטוי הגן HSP70."
    ],
    tableHeaders: ["ריכוז אוקסיבנזון", "קצב פעימות ממוצע"],
    chartType: "bar",
    graphTitle: "קצב פעימות הקסניה כתלות בריכוז האוקסיבנזון",
    xAxis: "ריכוז אוקסיבנזון (µg/L)", yAxis: "קצב פעימות ממוצע",
    chartData: [{ x: "ביקורת", y: 20.83 }, { x: "25 µg/L", y: 23.17 }, { x: "50 µg/L", y: 23.61 }, { x: "75 µg/L", y: 17.56 }],
    conclusion: "במינון נמוך-בינוני (25–50 µg/L) נצפתה עלייה קלה בקצב הפעימות — ייתכן תגובת גירוי/עקה ראשונית. במינון הגבוה (75 µg/L) חלה ירידה חדה, המצביעה על פגיעה בפעילות עקב ריכוז גבוה של המזהם. נדרשת בדיקת מובהקות (טעות-תקן) לחיזוק המסקנה. " + HSP70_NOTE,
    note: "יחידות הריכוז (µg/L) הן הצורה המקובלת בספרות לרעילות אוקסיבנזון לאלמוגים; ערכי הריכוז מבוססים על רמות הטיפול בניסוי.",
    buttons: [
      { label: "מצגת: השפעת אוקסיבזון על קסניה", icon: <FileText className="w-6 h-6" />, color: "blue",
        items: [DECK('oxybenzone-xenia.pdf', 'השפעת אוקסיבזון על קסניה')] },
      { label: "גיליון תוצאות — אוקסיבנזון", icon: <TableProperties className="w-6 h-6" />, color: "emerald",
        items: [{ kind: 'drive', src: "https://drive.google.com/file/d/1VES75TIvyvE96sxtP0Sb7G1ibUb8m7nU/view", title: "פעימות פוליפים — אוקסיבנזון (קרם הגנה)" }] },
    ],
  },
  // 8 — ניסוי: חומציות (דאטה אמיתית) --------------------------------
  {
    id: 8, type: 'experiment',
    title: "ניסוי: השפעת חומציות (pH)",
    subtitle: "החמצת הים, פעימות ו-HSP70",
    pillar: "ניסוי + תוצאות",
    icon: <Beaker />,
    textAccent: "text-pink-400", borderAccent: "border-pink-500/40", color: "from-pink-500 to-rose-600",
    metrics: [{ label: "משתנה ב\"ת", value: "רמת pH" }, { label: "משתנה תלוי", value: "פעימות + HSP70" }],
    researchQuestion: "כיצד החמצת מי הים (ירידת pH) משפיעה על קצב הפעימות של הקסניה הפועמת ועל ביטוי הגן HSP70?",
    hypothesis: "ככל שה-pH יירד (סביבה חומצית יותר), קצב הפעימות ירד — החמצה משבשת את חילוף החומרים והשקעת השלד, בדומה להחמצת האוקיינוסים. במקביל צפוי שביטוי הגן HSP70 יעלה כתגובת עקה.",
    variables: { indep: "רמת ה-pH (8.15 ביקורת → 7.78 בעזרת טיפות חומצה)", dep: DEP_VAR, control: "מי ים ב-pH טבעי (8.15)", constants: "אותם פוליפים, טמפרטורה, נפח וזמן מדידה זהים" },
    materials: ["אקווריום ימי עם פוליפי קסניה פועמת", "מד pH", "תמיסת חומצה (טפטוף מבוקר)", "מצלמה לתיעוד וידאו", "9 פוליפים לכל טיפול (חזרות)"],
    procedure: [
      "מדידת קצב פעימות וה-pH בתנאי ביקורת (8.15).",
      "הורדת ה-pH בטפטוף הדרגתי (8.06 → 7.96 → 7.78).",
      "ייצוב ה-pH ומדידתו לפני כל ספירה.",
      "ספירת פעימות לכל פוליפ בכל רמת pH, לאורך זמן קבוע.",
      "חישוב ממוצע, סטיית-תקן וטעות-תקן והשוואה לביקורת.",
      "(בהמשך) דגימת RNA ומדידת ביטוי הגן HSP70."
    ],
    tableHeaders: ["רמת pH", "קצב פעימות ממוצע"],
    chartType: "bar",
    graphTitle: "קצב פעימות הקסניה כתלות ברמת ה-pH",
    xAxis: "רמת pH (טיפות חומצה)", yAxis: "קצב פעימות ממוצע",
    chartData: [{ x: "8.15 (ביקורת)", y: 21.22 }, { x: "8.06", y: 20.78 }, { x: "7.96", y: 19.0 }, { x: "7.78", y: 14.22 }],
    conclusion: "ככל שה-pH ירד, קצב הפעימות ירד — ירידה מתונה עד pH 7.96, וירידה חדה ב-pH 7.78. התוצאות מצביעות על כך שהחמצת המים פוגעת בפעילות הקסניה, בהתאם להשערה ובדומה להחמצת האוקיינוסים. " + HSP70_NOTE,
    buttons: [
      { label: "גיליון תוצאות — חומציות", icon: <TableProperties className="w-6 h-6" />, color: "blue",
        items: [{ kind: 'drive', src: "https://docs.google.com/spreadsheets/d/1P421PobDQpgk4ese7bi2osAUcyoi-eZPS9BdOkwiR-4/view", title: "פעימות פוליפים — חומציות" }] },
    ],
  },
  // 9 — ניסוי: נחושת (בעיבוד) ---------------------------------------
  {
    id: 9, type: 'experiment',
    title: "ניסוי: השפעת נחושת",
    subtitle: "מתכת כבדה, פעימות ו-HSP70",
    pillar: "ניסוי + תוצאות",
    icon: <Zap />,
    textAccent: "text-amber-400", borderAccent: "border-amber-500/40", color: "from-amber-400 to-orange-500",
    metrics: [{ label: "משתנה ב\"ת", value: "ריכוז נחושת" }, { label: "משתנה תלוי", value: "פעימות + HSP70" }],
    researchQuestion: "כיצד חשיפה לריכוזים עולים של יוני נחושת (Cu²⁺, מתכת כבדה מזהמת) משפיעה על קצב הפעימות של הקסניה ועל ביטוי הגן HSP70?",
    hypothesis: "חשיפה לנחושת תוריד את קצב הפעימות — מתכות כבדות רעילות לאורגניזמים ימיים ופוגעות באנזימים ובממברנות. במקביל צפוי שביטוי הגן HSP70 יעלה כתגובת עקה.",
    variables: { indep: "ריכוז יוני נחושת (Cu²⁺) במים (ביקורת + ריכוזים עולים)", dep: DEP_VAR, control: "מי ים ללא תוספת נחושת", constants: "אותם פוליפים, טמפרטורה, מליחות, נפח וזמן מדידה זהים" },
    materials: ["אקווריום ימי עם פוליפי קסניה פועמת", "תמיסת נחושת (CuSO₄)", "מיקרופיפטה למינון מדויק", "מצלמה לתיעוד וידאו", "9 פוליפים לכל טיפול (חזרות)"],
    procedure: [
      "מדידת קצב פעימות בסיסי בביקורת (ללא נחושת).",
      "חשיפה לריכוזים עולים של יוני נחושת.",
      "ערבוב עדין והמתנה לפיזור אחיד.",
      "ספירת פעימות לכל פוליפ לכל ריכוז, לאורך זמן קבוע.",
      "חישוב ממוצע, סטיית-תקן וטעות-תקן והשוואה לביקורת.",
      "(בהמשך) דגימת RNA ומדידת ביטוי הגן HSP70."
    ],
    conclusion: HSP70_NOTE,
    buttons: [
      { label: "תיעוד הניסוי המקדים — נחושת", icon: <Images className="w-6 h-6" />, color: "blue",
        items: [{ kind: 'drive', src: "https://drive.google.com/file/d/1O55Sr955IpyVppnrJuwS7txXGuzMUIK-/view", title: "וידאו פעימות נחושת — מקדים" }] },
    ],
  },
  // 10 — ניסוי: אמוניה (בעיבוד) -------------------------------------
  {
    id: 10, type: 'experiment',
    title: "ניסוי: השפעת אמוניה",
    subtitle: "זיהום חנקני, פעימות ו-HSP70",
    pillar: "ניסוי + תוצאות",
    icon: <Microscope />,
    textAccent: "text-rose-400", borderAccent: "border-rose-500/40", color: "from-rose-400 to-pink-600",
    metrics: [{ label: "משתנה ב\"ת", value: "ריכוז אמוניה" }, { label: "משתנה תלוי", value: "פעימות + HSP70" }],
    researchQuestion: "כיצד חשיפה לריכוזים עולים של אמוניה (זיהום חנקני נפוץ במים) משפיעה על קצב הפעימות של הקסניה ועל ביטוי הגן HSP70?",
    hypothesis: "חשיפה לאמוניה תוריד את קצב הפעימות — אמוניה רעילה לאורגניזמים ימיים ומשבשת תהליכים תאיים. במקביל צפוי שביטוי הגן HSP70 יעלה כתגובת עקה.",
    variables: { indep: "ריכוז אמוניה במים (ביקורת + ריכוזים עולים)", dep: DEP_VAR, control: "מי ים ללא תוספת אמוניה", constants: "אותם פוליפים, טמפרטורה, מליחות, נפח וזמן מדידה זהים" },
    materials: ["אקווריום ימי עם פוליפי קסניה פועמת", "תמיסת אמוניה", "מיקרופיפטה למינון מדויק", "מצלמה לתיעוד וידאו", "9 פוליפים לכל טיפול (חזרות)"],
    procedure: [
      "מדידת קצב פעימות בסיסי בביקורת (ללא אמוניה).",
      "חשיפה לריכוזים עולים של אמוניה.",
      "ערבוב עדין והמתנה לפיזור אחיד.",
      "ספירת פעימות לכל פוליפ לכל ריכוז, לאורך זמן קבוע.",
      "חישוב ממוצע, סטיית-תקן וטעות-תקן והשוואה לביקורת.",
      "(בהמשך) דגימת RNA ומדידת ביטוי הגן HSP70."
    ],
    conclusion: HSP70_NOTE,
    buttons: [
      { label: "עבודת חקר: השפעת אמוניה", icon: <FileText className="w-6 h-6" />, color: "blue",
        items: [DECK('ammonia-research.pdf', 'עבודת חקר — השפעת אמוניה על התגובה ההתנהגותית')] },
      { label: "תיעוד הניסוי המקדים — אמוניה", icon: <Images className="w-6 h-6" />, color: "emerald",
        items: [{ kind: 'drive', src: "https://drive.google.com/file/d/1-pAuyL31Dyemvlx3tlgP0vUcNiKaTGnb/view", title: "אמוניה — ניסוי מקדים" }] },
    ],
  },
  // 11 — ניסוי: מליחות (בעיבוד) -------------------------------------
  {
    id: 11, type: 'experiment',
    title: "ניסוי: השפעת מליחות",
    subtitle: "עקה אוסמוטית, פעימות ו-HSP70",
    pillar: "ניסוי + תוצאות",
    icon: <Activity />,
    textAccent: "text-teal-400", borderAccent: "border-teal-500/40", color: "from-teal-400 to-cyan-500",
    metrics: [{ label: "משתנה ב\"ת", value: "רמת מליחות" }, { label: "משתנה תלוי", value: "פעימות + HSP70" }],
    researchQuestion: "כיצד שינוי במליחות מי הים משפיע על קצב הפעימות של הקסניה הפועמת ועל ביטוי הגן HSP70?",
    hypothesis: "סטייה ממליחות האופטימום (גבוהה או נמוכה מדי) תוריד את קצב הפעימות — שינוי מליחות גורם לעקה אוסמוטית הפוגעת באיזון המים והמלחים בתא. במקביל צפוי שביטוי הגן HSP70 יעלה כתגובת עקה.",
    variables: { indep: "רמת המליחות של המים (ביקורת ~מליחות ים רגילה + ערכים שונים)", dep: DEP_VAR, control: "מי ים במליחות טבעית", constants: "אותם פוליפים, טמפרטורה, נפח וזמן מדידה זהים" },
    materials: ["אקווריום ימי עם פוליפי קסניה פועמת", "מלח ים / מים מזוקקים לשינוי מליחות", "רפרקטומטר / מד מוליכות", "מצלמה לתיעוד וידאו", "9 פוליפים לכל טיפול (חזרות)"],
    procedure: [
      "מדידת קצב פעימות בסיסי במליחות הביקורת.",
      "שינוי המליחות לערכי היעד (הגברה/הקטנה).",
      "ייצוב ומדידת המליחות לפני כל ספירה.",
      "ספירת פעימות לכל פוליפ לכל רמת מליחות, לאורך זמן קבוע.",
      "חישוב ממוצע, סטיית-תקן וטעות-תקן והשוואה לביקורת.",
      "(בהמשך) דגימת RNA ומדידת ביטוי הגן HSP70."
    ],
    conclusion: HSP70_NOTE,
    buttons: [
      { label: "תיעוד הניסוי המקדים — מליחות", icon: <Images className="w-6 h-6" />, color: "blue",
        items: [{ kind: 'drive', src: "https://drive.google.com/file/d/1-fKYIWcz24d_Z_F7bdu79vrz1jR9Ivq6/view", title: "מליחות — שיחזן שכיח (מקדים)" }] },
    ],
  },
  // 12 — תוצאות -----------------------------------------------------
  {
    id: 12, type: 'writing',
    title: "תוצאות",
    subtitle: "הצגת הנתונים — ללא פרשנות",
    pillar: "כתיבה מדעית",
    icon: <LineChart />,
    textAccent: "text-yellow-400", borderAccent: "border-yellow-500/40", color: "from-yellow-500 to-amber-600",
    metrics: [{ label: "שלב במחקר", value: "4 · תוצאות" }, { label: "כלים", value: "טבלה + גרף" }],
    intro: "פרק התוצאות מציג את הנתונים שהתקבלו — ללא פרשנות או הסקת מסקנות. הנתונים מוצגים בטבלאות ובגרפים ברורים, עם תיאור מילולי תמציתי של המגמות בלבד. בפרויקט זה: קצב פעימות הקסניה לכל טיפול, כולל ממוצע, סטיית-תקן וטעות-תקן.",
    steps: [
      "ארגון הנתונים בטבלה: ממוצע, סטיית-תקן וטעות-תקן.",
      "בחירת סוג גרף מתאים (בדיד → עמודות, רציף → פיזור).",
      "כותרת מדויקת, צירים ויחידות מידה.",
      "תיאור המגמה במילים — בלי להסיק מסקנות.",
      "ציון מפורש של תוצאות חלקיות (למשל: HSP70 טרם נמדד)."
    ],
    keyPoints: [
      "רק נתונים — בלי הסקת מסקנות.",
      "גרף עם כותרת, צירים ויחידות.",
      "להציג שונות (טעות-תקן / Error Bars).",
      "לציין במפורש מה עדיין לא נמדד."
    ],
    buttons: [
      { label: "גיליונות התוצאות (כל הניסויים)", icon: <TableProperties className="w-6 h-6" />, color: "blue",
        items: [
          { kind: 'drive', src: "https://docs.google.com/spreadsheets/d/1_8wXuZSnKyto6FUtuUjAsqTTjDr80Fp0e8AoSUFCQb8/view", title: "תוצאות — טמפרטורה" },
          { kind: 'drive', src: "https://drive.google.com/file/d/1VES75TIvyvE96sxtP0Sb7G1ibUb8m7nU/view", title: "תוצאות — אוקסיבנזון" },
          { kind: 'drive', src: "https://docs.google.com/spreadsheets/d/1P421PobDQpgk4ese7bi2osAUcyoi-eZPS9BdOkwiR-4/view", title: "תוצאות — חומציות" },
        ] },
    ],
  },
  // 13 — דיון ומסקנות ----------------------------------------------
  {
    id: 13, type: 'writing',
    title: "דיון ומסקנות",
    subtitle: "פרשנות זהירה וקישור לספרות",
    pillar: "כתיבה מדעית",
    icon: <BrainCircuit />,
    textAccent: "text-purple-400", borderAccent: "border-purple-500/40", color: "from-purple-500 to-indigo-500",
    metrics: [{ label: "שלב במחקר", value: "5 · דיון" }, { label: "עיקרון", value: "זהירות מדעית" }],
    intro: "פרק הדיון מפרש את התוצאות לאור שאלת המחקר וההשערה, מקשר לספרות, ומציין מגבלות וכיווני המשך. כאן מנסחים מסקנות זהירות ומבחינים בבירור בין תוצאה, הסבר ומסקנה. במחקר זה — חשוב לציין שביטוי ה-HSP70 טרם נמדד, ולכן המסקנות לגביו הן השערה בלבד.",
    steps: [
      "חזרה לשאלת המחקר ולהשערה.",
      "האם התוצאות תומכות בהשערה — באופן מלא, חלקי או לא ברור.",
      "הסבר ביולוגי למגמות שנצפו.",
      "קישור לספרות המדעית (מסקירת הספרות).",
      "מגבלות המחקר (מדגם, שונות, HSP70 שטרם נמדד).",
      "הצעות להמשך — כולל מדידת ביטוי HSP70."
    ],
    keyPoints: [
      "ניסוח זהיר: \"מצביע על\", \"ייתכן\", לא \"הוכחנו\".",
      "לקשר את התוצאות לרקע המדעי.",
      "להודות במגבלות המחקר.",
      "להבחין בין תוצאה, הסבר ומסקנה."
    ],
    buttons: [],
  },
  // 14 — הצגת המחקר -------------------------------------------------
  {
    id: 14, type: 'writing',
    title: "הצגת המחקר",
    subtitle: "תקשורת מדעית ומצגות קבוצתיות",
    pillar: "כתיבה מדעית",
    icon: <ClipboardList />,
    textAccent: "text-cyan-400", borderAccent: "border-cyan-500/40", color: "from-cyan-500 to-blue-600",
    metrics: [{ label: "שלב במחקר", value: "סיכום" }, { label: "משך", value: "7–10 דק'" }],
    intro: "השלב המסכם — תקשורת מדעית. כל קבוצה מציגה את המחקר: רקע מדעי, שאלה והשערה, מהלך ושיטות, תוצאות חלקיות ומסקנות-ביניים. הדגש הוא על ניסוח מדעי זהיר (\"התוצאות מצביעות על...\" ולא \"הוכחנו\") ועל הבחנה בין תוצאה, הסבר ומסקנה. ההערכה כוללת מחוון מורה והערכת עמיתים.",
    steps: [
      "כותרת המחקר ושמות חברי הקבוצה.",
      "רקע מדעי תמציתי (תרשים/תמונה, לא טקסט עמוס).",
      "שאלת מחקר, השערה ומשתנים.",
      "מהלך הניסוי והשיטות (כולל ביקורת וחזרות).",
      "תוצאות חלקיות — גרף/טבלה עם צירים, יחידות וכותרת.",
      "דיון, מסקנות-ביניים ושאלה לקהל."
    ],
    keyPoints: [
      "7–10 דקות + 2–3 דקות שאלות.",
      "שקפים לא עמוסים — מסבירים בעל-פה.",
      "להבחין: תוצאה / הסבר / מסקנה.",
      "ניסוח זהיר: \"ייתכן ש...\", לא \"הוכחנו\"."
    ],
    buttons: [
      { label: "מחוון עבודת הגמר + מדריך לתלמיד", icon: <FileText className="w-6 h-6" />, color: "blue",
        items: [DECK('final-project-rubric.pdf', 'מחוון להערכת עבודת גמר מחקרית'), DECK('students-guide.pdf', "Student's Guide — BioTech")] },
      { label: "מצגת ומשימת ההצגה + הערכת עמיתים", icon: <ClipboardList className="w-6 h-6" />, color: "emerald",
        items: [
          DECK('presentation-task.pdf', 'משימת הצגת המחקר'),
          { kind: 'drive', src: "https://docs.google.com/document/d/188B9Qh253l8d7Wq8zGjNLO8YScCCZUL56FEIRpkc40A/view", title: "טופס הערכת עמיתים" },
        ] },
    ],
  },
];

// סדר התצוגה: מסע מן הפוליפ אל השונית ראשון (ימין), אז סקירת ספרות, אז כתיבת מבוא
const STATION_ORDER = [3, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
const orderedStations = STATION_ORDER.map(id => stationsData.find(s => s.id === id)).filter(Boolean);

// --- רכיב כרטיסיות "כללי הכתיבה המדעית" (פליפ-קארדים) ---
const WritingGuide = () => {
  const cards = [
    { title: "שאלת מחקר", icon: <LineChart className="text-cyan-400" />, content: "שאלה ממוקדת, מדידה ובת-בדיקה. כוללת משתנה בלתי-תלוי ומשתנה תלוי. דוגמה: \"כיצד X משפיע על Y?\"" },
    { title: "השערה מנומקת", icon: <BrainCircuit className="text-purple-400" />, content: "ניחוש מושכל המבוסס על הרקע המדעי: \"אם... אז... משום ש...\". לא ניחוש סתמי, אלא הסבר ביולוגי." },
    { title: "משתנים וביקורת", icon: <GitMerge className="text-blue-400" />, content: "בלתי-תלוי = מה שאני משנה. תלוי = מה שאני מודד. קבועים = מה ששומרים זהה. ביקורת = להשוואה." },
    { title: "בניית גרף", icon: <LineChart className="text-amber-400" />, content: "משתנה בלתי-תלוי בציר X, תלוי בציר Y. חובה כותרת, יחידות מידה וקנה מידה. בדיד = עמודות, רציף = פיזור." },
    { title: "ניסוח מדעי זהיר", icon: <Info className="text-rose-400" />, content: "\"התוצאות מצביעות על...\", \"ייתכן ש...\", \"בשלב זה אי אפשר לקבוע\". להימנע מ\"הוכחנו\"." },
    { title: "ציטוט מקורות", icon: <BookOpen className="text-emerald-400" />, content: "כל טענה מבוססת מקור אמין. להבחין בין עובדה, הסבר ומסקנה. לרשום ביבליוגרפיה מסודרת." }
  ];

  return (
    <div className="py-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="text-center mb-16 px-4">
        <h2 className="text-4xl md:text-5xl font-black text-white mb-6 drop-shadow-lg">כללי הכתיבה המדעית</h2>
        <p className="text-slate-300 text-xl md:text-2xl font-light">העבירו את העכבר על הכרטיסיות כדי לחזור על הדגשים</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto px-6 pb-20">
        {cards.map((item, idx) => (
          <div key={idx} className="group flashcard-container h-80 cursor-pointer">
            <div className="flashcard-inner">
              <div className="flashcard-front bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center justify-center text-center shadow-2xl">
                <div className="bg-white/5 p-6 rounded-full mb-6 shadow-inner border border-white/5">{React.cloneElement(item.icon, { size: 48 })}</div>
                <h3 className="text-3xl font-black text-white tracking-tight">{item.title}</h3>
                <div className="mt-6 flex items-center gap-2 text-cyan-400 text-sm font-bold uppercase tracking-widest"><RefreshCw size={16} /> הפוך כרטיסיה</div>
              </div>
              <div className="flashcard-back bg-gradient-to-br from-cyan-900/90 to-slate-900/95 backdrop-blur-2xl border border-cyan-400/40 rounded-[2.5rem] p-10 flex items-center justify-center text-center shadow-2xl">
                <p className="text-white text-xl md:text-2xl leading-relaxed font-medium italic">"{item.content}"</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <style dangerouslySetInnerHTML={{__html: `
        .flashcard-container { perspective: 1200px; }
        .flashcard-inner { position: relative; width: 100%; height: 100%; transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); transform-style: preserve-3d; }
        .group:hover .flashcard-inner { transform: rotateY(180deg); }
        .flashcard-front, .flashcard-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; top: 0; left: 0; display: flex; flex-direction: column; }
        .flashcard-back { transform: rotateY(180deg); }
      `}} />
    </div>
  );
};

// --- רכיב עזר להצגת גרפים (מנוע SVG מדעי) ---
const ScientificChart = ({ data, type, xAxis, yAxis, textAccent, graphTitle }) => {
  const isBar = type === 'bar';
  const padLeft = 85;
  const padBottom = 80;
  const padRight = 30;
  const padTop = 60;

  const width = 600;
  const height = 400;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const maxDataX = isBar ? data.length : (Math.max(...data.map(d => Number(d.x))) || 1);
  const maxDataY = Math.max(...data.map(d => Number(d.y))) || 1;
  const yScaleMax = maxDataY * 1.1;

  let strokeColor = "#22d3ee";
  if (textAccent.includes("purple")) strokeColor = "#c084fc";
  if (textAccent.includes("emerald")) strokeColor = "#34d399";
  if (textAccent.includes("orange")) strokeColor = "#fb923c";
  if (textAccent.includes("pink")) strokeColor = "#f472b6";
  if (textAccent.includes("yellow")) strokeColor = "#facc15";
  if (textAccent.includes("lime")) strokeColor = "#a3e635";
  if (textAccent.includes("teal")) strokeColor = "#2dd4bf";
  if (textAccent.includes("blue")) strokeColor = "#60a5fa";
  if (textAccent.includes("amber")) strokeColor = "#fbbf24";
  if (textAccent.includes("rose")) strokeColor = "#fb7185";

  const getX = (val) => padLeft + (val / maxDataX) * innerW;
  const getY = (val) => height - padBottom - (val / yScaleMax) * innerH;

  return (
    <div className="w-full chart-shell rounded-[2rem] relative p-6 mt-6 shadow-2xl flex flex-col items-center">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto drop-shadow-xl" style={{fontFamily: 'sans-serif'}}>

        <text x={width/2} y={padTop/2} fill="white" fontSize="18" fontWeight="bold" textAnchor="middle" className="tracking-wide">
          {graphTitle}
        </text>

        <line x1={padLeft} y1={padTop} x2={padLeft} y2={height - padBottom} stroke="#475569" strokeWidth="2" />
        <line x1={padLeft} y1={height - padBottom} x2={width - padRight} y2={height - padBottom} stroke="#475569" strokeWidth="2" />

        <text x={width/2} y={height - padBottom + 50} fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle">
          {xAxis}
        </text>
        <text x={padLeft - 60} y={height/2} transform={`rotate(-90 ${padLeft - 60} ${height/2})`} fill="#94a3b8" fontSize="14" fontWeight="bold" textAnchor="middle">
          {yAxis}
        </text>

        {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => {
          const tickVal = tick * yScaleMax;
          const yPos = getY(tickVal);
          return (
            <g key={`y-${i}`}>
              <line x1={padLeft} y1={yPos} x2={width - padRight} y2={yPos} stroke="#1e293b" strokeWidth="1" strokeDasharray="4" />
              <text x={padLeft - 10} y={yPos + 4} fill="#cbd5e1" fontSize="12" textAnchor="end">
                {Number.isInteger(tickVal) ? tickVal : tickVal.toFixed(2)}
              </text>
            </g>
          );
        })}

        {isBar ? (
          data.map((d, i) => {
            const barW = (innerW / data.length) * 0.5;
            const x = padLeft + (i + 0.5) * (innerW / data.length) - barW/2;
            const yPos = getY(d.y);
            const h = height - padBottom - yPos;
            return (
              <g key={i} className="hover:opacity-80 transition-opacity cursor-pointer">
                <rect x={x} y={yPos} width={barW} height={h} fill={strokeColor} opacity="0.85" rx="3" />
                <text x={x+barW/2} y={yPos - 8} fontSize="12" fontWeight="bold" fill={strokeColor} textAnchor="middle">{d.y}</text>
                <text x={x+barW/2} y={height - padBottom + 20} fontSize="11" fill="#cbd5e1" textAnchor="middle">{d.x}</text>
              </g>
            )
          })
        ) : (
          <>
            {type === 'scatter' ? (
               <line x1={getX(data[0].x)} y1={getY(data[0].y)}
                     x2={getX(data[data.length-1].x)} y2={getY(data[data.length-1].y)}
                     stroke={strokeColor} strokeWidth="2" strokeDasharray="5" opacity="0.6" />
            ) : (
               <polyline points={data.map(d => `${getX(d.x)},${getY(d.y)}`).join(' ')} fill="none" stroke={strokeColor} strokeWidth="2.5" />
            )}

            {data.map((d, i) => (
              <g key={i} className="hover:scale-150 transition-transform origin-center cursor-pointer" style={{transformOrigin: `${getX(d.x)}px ${getY(d.y)}px`}}>
                <circle cx={getX(d.x)} cy={getY(d.y)} r="5" fill={strokeColor} stroke="#0f172a" strokeWidth="2" className="drop-shadow-lg" />
                <text x={getX(d.x)} y={height - padBottom + 20} fontSize="12" fill="#cbd5e1" textAnchor="middle">{d.x}</text>
              </g>
            ))}
          </>
        )}
      </svg>
    </div>
  );
};

// --- מציג גלריה (Lightbox) למצגות / מסמכים / קבצים שהועלו ---
function GalleryViewer({ items, startIndex = 0, accent = '#22d3ee', onClose }) {
  const safeItems = (items || []).filter(Boolean);
  const [i, setI] = useState(startIndex);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') setI(v => (v + 1) % safeItems.length);
      else if (e.key === 'ArrowRight') setI(v => (v - 1 + safeItems.length) % safeItems.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [safeItems.length, onClose]);

  if (!safeItems.length) return null;
  const idx = Math.min(i, safeItems.length - 1);
  const item = safeItems[idx];
  const go = (d) => setI(v => (v + d + safeItems.length) % safeItems.length);

  const stage = () => {
    if (item.kind === 'image') return <img src={item.src} alt={item.title || ''} />;
    // צופה PDF נקי: ביטול פאנל הסליידים בצד (navpanes=0) + התאמת רוחב לעמוד (פוקוס), עם שמירת סרגל ניווט/זום
    if (item.kind === 'pdf')   return <iframe src={`${item.src}#toolbar=1&navpanes=0&statusbar=0&view=FitH`} title={item.title || 'pdf'} />;
    if (item.kind === 'drive') return <iframe src={drivePreview(item.src)} title={item.title || 'drive'} allow="autoplay" allowFullScreen />;
    return <iframe src={item.src} title={item.title || 'doc'} />;
  };

  return (
    <div className="gallery-backdrop" dir="rtl" onClick={onClose}>
      <div className="gallery-panel" style={{ '--gv-accent': accent }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <Images className="w-5 h-5 shrink-0" style={{ color: accent }} />
            <span className="font-black text-lg truncate text-white">{item.title || 'תצוגה'}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-sm font-bold text-slate-400 whitespace-nowrap">{idx + 1} / {safeItems.length}</span>
            {item.kind === 'drive' && (
              <a href={item.src} target="_blank" rel="noreferrer" title="פתח במקור (Drive)" className="text-slate-400 hover:text-white p-2 rounded-full bg-white/5"><ExternalLink className="w-5 h-5" /></a>
            )}
            <button onClick={onClose} title="סגור" className="text-slate-400 hover:text-white p-2 rounded-full bg-white/5"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="gallery-stage">
          {stage()}
          {safeItems.length > 1 && (
            <>
              <button className="gallery-nav next" onClick={() => go(1)} aria-label="הבא"><ChevronLeft className="w-6 h-6" /></button>
              <button className="gallery-nav prev" onClick={() => go(-1)} aria-label="קודם"><ChevronRight className="w-6 h-6" /></button>
            </>
          )}
        </div>
        {safeItems.length > 1 && (
          <div className="flex gap-3 px-6 py-4 overflow-x-auto scrollbar-hide border-t border-white/10">
            {safeItems.map((it, k) => (
              <button key={k} onClick={() => setI(k)} title={it.title || ''} className={`gv-thumb ${k === idx ? 'active' : ''}`}>
                {it.kind === 'image'
                  ? <img src={it.src} alt="" />
                  : (it.kind === 'pdf' ? <FileText className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- כרטיס חומר בודד (מצגת/מסמך) שנפתח בגלריה — לשימוש בטאב הגלריה ---
function MaterialCard({ item, onOpen }) {
  return (
    <div onClick={onOpen}
         className="group relative bg-slate-900/40 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl cursor-pointer hover:-translate-y-2 transition-all duration-500">
      <div className="h-44 flex items-center justify-center bg-white/5 overflow-hidden">
        {item.kind === 'image' ? <ImageIcon className="w-16 h-16 text-cyan-400" /> : <FileText className="w-16 h-16 text-cyan-400" />}
      </div>
      <div className="p-4 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-300 truncate">{item.title}</span>
        <ExternalLink className="w-4 h-4 text-slate-500 shrink-0" />
      </div>
    </div>
  );
}

// --- מקטע גלריה / העלאות בתוך תחנה ---
function UploadGallery({ uploads, onAdd, onRemove, onOpen }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []).filter(f =>
      f.type.startsWith('image/') || f.type === 'application/pdf');
    if (files.length) onAdd(files);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-6xl mx-auto">
      <div
        className={`upload-zone bg-slate-900/40 backdrop-blur-xl p-12 mb-12 text-center cursor-pointer ${drag ? 'drag' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      >
        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6">
          <Upload className="w-12 h-12 text-cyan-400" />
        </div>
        <h3 className="text-3xl font-black text-white mb-3">העלאת מצגות, תמונות או PDF</h3>
        <p className="text-lg text-slate-400 font-light">גררו לכאן קבצים או לחצו לבחירה — הם יישמרו במכשיר זה ויוצגו בגלריה ממש כמו המצגות.</p>
        <input ref={inputRef} type="file" accept="image/*,application/pdf" multiple className="hidden"
               onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }} />
      </div>

      {uploads.length === 0 ? (
        <p className="text-center text-slate-500 text-xl font-light py-10">עדיין לא הועלו קבצים.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
          {uploads.map((u, k) => (
            <div key={u.id} className="group relative bg-slate-900/40 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl cursor-pointer hover:-translate-y-2 transition-all duration-500"
                 onClick={() => onOpen(k)}>
              <div className="h-44 flex items-center justify-center bg-white/5 overflow-hidden">
                {u.kind === 'image'
                  ? <img src={u.src} alt={u.name} className="w-full h-full object-cover" />
                  : <FileText className="w-16 h-16 text-cyan-400" />}
              </div>
              <div className="p-4 flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-300 truncate">{u.name}</span>
                <button onClick={(e) => { e.stopPropagation(); onRemove(u.id); }} title="מחק"
                        className="text-slate-500 hover:text-red-400 p-1 rounded-full shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- כפתור החלפת ערכת נושא (בהיר / כהה) ---
function ThemeToggle({ theme, onToggle }) {
  return (
    <button className="theme-toggle" onClick={onToggle}
            title={theme === 'light' ? 'מצב כהה' : 'מצב בהיר'}>
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
      <span>{theme === 'light' ? 'כהה' : 'בהיר'}</span>
    </button>
  );
}

// --- כפתור אופציית "סירנת ניאון" בריחוף (כבוי כברירת מחדל) ---
function NeonToggle({ on, onToggle }) {
  return (
    <button className="neon-toggle" onClick={onToggle} aria-pressed={on}
            title={on ? 'כבה אפקט ניאון מסתובב בריחוף' : 'הפעל אפקט ניאון מסתובב בריחוף'}>
      <Zap className="w-4 h-4" />
      <span>ניאון {on ? 'פעיל' : 'כבוי'}</span>
    </button>
  );
}

const BTN_COLOR = {
  blue:   "border-blue-500/30 bg-blue-600/10 text-blue-300 hover:bg-blue-600 hover:text-white",
  emerald:"border-emerald-500/30 bg-emerald-600/10 text-emerald-300 hover:bg-emerald-600 hover:text-white",
};

// --- האפליקציה המרכזית (App) ---
export default function App() {
  const [activeStationId, setActiveStationId] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [homeTab, setHomeTab] = useState('stations');

  // ערכת נושא — ברירת מחדל בהיר
  const [theme, setTheme] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('bioapps-theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'light';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('bioapps-theme', theme); } catch { /* ignore */ }
  }, [theme]);
  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'));

  // אפקט "סירנת ניאון" בריחוף — כבוי כברירת מחדל
  const [neon, setNeon] = useState(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('bioapps-neon') === 'on') return 'on';
    return 'off';
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-neon', neon);
    try { localStorage.setItem('bioapps-neon', neon); } catch { /* ignore */ }
  }, [neon]);
  const toggleNeon = () => setNeon(n => (n === 'on' ? 'off' : 'on'));

  // קבצים שהמשתמש העלה (נשמרים ב-IndexedDB על המכשיר)
  const [uploads, setUploads] = useState([]);
  useEffect(() => {
    const urls = [];
    idbAll().then(recs => {
      setUploads(recs.map(r => {
        const src = URL.createObjectURL(r.blob);
        urls.push(src);
        return { id: r.id, name: r.name, kind: fileKind(r.type), src };
      }));
    });
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, []);

  const addUploads = async (files) => {
    const added = [];
    for (const f of files) {
      const id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random());
      try {
        await idbPut({ id, name: f.name, type: f.type, blob: f });
        added.push({ id, name: f.name, kind: fileKind(f.type), src: URL.createObjectURL(f) });
      } catch (e) { console.error('upload failed', e); }
    }
    if (added.length) setUploads(prev => [...added, ...prev]);
  };
  const removeUpload = async (id) => {
    await idbDelete(id);
    setUploads(prev => {
      const gone = prev.find(u => u.id === id);
      if (gone) URL.revokeObjectURL(gone.src);
      return prev.filter(u => u.id !== id);
    });
  };

  // מציג הגלריה (Lightbox)
  const [gallery, setGallery] = useState(null); // { items, startIndex, accent }
  const openGallery = (items, startIndex = 0, accent = '#22d3ee') =>
    setGallery({ items: (items || []).filter(Boolean), startIndex, accent });
  const closeGallery = () => setGallery(null);
  const uploadItems = uploads.map(u => ({ kind: u.kind, src: u.src, title: u.name }));

  const activeStation = stationsData.find(s => s.id === activeStationId);
  const goHome = () => { setActiveStationId(null); setHomeTab('stations'); };

  // כל החומרים של התחנה הפעילה (לשימוש בטאב הגלריה — מעל מקטע ההעלאות)
  const stationMaterials = activeStation?.buttons?.flatMap(b => b.items) || [];

  return (
    <div dir="rtl" className="page-shell min-h-screen text-slate-300 font-sans flex flex-col overflow-x-hidden relative">

      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <NeonToggle on={neon === 'on'} onToggle={toggleNeon} />

      {/* רקע עתידני */}
      <div className="app-bg fixed inset-0 pointer-events-none"></div>

      <main className="flex-1 relative p-6 lg:p-12 z-10">

        {/* --- מסך הבית המרכזי --- */}
        {!activeStationId && (
          <div className="max-w-[1500px] mx-auto pt-10 pb-20 animate-in fade-in duration-1000">

             {/* כותרת מפלצתית */}
             <div className="text-center mb-12 flex flex-col items-center">
                 <h1 className="hero-title text-6xl md:text-8xl lg:text-[11rem] font-black text-transparent bg-clip-text drop-shadow-[0_0_60px_rgba(6,182,212,0.45)] mb-4 sm:mb-8 tracking-tighter leading-none select-none">BIO<span className="text-orange-500">TECH</span></h1>

                 <p className="text-cyan-300 text-lg sm:text-3xl md:text-4xl font-light tracking-[0.1em] sm:tracking-[0.2em] uppercase drop-shadow-md text-center"><span className="font-bold subtitle-hl">יישומים</span> בביוטכנולוגיה</p>
                 <p className="text-slate-400 text-base sm:text-xl md:text-2xl font-light mt-4 text-center max-w-3xl">פרויקט חקר: קסניה פועמת כביו-אינדיקטור · השפעת עקות סביבתיות על שונית האלמוגים</p>

             </div>

             {/* תפריט גישה מהירה — נפרס ל-2 שורות (flex-wrap) כדי לכלול הכל */}
             <div className="flex flex-wrap justify-center gap-4 mb-20 px-4 mt-10">
               {[
                 {id: 'stations', label: 'תחנות המחקר', icon: <List />},
                 {id: 'guide', label: 'כללי הכתיבה המדעית', icon: <BookOpen />}
               ].map(t => (
                 <button
                   key={t.id}
                   onClick={()=>setHomeTab(t.id)}
                   className={`px-8 py-4 rounded-full border backdrop-blur-md transition-all text-lg font-bold flex items-center gap-3 shadow-xl whitespace-nowrap ${homeTab===t.id?'bg-orange-500/20 text-orange-300 border-orange-400':'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                 >
                   {t.icon} {t.label}
                 </button>
               ))}

               {/* מסע אל השונית — הרקע המדעי ייפתח ישירות בגלריה */}
               <button onClick={() => openGallery([
                 DECK('journey-to-reef.pdf', 'מסע מן הפוליפ אל השונית'),
                 IMG('coral-infographic.png', 'עולם האלמוגים — שומרי סף האוקיינוס')
               ], 0, '#2dd4bf')} className="px-8 py-4 rounded-full border backdrop-blur-md transition-all text-lg font-bold flex items-center gap-3 shadow-xl whitespace-nowrap bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-teal-500/50 hover:text-teal-300">
                 <ImageIcon className="w-6 h-6" /> מסע אל השונית
               </button>

               {/* קישור לתיקיית הדרייב של הפרויקט */}
               <a href={DRIVE_FOLDER} target="_blank" rel="noreferrer" className="px-8 py-4 rounded-full border backdrop-blur-md transition-all text-lg font-bold flex items-center gap-3 shadow-xl whitespace-nowrap bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-emerald-500/50 hover:text-emerald-300">
                 <ExternalLink className="w-6 h-6" /> תיקיית הדרייב
               </a>

               {/* הכנה לבגרות — נמשיך בהמשך (בקרוב) */}
               <button onClick={() => alert('המדור "הכנה לבגרות" ייבנה בהמשך 🙂')} className="px-8 py-4 rounded-full border backdrop-blur-md transition-all text-lg font-bold flex items-center gap-3 shadow-xl whitespace-nowrap bg-white/5 border-dashed border-white/20 text-slate-500 hover:text-white hover:bg-white/10 hover:border-purple-500/50">
                 <Microscope className="w-6 h-6" /> הכנה לבגרות <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-400">בקרוב</span>
               </button>
             </div>

             {/* --- לשונית כללי הכתיבה --- */}
             {homeTab === 'guide' && <div className="animate-in fade-in duration-500"><WritingGuide /></div>}

             {/* --- לשונית תחנות המחקר --- */}
             {homeTab === 'stations' && (
               <div className="animate-in fade-in duration-500">
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10 px-4 mb-32">
                   {orderedStations.map(st => (
                     <div key={st.id} onClick={()=>{setActiveStationId(st.id); setActiveTab('content');}}
                          style={{ '--neon': neonOf(st.textAccent) }}
                          className="lab-card group cursor-pointer bg-slate-900/40 border border-white/10 rounded-[2.5rem] flex flex-col shadow-2xl relative min-h-[19rem] hover:-translate-y-3">
                       <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden">
                         <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br ${st.color}`}></div>
                         <div className="lab-watermark">{React.cloneElement(st.icon, { strokeWidth: 1.75 })}</div>
                       </div>
                       <div className="lab-icon-badge">{React.cloneElement(st.icon)}</div>
                       <div className="relative z-10 px-9 pb-9 pt-28 flex-1 flex flex-col justify-end">
                         <span className={`text-xs font-black uppercase tracking-widest mb-2 ${st.textAccent}`}>{st.pillar}</span>
                         <h4 className="font-black text-white mb-3 text-3xl tracking-tight leading-tight">{st.title}</h4>
                         <p className="text-slate-400 text-lg line-clamp-2 font-light">{st.subtitle}</p>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             )}
          </div>
        )}

        {/* --- מסך תצוגת תחנה ספציפית --- */}
        {activeStationId && (
          <div className="space-y-12 max-w-[1600px] mx-auto animate-in slide-in-from-right-20 duration-700 mt-10">
            {/* פאנל עליון */}
            <div className="flex flex-col gap-10 border-b border-slate-800 pb-12 relative">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <button onClick={goHome} className="flex items-center gap-3 px-10 py-4 bg-slate-800/50 border border-slate-700 rounded-full text-white font-bold text-xl hover:bg-slate-700 transition-all shadow-xl backdrop-blur-md shrink-0"><ChevronLeft className="w-6 h-6"/> חזרה לתחנות</button>
                {/* תפריט גישה מהירה לכל התחנות — נפרס ל-2 שורות (flex-wrap) */}
                <div className="flex-1 w-full flex flex-wrap items-center gap-3 py-2">
                  {orderedStations.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {setActiveStationId(s.id); setActiveTab('content');}}
                      className={`px-5 py-2.5 rounded-full whitespace-nowrap text-sm font-black border transition-all ${activeStationId===s.id?`bg-slate-800 border-slate-600 ${s.textAccent} shadow-lg`:'bg-transparent border-slate-800 text-slate-500 hover:text-white hover:border-slate-600'}`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col xl:flex-row justify-between items-end gap-10 w-full text-right">
                <div className="flex-1">
                  <span className={`text-base font-black uppercase tracking-widest ${activeStation.textAccent}`}>{activeStation.pillar}</span>
                  <h2 className="text-5xl md:text-7xl font-black text-white mb-6 mt-2 drop-shadow-2xl leading-none tracking-tighter">{activeStation.title}</h2>
                  <p className={`${activeStation.textAccent} text-3xl font-light tracking-wide`}>{activeStation.subtitle}</p>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-4">
                  {activeStation.metrics?.map((m, i) => (
                    <div key={i} className={`bg-slate-900/60 border ${activeStation.borderAccent} rounded-[2rem] px-8 py-6 min-w-[180px] flex flex-col items-center shadow-2xl backdrop-blur-xl`}>
                      <div className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">{m.label}</div>
                      <div className={`text-xl font-black ${activeStation.textAccent} text-center`}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* כפתורי ניווט בתוך התחנה */}
            <div className="flex flex-wrap gap-5">
              <button onClick={()=>setActiveTab('content')} className={`px-10 py-5 rounded-full border backdrop-blur-md transition-all font-black text-xl flex items-center gap-3 ${activeTab==='content'?'bg-white/10 text-white border-white/40 shadow-xl':'border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}>
                {activeStation.type === 'experiment' ? <ClipboardList className="w-6 h-6"/> : <Info className="w-6 h-6"/>}
                {activeStation.type === 'experiment' ? 'דוח הניסוי' : 'תוכן התחנה'}
              </button>
              <button onClick={()=>setActiveTab('gallery')} className={`px-10 py-5 rounded-full border backdrop-blur-md transition-all font-black text-xl flex items-center gap-3 ${activeTab==='gallery'?'bg-white/10 text-white border-white/40 shadow-xl':'border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-600'}`}><Images className="w-6 h-6"/> גלריה / העלאות</button>

              {activeStation.buttons?.length > 0 && <div className="w-px h-12 bg-slate-800 mx-2 self-center hidden sm:block"></div>}

              {activeStation.buttons?.map((b, i) => (
                <button key={i} onClick={() => openGallery(b.items, 0, neonOf(activeStation.textAccent))}
                        className={`px-10 py-5 rounded-full border font-black text-xl transition-all shadow-xl flex items-center gap-3 ${BTN_COLOR[b.color] || BTN_COLOR.blue}`}>
                  {b.icon} {b.label}
                </button>
              ))}

              {/* כפתור הגשה — בכל שלב של הפרויקט */}
              <a href={SUBMIT_URL} target="_blank" rel="noreferrer" title="הגשת התוצר של שלב זה"
                 className="px-10 py-5 rounded-full border-2 border-orange-500/50 bg-orange-500/15 text-orange-300 font-black text-xl hover:bg-orange-500 hover:text-white transition-all shadow-xl flex items-center gap-3">
                <Upload className="w-6 h-6" /> הגשה
              </a>
            </div>

            <div className="pb-32">
              {activeTab === 'content' ? (
                activeStation.type === 'experiment' ? (
                  /* ---------- דוח ניסוי ---------- */
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
                    <div className="xl:col-span-2 space-y-10">
                      <div style={{ borderColor: neonOf(activeStation.textAccent) }} className="bg-slate-900/40 border-2 border-r-8 rounded-[2.5rem] p-10 shadow-2xl">
                        <h3 className={`text-xl font-black ${activeStation.textAccent} mb-4 uppercase tracking-wider`}>שאלת המחקר</h3>
                        <p className="text-3xl text-white font-medium leading-relaxed italic">"{activeStation.researchQuestion}"</p>
                      </div>

                      <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-4 mb-6 border-b border-slate-700 pb-6 w-full"><BrainCircuit className={activeStation.textAccent} /> השערת המחקר</h3>
                        <p className="text-xl text-slate-200 leading-relaxed font-light">{activeStation.hypothesis}</p>
                      </div>

                      {activeStation.variables && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[
                            { k: 'משתנה בלתי-תלוי', v: activeStation.variables.indep },
                            { k: 'משתנה תלוי', v: activeStation.variables.dep },
                            { k: 'קבוצת ביקורת', v: activeStation.variables.control },
                            { k: 'משתנים קבועים', v: activeStation.variables.constants },
                          ].map((it, i) => (
                            <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-[2rem] p-6 shadow-xl">
                              <div className={`text-sm font-black uppercase tracking-widest mb-2 ${activeStation.textAccent}`}>{it.k}</div>
                              <div className="text-lg text-slate-200 font-light leading-relaxed">{it.v}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                          <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6 border-b border-slate-700 pb-4"><Beaker className={activeStation.textAccent} /> חומרים וכלים</h3>
                          <ul className="space-y-3">
                            {activeStation.materials?.map((mat, i) => (
                              <li key={i} className="flex items-start gap-3 text-slate-300 font-light text-lg"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-1" /> {mat}</li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                          <h3 className="text-xl font-bold text-white flex items-center gap-3 mb-6 border-b border-slate-700 pb-4"><ListChecks className={activeStation.textAccent} /> מהלך הניסוי</h3>
                          <ol className="space-y-4 list-decimal list-inside text-slate-300 font-light text-lg marker:text-cyan-500 marker:font-bold">
                            {activeStation.procedure?.map((step, i) => (
                              <li key={i} className="pl-2 leading-relaxed">{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>

                    {/* עמודה שמאלית: תוצאות וגרף */}
                    <div className="space-y-10">
                      <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl h-full flex flex-col">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-4 mb-8 border-b border-slate-700 pb-6 w-full"><TableProperties className="text-slate-400" /> תוצאות הניסוי</h3>

                        {activeStation.chartData ? (
                          <>
                            {activeStation.tableHeaders && (
                              <div className="overflow-x-auto border border-slate-700 rounded-2xl mb-12">
                                <table className="w-full text-right text-slate-200">
                                  <thead className="bg-slate-800/50 border-b border-slate-700">
                                    <tr>
                                      <th className="p-4 font-bold text-cyan-400">{activeStation.tableHeaders[0]}</th>
                                      <th className="p-4 font-bold text-cyan-400">{activeStation.tableHeaders[1]}</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {activeStation.chartData.map((row, i) => (
                                      <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="p-4 font-light text-xl">{row.x}</td>
                                        <td className="p-4 font-light text-xl">{row.y}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            <h3 className="text-2xl font-bold text-white flex items-center gap-4 mb-2 border-b border-slate-700 pb-6 w-full"><LineChart className="text-slate-400" /> עיבוד נתונים לגרף</h3>
                            <p className="text-sm text-slate-400 font-light mb-6 text-right">משתנה בלתי-תלוי בציר X, תלוי בציר Y — כולל כותרת ויחידות.</p>

                            <ScientificChart
                              data={activeStation.chartData}
                              type={activeStation.chartType}
                              xAxis={activeStation.xAxis}
                              yAxis={activeStation.yAxis}
                              textAccent={activeStation.textAccent}
                              graphTitle={activeStation.graphTitle}
                            />
                          </>
                        ) : (
                          <div className="p-8 rounded-2xl bg-amber-900/10 border border-amber-500/25 text-amber-200 font-light leading-relaxed text-right mb-6">
                            <Clock className="inline-block w-6 h-6 ml-2 text-amber-400" />
                            התוצאות הכמותיות לניסוי זה <span className="font-bold">בעיבוד</span> ויתווספו עם השלמת המדידות (ספירת פעימות + מדידת ביטוי הגן HSP70). מבנה הניסוי, ההשערה והשיטה זהים לשאר הניסויים.
                          </div>
                        )}

                        {activeStation.note && (
                          <div className="mt-6 p-5 rounded-2xl bg-slate-800/30 border border-slate-700 text-slate-300 font-light text-sm leading-relaxed text-right">
                            <Info className="inline-block w-4 h-4 ml-2 text-slate-400" />{activeStation.note}
                          </div>
                        )}

                        {activeStation.conclusion && (
                          <div className="mt-auto pt-10">
                            <div className="p-6 rounded-2xl bg-blue-900/10 border border-blue-500/20 font-light text-blue-200 leading-relaxed text-right">
                              <Info className="inline-block w-5 h-5 ml-2 text-blue-400" />
                              <span className="font-bold text-blue-100">מסקנות-ביניים: </span>{activeStation.conclusion}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ---------- תחנת תוכן (כתיבה / רקע / מדיה) ---------- */
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-10">
                      <div style={{ borderColor: neonOf(activeStation.textAccent) }} className="bg-slate-900/40 border-2 border-r-8 rounded-[2.5rem] p-10 shadow-2xl">
                        <h3 className={`text-xl font-black ${activeStation.textAccent} mb-4 uppercase tracking-wider`}>על שלב זה במחקר</h3>
                        <p className="text-2xl text-white font-light leading-relaxed">{activeStation.intro}</p>
                      </div>

                      {activeStation.researchQuestion && (
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                          <h3 className={`text-xl font-black ${activeStation.textAccent} mb-4 uppercase tracking-wider flex items-center gap-3`}><BrainCircuit className="w-6 h-6" /> שאלת המחקר</h3>
                          <p className="text-2xl text-white font-medium leading-relaxed italic">"{activeStation.researchQuestion}"</p>
                        </div>
                      )}

                      {activeStation.hsp70 && (
                        <div className="bg-slate-900/40 border border-rose-500/30 rounded-[2.5rem] p-8 shadow-2xl">
                          <h3 className="text-lg font-black text-rose-400 mb-3 uppercase tracking-wider flex items-center gap-3"><Dna className="w-5 h-5" /> רקע: הגן HSP70</h3>
                          <p className="text-lg text-slate-200 font-light leading-relaxed">{activeStation.hsp70}</p>
                        </div>
                      )}

                      {activeStation.steps && (
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                          <h3 className="text-2xl font-bold text-white flex items-center gap-4 mb-6 border-b border-slate-700 pb-6 w-full"><ListChecks className={activeStation.textAccent} /> {activeStation.type === 'background' ? 'תחנות המסע' : 'שלבי העבודה'}</h3>
                          <ol className="space-y-4 list-decimal list-inside text-slate-200 font-light text-xl marker:text-cyan-500 marker:font-bold">
                            {activeStation.steps.map((step, i) => (
                              <li key={i} className="pl-2 leading-relaxed">{step}</li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>

                    <div className="space-y-10">
                      {activeStation.keyPoints && (
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                          <h3 className="text-2xl font-bold text-white flex items-center gap-4 mb-6 border-b border-slate-700 pb-6 w-full"><Info className={activeStation.textAccent} /> דגשים</h3>
                          <ul className="space-y-4">
                            {activeStation.keyPoints.map((p, i) => (
                              <li key={i} className="flex items-start gap-3 text-slate-200 font-light text-lg"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-1" /> {p}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {activeStation.buttons?.length > 0 && (
                        <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
                          <h3 className="text-2xl font-bold text-white flex items-center gap-4 mb-6 border-b border-slate-700 pb-6 w-full"><Images className={activeStation.textAccent} /> חומרים נלווים</h3>
                          <p className="text-lg text-slate-400 font-light mb-6">המצגות והמסמכים של תחנה זו — לחצו לפתיחה:</p>
                          <div className="flex flex-col gap-4">
                            {activeStation.buttons.map((b, i) => (
                              <button key={i} onClick={() => openGallery(b.items, 0, neonOf(activeStation.textAccent))}
                                      className={`w-full px-6 py-4 rounded-2xl border font-bold text-lg transition-all shadow-lg flex items-center gap-3 ${BTN_COLOR[b.color] || BTN_COLOR.blue}`}>
                                {b.icon} {b.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                /* גלריה / העלאות — קודם החומרים של התחנה (נפתחים כמו מצגות), ואז ההעלאות */
                <div className="space-y-12">
                  {stationMaterials.length > 0 && (
                    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
                      <h3 className="text-2xl font-black text-white mb-6 flex items-center gap-3"><Images className={activeStation.textAccent} /> מצגות וחומרי התחנה</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
                        {stationMaterials.map((it, k) => (
                          <MaterialCard key={k} item={it}
                            onOpen={() => openGallery(stationMaterials, k, neonOf(activeStation.textAccent))} />
                        ))}
                      </div>
                      <div className="border-t border-slate-800 mt-12 pt-2"></div>
                    </div>
                  )}
                  <UploadGallery
                    uploads={uploads}
                    onAdd={addUploads}
                    onRemove={removeUpload}
                    onOpen={(k) => openGallery(uploadItems, k, neonOf(activeStation.textAccent))}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* פאנל תחתון */}
      <footer className="app-footer py-8 text-center border-t border-slate-800 text-slate-600 font-light z-10">
         יישומים בביוטכנולוגיה | פרויקט חקר השונית · קסניה פועמת כביו-אינדיקטור · תשפ"ז
      </footer>

      {/* מציג הגלריה — נפתח מעל הכל */}
      {gallery && (
        <GalleryViewer
          items={gallery.items}
          startIndex={gallery.startIndex}
          accent={gallery.accent}
          onClose={closeGallery}
        />
      )}

      {/* הסתרת פס גלילה מציק */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
