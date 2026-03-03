# 📄 ТЖ 1: Базалык Структура жана Инфраструктура

Бул документ долбоордун негизги техникалык пайдубалын жана архитектурасын аныктайт.

### 1. Технологиялык Стек
- **Framework:** Next.js 14+ (App Router).
- **Стилдер:** Tailwind CSS + Shadcn/UI (Ак фондо, заманбап жана адаптивдүү дизайн).
- **Маалымат базасы:** Supabase (PostgreSQL).
- **AI:** Google Gemini 1.5 API.
- **State Management:** Zustand.
- **Валидация:** Zod.

### 2. Дизайн Концепциясы
- **Түстөр:** Негизинен ак фон (#FFFFFF), минималисттик кара текст жана боз түстөгү деталдар. Акцент үчүн бир ачык түс (мисалы, Indigo же Blue).
- **Адаптивдүүлүк:** Мобилдик телефондордон баштап чоң мониторлорго чейин толук ыңгайлашкан (Mobile-first).
- **Стиль:** Заманбап "Clean Minimalist" стили.

### 3. Проекттин Папка Түзүлүшү
Бардык проекттин файлдары `docs` папкасынын ичинде жайгашат.
```plaintext
docs/
├── src/
│   ├── app/                # Next.js App Router (auth, dashboard, admin, edit)
│   ├── components/
│   │   ├── shared/         # Common UI (Button, Modal, Card)
│   │   ├── editor/         # Слайд редакторунун компоненттери
│   │   ├── admin/          # Админ панелдин компоненттери
│   │   └── user/           # Колдонуучунун компоненттери
│   ├── lib/
│   │   ├── supabase/       # Supabase конфигурациясы
│   │   ├── gemini/         # Gemini API логикасы
│   │   └── utils.ts        # Жардамчы функциялар
│   ├── store/              # Zustand дүкөндөрү
│   └── types/              # TypeScript интерфейстери
├── public/                 # Статикалык файлдар (QR-коддор, сүрөттөр)
└── ... (конфигурациялык файлдар: next.config.js, tailwind.config.js ж.б.)
```

### 4. Негизги Маалымат Базасы (Schema)
- `users`: id (uuid), google_id (text), email, full_name, avatar_url, role (enum: 'user', 'teacher', 'admin'), created_at, last_login.
- `subscriptions`: id (uuid), user_id, plan_type (free/premium), status (active/pending/expired/rejected), start_date, end_date, payment_proof_url (чек үчүн шилтеме), expires_at (timestamp).
- `presentations`: id (uuid), user_id, title, theme, slides (JSONB), created_at.
- `settings`: key (Gemini_Key, Admin_QR_Code, Admin_Card_Number, External_Check_URL, External_API_Key, etc.), value.
- `notifications`: id (uuid), user_id, message, type (info/success/error/payment), is_read, created_at.

### 5. Авторизация жана Ролдорду Башкаруу (Logic)
Бул бөлүм `AUTH_DOCUMENTATION.md` файлындагы талаптарды эске алуу менен түзүлдү:
- **Provider:** Google OAuth (Supabase Auth аркылуу).
- **JWT Handling:** Supabase тарабынан берилген JWT токендерин колдонуу.
- **Role Verification (RBAC):**
    - **ADMIN:** Системанын бардык жөндөөлөрүнө жана колдонуучуларына толук мүмкүнчүлүк.
    - **TEACHER:** Контентти башкарууга жана түзүүгө мүмкүнчүлүк (активдүү подпискасы бар колдонуучулар).
    - **USER:** Көрүү гана мүмкүнчүлүгү (активдүү подпискасы жок колдонуучулар).
- **External Role Check:** 
    - Система `EXTERNAL_CHECK_USER_URL` аркылуу колдонуучунун тышкы статусун текшере алат.
    - Текшерүү үчүн `X-API-Key` колдонулат.
- **Middleware:** `/admin/*` жана премиум функцияларга кирүүдө ролдорду жана подписканын мөөнөтүн (`expires_at`) сервер тараптан текшерүү.
- **Cache:** Роль жана подписка маалыматтары сессия учурунда кэштелет (Zustand/Cookies), бирок маанилүү аракеттерде базадан кайра текшерилет.
