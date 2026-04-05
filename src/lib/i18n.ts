export type Language = 'en' | 'am' | 'om' | 'ar';

export const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'am', label: 'Amharic', nativeLabel: 'አማርኛ' },
  { code: 'om', label: 'Afan Oromo', nativeLabel: 'Afaan Oromoo' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
];

type TranslationKey =
  | 'home' | 'create' | 'settings' | 'myIdeas' | 'searchIdeas'
  | 'newIdea' | 'title' | 'description' | 'save' | 'cancel'
  | 'login' | 'signup' | 'email' | 'password' | 'logout'
  | 'aiSummary' | 'suggestions' | 'features' | 'evaluation' | 'marketCheck'
  | 'expandIdea' | 'generateImage' | 'downloadPdf' | 'voiceInput'
  | 'noIdeas' | 'createFirst' | 'loading' | 'darkMode' | 'language'
  | 'feasibility' | 'innovation' | 'versionHistory' | 'translate'
  | 'analyze' | 'analyzing' | 'deleteIdea' | 'confirmDelete'
  | 'appName' | 'welcomeBack' | 'getStarted'
  | 'generatePrompt' | 'generatingPrompt' | 'updateIdea' | 'editing';

const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    home: 'Home', create: 'Create', settings: 'Settings', myIdeas: 'My Ideas',
    searchIdeas: 'Search ideas...', newIdea: 'New Idea', title: 'Title',
    description: 'Description', save: 'Save', cancel: 'Cancel',
    login: 'Log In', signup: 'Sign Up', email: 'Email', password: 'Password',
    logout: 'Log Out', aiSummary: 'AI Summary', suggestions: 'Suggestions',
    features: 'Features', evaluation: 'Evaluation', marketCheck: 'Market Check',
    expandIdea: 'Expand Idea', generateImage: 'Generate Image',
    downloadPdf: 'Download PDF', voiceInput: 'Voice Input', noIdeas: 'No ideas yet',
    createFirst: 'Create your first idea', loading: 'Loading...', darkMode: 'Dark Mode',
    language: 'Language', feasibility: 'Feasibility', innovation: 'Innovation',
    versionHistory: 'Version History', translate: 'Translate', analyze: 'Analyze with AI',
    analyzing: 'Analyzing...', deleteIdea: 'Delete', confirmDelete: 'Are you sure?',
    appName: 'IdeaVault AI', welcomeBack: 'Welcome back', getStarted: 'Get started',
    generatePrompt: 'Generate Prompt', generatingPrompt: 'Generating...', updateIdea: 'Update Idea', editing: 'Editing',
  },
  am: {
    home: 'መነሻ', create: 'ፍጠር', settings: 'ቅንብሮች', myIdeas: 'ሃሳቦቼ',
    searchIdeas: 'ሃሳቦችን ፈልግ...', newIdea: 'አዲስ ሃሳብ', title: 'ርዕስ',
    description: 'ገለጻ', save: 'አስቀምጥ', cancel: 'ሰርዝ',
    login: 'ግባ', signup: 'ተመዝገብ', email: 'ኢሜይል', password: 'የይለፍ ቃል',
    logout: 'ውጣ', aiSummary: 'AI ማጠቃለያ', suggestions: 'ጥቆማዎች',
    features: 'ባህሪያት', evaluation: 'ግምገማ', marketCheck: 'የገበያ ፍተሻ',
    expandIdea: 'ሃሳቡን አስፋ', generateImage: 'ምስል ፍጠር',
    downloadPdf: 'PDF አውርድ', voiceInput: 'የድምፅ ግብዓት', noIdeas: 'ገና ሃሳቦች የሉም',
    createFirst: 'የመጀመሪያ ሃሳብዎን ይፍጠሩ', loading: 'በመጫን ላይ...', darkMode: 'ጨለማ ሁነታ',
    language: 'ቋንቋ', feasibility: 'ተግባራዊነት', innovation: 'ፈጠራ',
    versionHistory: 'የስሪት ታሪክ', translate: 'ተርጉም', analyze: 'በAI ተንትን',
    analyzing: 'በመተንተን ላይ...', deleteIdea: 'ሰርዝ', confirmDelete: 'እርግጠኛ ነዎት?',
    appName: 'IdeaVault AI', welcomeBack: 'እንኳን ደህና መጡ', getStarted: 'ጀምር',
    generatePrompt: 'ፕሮምፕት ፍጠር', generatingPrompt: 'በመፍጠር ላይ...', updateIdea: 'ሃሳቡን አዘምን', editing: 'በማስተካከል ላይ',
  },
  om: {
    home: 'Mana', create: 'Uumi', settings: 'Qindaa\'ina', myIdeas: 'Yaadota Koo',
    searchIdeas: 'Yaadota barbaadi...', newIdea: 'Yaada Haaraa', title: 'Mata duree',
    description: 'Ibsa', save: 'Olkaa\'i', cancel: 'Haqi',
    login: 'Seeni', signup: 'Galmaa\'i', email: 'Imeelii', password: 'Jecha darbii',
    logout: 'Ba\'i', aiSummary: 'Cuunfaa AI', suggestions: 'Gorsa',
    features: 'Amaloota', evaluation: 'Madaallii', marketCheck: 'Sakatta\'a Gabaa',
    expandIdea: 'Yaada Bal\'isi', generateImage: 'Fakkii Uumi',
    downloadPdf: 'PDF Buufadhu', voiceInput: 'Galcha Sagalee', noIdeas: 'Yaadni hin jiru',
    createFirst: 'Yaada jalqabaa uumi', loading: 'Fe\'aa jira...', darkMode: 'Haala Dukkana',
    language: 'Afaan', feasibility: 'Raawwatamummaa', innovation: 'Haaroomsa',
    versionHistory: 'Seenaa Gosa', translate: 'Hiiki', analyze: 'AI\'n xiinxali',
    analyzing: 'Xiinxalaa jira...', deleteIdea: 'Haqi', confirmDelete: 'Mirkaneeffatte?',
    appName: 'IdeaVault AI', welcomeBack: 'Baga nagaan dhufte', getStarted: 'Jalqabi',
    generatePrompt: 'Prompt Uumi', generatingPrompt: 'Uumaa jira...', updateIdea: 'Yaada Haaromsi', editing: 'Gulaallaa jira',
  },
  ar: {
    home: 'الرئيسية', create: 'إنشاء', settings: 'الإعدادات', myIdeas: 'أفكاري',
    searchIdeas: 'ابحث عن أفكار...', newIdea: 'فكرة جديدة', title: 'العنوان',
    description: 'الوصف', save: 'حفظ', cancel: 'إلغاء',
    login: 'تسجيل الدخول', signup: 'إنشاء حساب', email: 'البريد الإلكتروني', password: 'كلمة المرور',
    logout: 'تسجيل الخروج', aiSummary: 'ملخص AI', suggestions: 'اقتراحات',
    features: 'الميزات', evaluation: 'التقييم', marketCheck: 'فحص السوق',
    expandIdea: 'توسيع الفكرة', generateImage: 'إنشاء صورة',
    downloadPdf: 'تحميل PDF', voiceInput: 'إدخال صوتي', noIdeas: 'لا توجد أفكار بعد',
    createFirst: 'أنشئ فكرتك الأولى', loading: 'جاري التحميل...', darkMode: 'الوضع الداكن',
    language: 'اللغة', feasibility: 'الجدوى', innovation: 'الابتكار',
    versionHistory: 'سجل الإصدارات', translate: 'ترجمة', analyze: 'تحليل بالذكاء الاصطناعي',
    analyzing: 'جاري التحليل...', deleteIdea: 'حذف', confirmDelete: 'هل أنت متأكد؟',
    appName: 'IdeaVault AI', welcomeBack: 'مرحباً بعودتك', getStarted: 'ابدأ',
    generatePrompt: 'إنشاء بروطمبت', generatingPrompt: 'جاري الإنشاء...', updateIdea: 'تحديث الفكرة', editing: 'تعديل',
  },
};

export function t(key: TranslationKey, lang: Language = 'en'): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
