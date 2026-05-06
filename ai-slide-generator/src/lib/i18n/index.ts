export type Language = 'ky' | 'ru' | 'en'

export const SUPPORTED_LANGUAGES: Language[] = ['ky', 'ru', 'en']

export const LANGUAGE_NAMES: Record<Language, string> = {
  ky: 'Кыргызча',
  ru: 'Русский',
  en: 'English',
}

export const LANGUAGE_FLAGS: Record<Language, string> = {
  ky: '🇰🇬',
  ru: '🇷🇺',
  en: '🇬🇧',
}

export const translations = {
  ky: {
    nav: {
      brand: 'AI Slide',
      newPresentation: 'Жаңы презентация',
      recent: 'Акыркылар',
      noRecent: 'Презентациялар жок',
      adminPanel: 'Админ панель',
      signOut: 'Чыгуу',
      signIn: 'Кирүү',
      upgradeHint: 'Акысыз колдонуучу',
      upgrade: 'Жогорулатуу',
    },
    lang: {
      title: 'Тилди тандаңыз',
      ky: 'Кыргызча',
      ru: 'Русский',
      en: 'English',
      detectPrompt: 'Колдонмонун тилин тандаңыз',
      autoDetected: 'Тил автоматтык аныкталды',
      save: 'Сактоо',
      change: 'Тилди өзгөртүү',
    },
    home: {
      badge: 'Google Gemini AI',
      headline1: 'Шаан-шөкөттүү',
      headlineGradient: 'презентацияларды',
      headline2: 'секунда ичинде жасаңыз',
      subtitle:
        'Темаңызды жазыңыз — Gemini AI мазмунду, структураны жана дизайнды автоматтык иреттейт. PowerPoint же PDF форматында жүктөп алыңыз.',
      ctaSignIn: 'Google менен баштоо',
      ctaLearnMore: 'Кеңири билүү',
      feature1Title: 'AI Генерация',
      feature1Desc:
        'Темаңызды бериңиз — Gemini 1.5 Pro мазмун, структура жана дизайнды өзү тандайт.',
      feature2Title: '12 Заманбап шаблон',
      feature2Desc:
        'Кесипкөй шаблондордон өзүңүзгө ылайыктуу стилди тандаңыз.',
      feature3Title: 'PPTX / PDF Экспорт',
      feature3Desc:
        'Даяр слайддарды PowerPoint же PDF форматында бир чыкылдатуу менен жүктөңүз.',
      signInPrompt: 'Баштоо үчүн Google аккаунту менен кириңиз',
    },
    dashboard: {
      welcome: 'Кош келиңиз',
      status: 'Статус',
      statusAdmin: 'Администратор',
      statusPremium: 'Premium',
      statusPending: 'Күтүүдө',
      statusFree: 'Акысыз',
      upgrade: 'Планды жогорулатуу',
      myPresentations: 'Менин презентацияларым',
      noPresentation: 'Азырынча презентация жок.',
      createFirst: 'Жогорудагы форм аркылуу биринчи презентацияңызды жасаңыз!',
      slides: 'слайд',
      delete: 'Өчүрүү',
    },
    form: {
      title: 'Жаңы презентация',
      subtitle: 'Теманы жазыңыз, AI калганын жасайт',
      placeholder:
        'Мисалы: Жасалма интеллекттин бизнеске таасири, Кыргызстандын тарыхы, Климаттын өзгөрүшү...',
      selectStyle: 'Визуалдык стилди тандаңыз',
      advancedSettings: 'Кошумча жөндөөлөр',
      slideCount: 'Слайддардын саны',
      apiKey: 'Gemini API Key (Милдеттүү эмес)',
      generate: 'Генерациялоо',
      generating: 'Генерациялоо...',
      notPremium: 'Презентация түзүү үчүн Premium жазылуу талап кылынат.',
      upgradePlan: 'Планды жогорулатуу',
      stepOutline: 'Слайддардын планы түзүлүүдө...',
      stepSlide: '{n}-слайд түзүлүүдө ({total} ичинен)...',
      stepSaving: 'Сакталууда...',
      signInToGenerate: 'Генерациялоо үчүн кирүү',
      errorServer: 'Сервер менен байланышта ката кетти',
      charCount: '{n} символ',
    },
    auth: {
      signIn: 'Google менен кирүү',
      signingIn: 'Кирүү...',
      needLogin: 'Кирүү талап кылынат',
      backToHome: 'Башкы бетке кайтуу',
    },
    common: {
      loading: 'Жүктөлүүдө...',
      error: 'Ката кетти',
      retry: 'Кайра аракет',
      cancel: 'Жокко чыгаруу',
      save: 'Сактоо',
      delete: 'Өчүрүү',
      edit: 'Түзөтүү',
      open: 'Ачуу',
      close: 'Жабуу',
      slides: 'слайд',
    },
    editor: {
      tabHome: 'Башкы',
      tabInsert: 'Вставить',
      tabDesign: 'Дизайн',
      tabView: 'Вид',
      insertText: 'Текст',
      insertImage: 'Сурот',
      insertShape: 'Фигура',
      insertFormula: 'Формула',
      insertCode: 'Код',
      insertIcon: 'Белги',
      insertVideo: 'Видео',
      bgColor: 'Түс',
      bgGradient: 'Градиент',
      bgImage: 'Сурот',
      zoom: 'Масштаб',
      grid: 'Тор',
      titleSize: 'Аталыш',
      titleColor: 'Аталыш түсү',
      textColor: 'Текст',
      elemBg: 'Фон',
      editHint: '2× = өзгөртүү',
      saving: 'Сакталууда...',
      saved: 'Сакталды',
      addSlide: 'Слайд',
      backHome: 'Башкы бет',
      slides: 'Слайддар',
      applyBgAll: 'Баардык слайдга колдонуу',
      customColor: 'Башка түс',
    },
  },
  ru: {
    nav: {
      brand: 'AI Slide',
      newPresentation: 'Новая презентация',
      recent: 'Недавние',
      noRecent: 'Нет презентаций',
      adminPanel: 'Панель Admin',
      signOut: 'Выйти',
      signIn: 'Войти',
      upgradeHint: 'Бесплатный пользователь',
      upgrade: 'Улучшить',
    },
    lang: {
      title: 'Выберите язык',
      ky: 'Кыргызский',
      ru: 'Русский',
      en: 'Английский',
      detectPrompt: 'Выберите язык интерфейса',
      autoDetected: 'Язык определён автоматически',
      save: 'Сохранить',
      change: 'Изменить язык',
    },
    home: {
      badge: 'Google Gemini AI',
      headline1: 'Создавайте',
      headlineGradient: 'блестящие презентации',
      headline2: 'за секунды',
      subtitle:
        'Напишите тему — Gemini AI автоматически подберёт содержимое, структуру и дизайн. Скачайте в формате PowerPoint или PDF.',
      ctaSignIn: 'Начать с Google',
      ctaLearnMore: 'Узнать больше',
      feature1Title: 'AI Генерация',
      feature1Desc:
        'Укажите тему — Gemini 1.5 Pro подберёт содержимое, структуру и дизайн.',
      feature2Title: '12 Современных шаблонов',
      feature2Desc:
        'Выберите из профессиональных шаблонов подходящий стиль.',
      feature3Title: 'Экспорт PPTX / PDF',
      feature3Desc:
        'Скачайте готовые слайды в формате PowerPoint или PDF одним нажатием.',
      signInPrompt: 'Войдите через Google, чтобы начать',
    },
    dashboard: {
      welcome: 'Добро пожаловать',
      status: 'Статус',
      statusAdmin: 'Администратор',
      statusPremium: 'Premium',
      statusPending: 'Ожидание',
      statusFree: 'Бесплатно',
      upgrade: 'Улучшить план',
      myPresentations: 'Мои презентации',
      noPresentation: 'Презентаций пока нет.',
      createFirst: 'Создайте первую презентацию с помощью формы выше!',
      slides: 'слайдов',
      delete: 'Удалить',
    },
    form: {
      title: 'Новая презентация',
      subtitle: 'Введите тему, AI сделает остальное',
      placeholder:
        'Например: Влияние ИИ на бизнес, История Кыргызстана, Изменение климата...',
      selectStyle: 'Выберите визуальный стиль',
      advancedSettings: 'Дополнительные настройки',
      slideCount: 'Количество слайдов',
      apiKey: 'Gemini API Key (Необязательно)',
      generate: 'Генерировать',
      generating: 'Генерируется...',
      notPremium: 'Для создания презентаций требуется Premium подписка.',
      upgradePlan: 'Улучшить план',
      stepOutline: 'Создаётся план слайдов...',
      stepSlide: 'Создаётся слайд {n} из {total}...',
      stepSaving: 'Сохраняется...',
      signInToGenerate: 'Войти для генерации',
      errorServer: 'Ошибка подключения к серверу',
      charCount: '{n} символов',
    },
    auth: {
      signIn: 'Войти с Google',
      signingIn: 'Вход...',
      needLogin: 'Требуется авторизация',
      backToHome: 'На главную',
    },
    common: {
      loading: 'Загрузка...',
      error: 'Произошла ошибка',
      retry: 'Повторить',
      cancel: 'Отмена',
      save: 'Сохранить',
      delete: 'Удалить',
      edit: 'Редактировать',
      open: 'Открыть',
      close: 'Закрыть',
      slides: 'слайдов',
    },
    editor: {
      tabHome: 'Главная',
      tabInsert: 'Вставить',
      tabDesign: 'Дизайн',
      tabView: 'Вид',
      insertText: 'Текст',
      insertImage: 'Изображение',
      insertShape: 'Фигура',
      insertFormula: 'Формула',
      insertCode: 'Код',
      insertIcon: 'Иконка',
      insertVideo: 'Видео',
      bgColor: 'Цвет',
      bgGradient: 'Градиент',
      bgImage: 'Изображение',
      zoom: 'Масштаб',
      grid: 'Сетка',
      titleSize: 'Заголовок',
      titleColor: 'Цвет заголовка',
      textColor: 'Текст',
      elemBg: 'Фон',
      editHint: '2× = редактировать',
      saving: 'Сохраняется...',
      saved: 'Сохранено',
      addSlide: 'Слайд',
      backHome: 'Главная',
      slides: 'Слайды',
      applyBgAll: 'Применить ко всем',
      customColor: 'Другой цвет',
    },
  },
  en: {
    nav: {
      brand: 'AI Slide',
      newPresentation: 'New Presentation',
      recent: 'Recent',
      noRecent: 'No presentations yet',
      adminPanel: 'Admin Panel',
      signOut: 'Sign Out',
      signIn: 'Sign In',
      upgradeHint: 'Free user',
      upgrade: 'Upgrade',
    },
    lang: {
      title: 'Select Language',
      ky: 'Kyrgyz',
      ru: 'Russian',
      en: 'English',
      detectPrompt: 'Choose your interface language',
      autoDetected: 'Language auto-detected',
      save: 'Save',
      change: 'Change Language',
    },
    home: {
      badge: 'Google Gemini AI',
      headline1: 'Create stunning',
      headlineGradient: 'professional slides',
      headline2: 'in seconds',
      subtitle:
        'Enter your topic — Gemini AI automatically crafts the content, structure, and design. Download as PowerPoint or PDF.',
      ctaSignIn: 'Get Started with Google',
      ctaLearnMore: 'Learn More',
      feature1Title: 'AI Generation',
      feature1Desc:
        'Give a topic — Gemini 1.5 Pro creates the content, structure, and design.',
      feature2Title: '12 Modern Templates',
      feature2Desc:
        'Choose from professional templates the perfect style for your presentation.',
      feature3Title: 'PPTX / PDF Export',
      feature3Desc:
        'Download ready slides as PowerPoint or PDF with one click.',
      signInPrompt: 'Sign in with Google to get started',
    },
    dashboard: {
      welcome: 'Welcome',
      status: 'Status',
      statusAdmin: 'Administrator',
      statusPremium: 'Premium',
      statusPending: 'Pending',
      statusFree: 'Free',
      upgrade: 'Upgrade Plan',
      myPresentations: 'My Presentations',
      noPresentation: 'No presentations yet.',
      createFirst: 'Create your first presentation using the form above!',
      slides: 'slides',
      delete: 'Delete',
    },
    form: {
      title: 'New Presentation',
      subtitle: 'Enter a topic, AI does the rest',
      placeholder:
        'E.g.: The impact of AI on business, History of Kyrgyzstan, Climate change...',
      selectStyle: 'Choose a visual style',
      advancedSettings: 'Advanced Settings',
      slideCount: 'Slide Count',
      apiKey: 'Gemini API Key (Optional)',
      generate: 'Generate',
      generating: 'Generating...',
      notPremium: 'A Premium subscription is required to create presentations.',
      upgradePlan: 'Upgrade Plan',
      stepOutline: 'Creating slide outline...',
      stepSlide: 'Creating slide {n} of {total}...',
      stepSaving: 'Saving...',
      signInToGenerate: 'Sign In to Generate',
      errorServer: 'Server connection error',
      charCount: '{n} characters',
    },
    auth: {
      signIn: 'Sign in with Google',
      signingIn: 'Signing in...',
      needLogin: 'Login Required',
      backToHome: 'Back to Home',
    },
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      open: 'Open',
      close: 'Close',
      slides: 'slides',
    },
    editor: {
      tabHome: 'Home',
      tabInsert: 'Insert',
      tabDesign: 'Design',
      tabView: 'View',
      insertText: 'Text',
      insertImage: 'Image',
      insertShape: 'Shape',
      insertFormula: 'Formula',
      insertCode: 'Code',
      insertIcon: 'Icon',
      insertVideo: 'Video',
      bgColor: 'Color',
      bgGradient: 'Gradient',
      bgImage: 'Image',
      zoom: 'Zoom',
      grid: 'Grid',
      titleSize: 'Title',
      titleColor: 'Title Color',
      textColor: 'Text',
      elemBg: 'Background',
      editHint: '2× = edit',
      saving: 'Saving...',
      saved: 'Saved',
      addSlide: 'Slide',
      backHome: 'Home',
      slides: 'Slides',
      applyBgAll: 'Apply to all slides',
      customColor: 'Custom color',
    },
  },
} as const

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }

function getNestedValue(obj: any, keys: string[]): string {
  let curr = obj
  for (const key of keys) {
    curr = curr?.[key]
    if (curr === undefined) return ''
  }
  return typeof curr === 'string' ? curr : ''
}

export function createT(lang: Language) {
  return (path: string, vars?: Record<string, string | number>): string => {
    const keys = path.split('.')
    let value = getNestedValue(translations[lang], keys)
    if (!value) value = getNestedValue(translations['ky'], keys)
    if (!value) return path
    if (vars) {
      return Object.entries(vars).reduce(
        (str, [k, v]) => str.replaceAll(`{${k}}`, String(v)),
        value
      )
    }
    return value
  }
}

export function detectBrowserLanguage(): Language {
  if (typeof navigator === 'undefined') return 'ky'
  const browserLang = navigator.language.split('-')[0].toLowerCase()
  if (SUPPORTED_LANGUAGES.includes(browserLang as Language)) {
    return browserLang as Language
  }
  return 'ky'
}
