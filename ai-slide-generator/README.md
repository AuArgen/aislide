# 🎨 AI Slide Generator

AI жардамы менен кесипкөй презентацияларды жөнөкөй жана тез түзүү платформасы.

## 📋 Мүмкүнчүлүктөр

- ✅ **Google OAuth авторизациясы** - Supabase аркылуу коопсуз кирүү
- ✅ **Роль-база башкаруу (RBAC)** - Admin, Teacher, User ролдору
- ✅ **AI слайд генерация** - Google Gemini 1.5 Pro/Flash колдонуу
- ✅ **Төлөм системасы** - QR-код менен төлөө жана админ тастыктоосу
- ✅ **Слайд редактору** - Интерактивдүү түзөтүү мүмкүнчүлүгү
- ✅ **Экспорт** - PowerPoint жана PDF форматында жүктөө
- ✅ **Адаптивдүү дизайн** - Мобилдик телефондордо кыйла иштейт

## 🛠 Технологиялык Стек

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS 4 (заманбап ак дизайн)
- **Маалымат базасы:** Supabase (PostgreSQL + Auth)
- **State Management:** Zustand
- **Валидация:** Zod
- **AI:** Google Gemini 1.5 API
- **Export:** PptxGenJS, Puppeteer

## 📁 Проект Структурасы

```
ai-slide-generator/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── auth/              # Авторизация баракчалары
│   │   ├── admin/             # Админ панель
│   │   ├── dashboard/         # Колдонуучу баракчасы
│   │   ├── editor/            # Слайд редактору
│   │   └── page.tsx           # Башкы бет
│   ├── components/            # React компоненттер
│   │   ├── shared/           # Жалпы UI (Button, Card, Modal)
│   │   ├── editor/           # Редактор компоненттери
│   │   ├── admin/            # Админ компоненттери
│   │   └── user/             # Колдонуучу компоненттери
│   ├── lib/                   # Утилиттер жана логика
│   │   ├── supabase/         # Supabase конфигурациясы
│   │   ├── gemini/           # Gemini API логикасы
│   │   └── auth/             # Авторизация жардамчылар
│   ├── store/                 # Zustand дүкөндөрү
│   ├── types/                 # TypeScript типтери
│   └── middleware.ts          # Route коргоо
├── public/                    # Статикалык файлдар
├── docs/                      # Долбоор документациясы
└── supabase_schema.sql       # Маалымат база схемасы
```

## 🚀 Орнотуу жана Баштоо

### 1. Репозиторийди клондоо

```bash
git clone <repository-url>
cd ai-slide-generator
```

### 2. Зависимосттарды орнотуу

```bash
npm install
```

### 3. Environment Variables орнотуу

`.env.local` файлын түзүңүз:

```bash
cp .env.local.example .env.local
```

Төмөнкү маалыматтарды толтуруңуз:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# External Role Check API (опционалдуу)
EXTERNAL_CHECK_USER_URL=https://api.example.com/check-user
EXTERNAL_API_KEY=your_external_api_key

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Supabase орнотуу

1. [Supabase](https://supabase.com) дан долбоор түзүңүз
2. SQL Editor'дон `supabase_schema.sql` файлын иштетиңиз
3. Authentication > Providers бөлүмүндөн Google OAuth'ту активдештириңиз
4. Google Cloud Console'дон OAuth credentials түзүңүз

### 5. Долбоорду иштетүү

#### Development режимде:

```bash
npm run dev
```

Браузерде [http://localhost:3000](http://localhost:3000) ачыңыз

#### Production build:

```bash
npm run build
npm start
```

## 📊 Маалымат Базасы Схемасы

### Таблицалар:

- **users** - Колдонуучулар маалыматы (Google ID, email, role)
- **subscriptions** - Подписка статусу жана төлөм маалыматы
- **presentations** - Презентациялар жана слайддар
- **settings** - Системалык настройкалар (API ачкычтары, төлөм маалыматтары)
- **notifications** - Билдирүүлөр тарыхы

### Ролдор:

- **USER** - Көрүү гана (Free tier)
- **TEACHER** - Слайддарды түзүү жана түзөтүү (Premium подписка)
- **ADMIN** - Системаны толук башкаруу

## 🔐 Авторизация жана Коопсуздук

- Google OAuth аркылуу коопсуз кирүү
- JWT токендер колдонуу
- Row Level Security (RLS) маалымат базада
- Middleware аркылуу route коргоо
- Session cache менен оптимизация

## 📝 Кийинки Кадамдар

Төмөнкү функционалдуулуктар али иштелип жатат:

- [ ] Админ панель баракчалары
- [ ] Колдонуучу төлөм интерфейси
- [ ] Gemini AI интеграциясы
- [ ] Слайд редактору
- [ ] PowerPoint/PDF экспорт
- [ ] Telegram билдирүүлөр

## 📚 Документация

Толук документацияны `docs/` папкасынан карай аласыз:

- [Техникалык План](../docs/plan.md)
- [Базалык Структура](../docs/base_structure.md)
- [Админ Панель](../docs/admin_panel.md)
- [Колдонуучу Баракчасы](../docs/user_dashboard.md)
- [Авторизация](../docs/AUTH_DOCUMENTATION.md)

## 🤝 Колдоо

Суроолор же көйгөйлөр болсо:
- GitHub Issues аркылуу маселени билдириңиз
- Документацияны карап чыгыңыз

## 📄 License

MIT License

---

**© 2024 - AI Slide Generator**
