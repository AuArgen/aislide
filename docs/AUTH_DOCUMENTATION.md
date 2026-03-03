# Авторизация жана Ролдорду Башкаруу - Техникалык Документация

## 📋 Мазмуну
- [Системанын Структурасы](#системанын-структурасы)
- [Авторизация Логикасы](#авторизация-логикасы)
- [Роль жана Подписка Текшерүү](#роль-жана-подписка-текшерүү)
- [Environment Variables](#environment-variables)
- [Интеграция Көрсөтмөлөрү](#интеграция-көрсөтмөлөрү)
- [Коопсуздук](#коопсуздук)

---

## 🏗 Системанын Структурасы

Система 3 негизги файлдан турат:

1. **`auth.php`** - Google OAuth авторизациясы жана JWT токен иштетүү
2. **`auth/success/index.php`** - OAuth callback redirect handler
3. **`add_theme.php`** - Ролдорду башкаруу жана контентке мүмкүнчүлүктөрдү текшерүү

### Файлдардын Ролдору:

```
/project-root/
├── auth.php                    # Негизги авторизация логикасы
├── auth/
│   └── success/
│       └── index.php          # OAuth callback redirect
└── add_theme.php              # Роль текшерүү жана контент башкаруу
```

---

## 🔐 Авторизация Логикасы

### 1. Авторизация Процесси (`auth.php`)

#### 1.1 OAuth Callback Handler (`auth/success/index.php`)

Бул файл Google OAuth'тан токенди кабыл алып, `auth.php`га redirect кылат.

**Файл жайгашкан жери:** `/auth/success/index.php`

```php
<?php
$tokenStr = $_GET['token'] ?? '';
if (empty($tokenStr)) {
    http_response_code(400);
    echo json_encode(["error" => "token is required"]);
    exit;
}

header("Location: /auth.php?token=$tokenStr");
?>
```

**Иштөө принциби:**

1. **Token алуу:** URL'дан `token` параметрин алат
   ```
   GET /auth/success/?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **Validation:** Token бош болбошу керек
   - ❌ Эгер бош болсо → 400 Error
   - ✅ Эгер бар болсо → Кийинки кадамга

3. **Redirect:** Tokenди `auth.php`га жөнөтөт
   ```
   Location: /auth.php?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

**Максаты:**
- OAuth callback URL катары иштейт
- Token validation (бош эмес экенин текшерет)
- Негизги auth handler'га redirect кылат

**Google OAuth Configuration:**
```
Authorized redirect URI: https://your-domain.com/auth/success/
```

#### 1.2 Session Башталышы (`auth.php`)
```php
session_start();
require_once 'db.php';
```
- PHP session башталат (колдонуучу маалыматын сактоо үчүн)
- Маалымат базасына туташуу

#### 1.3 Авторизацияны Текшерүү Функциялары

##### `isLoggedIn()`
```php
function isLoggedIn() {
    return isset($_SESSION['user']);
}
```
**Максаты:** Колдонуучу системага кирген же жокко текшерет
**Кайтаруучу маани:** `true` же `false`

##### `requireAuth()`
```php
function requireAuth() {
    if (!isLoggedIn()) {
        $authUrl = getenv('AUTH_SERVICE_URL') ?: 'http://localhost:8080/auth/google/login';
        header("Location: $authUrl");
        exit;
    }
}
```
**Максаты:** Колдонуучу системага кирбесе, авторизация сервисине багыттайт
**Параметрлер:** жок
**Иштөө тартиби:**
1. `isLoggedIn()` аркылуу текшерет
2. Эгер жок болсо → AUTH_SERVICE_URL'га redirect кылат
3. Процессти токтотот (`exit`)

#### 1.4 JWT Token Иштетүү

##### Token Callback (`auth.php?token=...`)

Бул блок `/auth/success/` redirect кылгандан кийин иштейт.

```php
$tokenStr = $_GET['token'] ?? '';
if (!empty($tokenStr)) {
    // 1. Token форматын текшерүү
    $parts = explode('.', $tokenStr);
    if (count($parts) != 3) {
        http_response_code(400);
        echo json_encode(["error" => "invalid token format"]);
        exit;
    }

    // 2. JWT payload декодирлөө
    $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);

    // 3. Колдонуучу маалыматын чыгаруу
    $user = [
        'user_id' => $payload['user_id'] ?? 0,
        'google_id' => $payload['google_id'] ?? '',
        'name' => $payload['name'] ?? '',
        'email' => $payload['email'] ?? '',
        'role' => $payload['role'] ?? 'user'
    ];

    // 4. Маалымат базага сактоо/жаңыртуу
    $stmt = $pdo->prepare("INSERT INTO users (user_id, google_id, name, email, role)
                           VALUES (:user_id, :google_id, :name, :email, :role)
                           ON CONFLICT (user_id) DO UPDATE
                           SET name = EXCLUDED.name, email = EXCLUDED.email, role = EXCLUDED.role");
    $stmt->execute($user);

    // 5. Session'га сактоо
    $_SESSION['user'] = $user;

    // 6. Башкы бетке багыттоо
    header("Location: /");
    exit;
}
```

**JWT Token Структурасы:**
```
Header.Payload.Signature
```

**Payload'до болушу керек маалымат:**
```json
{
  "user_id": 12345,
  "google_id": "google_user_id_string",
  "name": "User Name",
  "email": "user@example.com",
  "role": "user"
}
```

---

## 👥 Роль жана Подписка Текшерүү

### 2. Тышкы API аркылуу Ролду Текшерүү (`add_theme.php`)

#### 2.1 `checkExternalRole()` Функциясы

```php
function checkExternalRole($googleId) {
    // Environment variables
    $externalApiUrl = getenv('EXTERNAL_CHECK_USER_URL');
    $apiKey = getenv('EXTERNAL_API_KEY');

    // Default маанилер
    $userRole = 'USER';
    $subExpiresAt = null;

    // Validation
    if (empty($externalApiUrl) || empty($googleId)) {
        error_log("External API URL or Google ID is not set.");
        return ['role' => $userRole, 'expires_at' => $subExpiresAt];
    }
```

**Параметрлер:**
- `$googleId` (string|null) - Колдонуучунун Google ID'си

**Кайтаруучу маани:**
```php
[
    'role' => 'USER|TEACHER|ADMIN',
    'expires_at' => '2024-12-31 23:59:59' // же null
]
```

#### 2.2 API Request

```php
$requestUrl = $externalApiUrl . '?google_id=' . urlencode($googleId);

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $requestUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_TIMEOUT, 2); // 2 секунд timeout

$headers = [];
if (!empty($apiKey)) {
    $headers[] = 'X-API-Key: ' . $apiKey;
}
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
```

**Күтүлүүчү API Response формат:**
```json
{
  "role": "Administrator" | "ADMIN" | "user",
  "subscriptions": [
    {
      "is_active": true,
      "expires_at": "2024-12-31T23:59:59Z"
    }
  ]
}
```

#### 2.3 Роль Аныктоо Логикасы

```php
if ($httpCode == 200) {
    $extUser = json_decode($response, true);

    // 1. ADMIN роль текшерүү (приоритеттүү)
    if (isset($extUser['role']) &&
        (strtoupper($extUser['role']) === 'Administrator' ||
         strtoupper($extUser['role']) === 'ADMIN')) {
        $userRole = 'ADMIN';
    }
    // 2. Активдүү подписка текшерүү
    else {
        if (isset($extUser['subscriptions']) && is_array($extUser['subscriptions'])) {
            foreach ($extUser['subscriptions'] as $sub) {
                if (isset($sub['is_active'], $sub['expires_at']) && $sub['is_active']) {
                    $expiresDate = new DateTime($sub['expires_at']);
                    if ($expiresDate > new DateTime()) {
                        $userRole = 'TEACHER';
                        $subExpiresAt = $expiresDate->format('Y-m-d H:i:s');
                        break; // Биринчи активдүү подписканы алат
                    }
                }
            }
        }
    }
}
```

**Роль Приоритети:**
1. **ADMIN** - Эгер role === 'Administrator' же 'ADMIN'
2. **TEACHER** - Эгер активдүү подписка бар жана убактысы өтө элек
3. **USER** - Default (эч нерсе болбосо)

#### 2.4 Session Cache

```php
// Session'да бир жолу текшерилет
if (!isset($_SESSION['user_role'])) {
    $googleId = $_SESSION['user']['google_id'] ?? null;
    $roleInfo = checkExternalRole($googleId);
    $_SESSION['user_role'] = $roleInfo['role'];
    $_SESSION['subscription_expires_at'] = $roleInfo['expires_at'];
}
```

**Артыкчылыктары:**
- ✅ Ар бир request'те API'ге чакырбайт
- ✅ Performance жакшыраат
- ✅ Тышкы серверге жүк азаят

#### 2.5 Мүмкүнчүлүктөрдү Текшерүү

```php
$canManageContent = in_array($_SESSION['user_role'], ['ADMIN', 'TEACHER']);

// POST request'терди блоктоо
if ($_SERVER['REQUEST_METHOD'] === 'POST' && !$canManageContent) {
    $_SESSION['flash_message'] = 'Темаларды башкаруу үчүн жазылууңуз активдүү болушу керек.';
    header("Location: add_theme.php");
    exit;
}
```

**Кимге мүмкүнчүлүк бар:**
- ✅ **ADMIN** - Баарын кошо жана өзгөртө алат
- ✅ **TEACHER** - Баарын кошо жана өзгөртө алат
- ❌ **USER** - Көрө алат, бирок кошо албайт

---

## 🔧 Environment Variables

### Керектүү Environment Variable'дар:

```bash
# 1. AUTH SERVICE URL
AUTH_SERVICE_URL=http://localhost:8080/auth/google/login
```
**Максаты:** Google OAuth авторизация сервисинин URL'и
**Колдонулушу:** `auth.php:14` - Колдонуучу кирбесе бул URL'га redirect
**Default:** `http://localhost:8080/auth/google/login`

```bash
# 2. EXTERNAL API URL
EXTERNAL_CHECK_USER_URL=https://api.example.com/check-user
```
**Максаты:** Колдонуучунун роль жана подписка статусун текшерүү API'си
**Колдонулушу:** `add_theme.php:15` - Тышкы серверден роль алуу
**Query Parameter:** `?google_id={user_google_id}`
**Формат:** `https://your-api.com/check-user`

```bash
# 3. API KEY
EXTERNAL_API_KEY=your_secret_api_key_here
```
**Максаты:** Тышкы API'ге кирүү ачкычы
**Колдонулушу:** `add_theme.php:16` - HTTP Header'де жөнөтүлөт
**Header Name:** `X-API-Key`
**Коопсуздук:** Бул ачкыч сырдуу болушу керек!

### Environment Variable'дарды орнотуу

#### Docker Compose үчүн:
```yaml
services:
  app:
    environment:
      - AUTH_SERVICE_URL=http://auth-service:8080/auth/google/login
      - EXTERNAL_CHECK_USER_URL=https://api.example.com/check-user
      - EXTERNAL_API_KEY=secret_key_123
```

#### .env файылы үчүн:
```bash
# .env
AUTH_SERVICE_URL=http://localhost:8080/auth/google/login
EXTERNAL_CHECK_USER_URL=https://api.example.com/check-user
EXTERNAL_API_KEY=your_secret_api_key
```

#### Apache/Nginx үчүн:
```apache
# Apache
SetEnv AUTH_SERVICE_URL "http://localhost:8080/auth/google/login"
SetEnv EXTERNAL_CHECK_USER_URL "https://api.example.com/check-user"
SetEnv EXTERNAL_API_KEY "secret_key"
```

---

## 🚀 Интеграция Көрсөтмөлөрү

### Башка Проектке Интеграциялоо

#### 1-Кадам: Файлдарды көчүрүү

```bash
# Керектүү файлдар
/your-project/
├── auth.php                 # JWT авторизация
├── auth/
│   └── success/
│       └── index.php       # OAuth callback handler
├── add_theme.php           # Роль текшерүү логикасы
└── db.php                  # Маалымат база туташуусу
```

#### 2-Кадам: Маалымат Базаны туура орнотуу

```sql
-- users таблицасы
CREATE TABLE users (
    user_id INTEGER PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- themes таблицасы (add_theme.php үчүн)
CREATE TABLE themes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3-Кадам: Код Интеграциясы

##### Авторизацияны талап кылган бет:
```php
<?php
require_once 'auth.php';
requireAuth(); // Колдонуучу кирбесе redirect

// Азыр $_SESSION['user'] маалыматы бар
$userName = $_SESSION['user']['name'];
$userEmail = $_SESSION['user']['email'];
?>
```

##### Роль менен мүмкүнчүлүктү текшерүү:
```php
<?php
require_once 'auth.php';
requireAuth();

// checkExternalRole функциясын импорттоо
require_once 'add_theme.php'; // же функцияны көчүрүп алуу

// Роль текшерүү
if (!isset($_SESSION['user_role'])) {
    $googleId = $_SESSION['user']['google_id'] ?? null;
    $roleInfo = checkExternalRole($googleId);
    $_SESSION['user_role'] = $roleInfo['role'];
    $_SESSION['subscription_expires_at'] = $roleInfo['expires_at'];
}

$canEdit = in_array($_SESSION['user_role'], ['ADMIN', 'TEACHER']);

if (!$canEdit) {
    die("Сизде бул операцияны жасоого мүмкүнчүлүк жок!");
}
?>
```

#### 4-Кадам: Auth Service Backend

Авторизация сервисиңиз төмөнкү JWT tokenди кайтарышы керек:

```go
// Go Example
type JWTPayload struct {
    UserID   int    `json:"user_id"`
    GoogleID string `json:"google_id"`
    Name     string `json:"name"`
    Email    string `json:"email"`
    Role     string `json:"role"`
}

func handleAuthCallback(w http.ResponseWriter, r *http.Request) {
    // ... Google OAuth логика ...

    token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
        "user_id":   user.ID,
        "google_id": user.GoogleID,
        "name":      user.Name,
        "email":     user.Email,
        "role":      "user",
        "exp":       time.Now().Add(24 * time.Hour).Unix(),
    })

    tokenString, _ := token.SignedString([]byte("your-secret-key"))

    // ВАЖНО: /auth/success/ endpoint'ине redirect кылуу керек
    redirectURL := fmt.Sprintf("http://your-php-app.com/auth/success/?token=%s", tokenString)
    http.Redirect(w, r, redirectURL, 302)
}
```

**Google Cloud Console Configuration:**
```
Authorized redirect URIs:
- http://localhost:8080/auth/google/callback  (Backend callback)

PHP Frontend redirect:
- http://your-php-app.com/auth/success/       (Frontend callback)
```

**Redirect Chain:**
```
1. Google OAuth → http://localhost:8080/auth/google/callback
2. Backend → http://your-php-app.com/auth/success/?token=JWT
3. Success Handler → http://your-php-app.com/auth.php?token=JWT
4. Auth.php → http://your-php-app.com/ (home)
```

#### 5-Кадам: External API Backend

Роль текшерүү API'си:

```go
// Go Example
type Subscription struct {
    IsActive  bool      `json:"is_active"`
    ExpiresAt time.Time `json:"expires_at"`
}

type UserCheckResponse struct {
    Role          string         `json:"role"`
    Subscriptions []Subscription `json:"subscriptions"`
}

func checkUserHandler(w http.ResponseWriter, r *http.Request) {
    // API Key текшерүү
    apiKey := r.Header.Get("X-API-Key")
    if apiKey != os.Getenv("INTERNAL_API_KEY") {
        http.Error(w, "Unauthorized", 401)
        return
    }

    googleID := r.URL.Query().Get("google_id")
    if googleID == "" {
        http.Error(w, "google_id required", 400)
        return
    }

    // Маалымат базадан алуу
    user := getUserByGoogleID(googleID)

    response := UserCheckResponse{
        Role:          user.Role,
        Subscriptions: user.Subscriptions,
    }

    json.NewEncoder(w).Encode(response)
}
```

---

## 🛡 Коопсуздук

### 1. JWT Token Коопсуздугу

**Азыркы код:**
```php
// ⚠️ WARNING: Verification жок!
$payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);
```

**Сунушталат (Production үчүн):**
```php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$secretKey = getenv('JWT_SECRET_KEY');
try {
    $payload = JWT::decode($tokenStr, new Key($secretKey, 'HS256'));
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(["error" => "invalid token"]);
    exit;
}
```

### 2. API Key Коопсуздугу

```php
// ✅ Environment variable'дан алуу
$apiKey = getenv('EXTERNAL_API_KEY');

// ❌ Кодго жазбоо
// $apiKey = "hardcoded_key_123"; // ТУУРА ЭМЕС!
```

### 3. SQL Injection Protection

```php
// ✅ Prepared Statements колдонуу
$stmt = $pdo->prepare("SELECT * FROM users WHERE google_id = :google_id");
$stmt->execute(['google_id' => $googleId]);

// ❌ String concatenation
// $query = "SELECT * FROM users WHERE google_id = '$googleId'"; // ТУУРА ЭМЕС!
```

### 4. Session Коопсуздугу

```php
// php.ini же код башында
ini_set('session.cookie_httponly', 1);  // XSS коргоо
ini_set('session.cookie_secure', 1);    // HTTPS керек
ini_set('session.cookie_samesite', 'Strict'); // CSRF коргоо
```

### 5. Error Handling

```php
// ✅ Production'до error'лорду жашыруу
error_reporting(0);
ini_set('display_errors', 0);

// ✅ Log'го жазуу
error_log("API Error: " . $error);

// ❌ Колдонуучуга сырларды көрсөтпөө
// echo "Database password: $dbPassword"; // ТУУРА ЭМЕС!
```

---

## 📊 Flow Диаграммалар

### Авторизация Flow

```
[Колдонуучу] → [requireAuth()]
                    ↓
          Session бар беле?
                    ↓
          Жок ← [AUTH_SERVICE_URL redirect]
                    ↓
          [Google OAuth Login]
                    ↓
          [Backend JWT token түзөт]
                    ↓
          [/auth/success/?token=xxx redirect]
                    ↓
          [Token validation (бош эмес беле?)]
                    ↓
          [/auth.php?token=xxx redirect]
                    ↓
          [Token decode (JWT parts check)]
                    ↓
          [Payload extract (user data)]
                    ↓
          [DB'га сактоо (INSERT/UPDATE)]
                    ↓
          [Session орнотуу ($_SESSION['user'])]
                    ↓
          [Башкы бетке redirect (Location: /)]
```

**Детальдуу Flow:**

1. **Колдонуучу барактан кирүүгө аракеттенет** → `requireAuth()` чакырылат
2. **Session текшерүү** → Эгер `$_SESSION['user']` жок болсо
3. **Auth Service'ге redirect** → `http://auth-service:8080/auth/google/login`
4. **Google OAuth** → Колдонуучу Google аркылуу логин кылат
5. **Backend JWT түзөт** → Go server токен генерациялайт
6. **Callback redirect** → `https://your-app.com/auth/success/?token=JWT_TOKEN`
7. **Success handler** → Token бош эмес экенин текшерет
8. **Auth.php redirect** → `/auth.php?token=JWT_TOKEN`
9. **JWT Processing** → Token decode жана маалыматты сактоо
10. **Session Setup** → `$_SESSION['user']` орнотулат
11. **Final Redirect** → Башкы бетке багыттайт

### Роль Текшерүү Flow

```
[Колдонуучу] → [add_theme.php]
                    ↓
          Session'да роль бар беле?
                    ↓
          Жок ← [checkExternalRole()]
                    ↓
          [EXTERNAL_CHECK_USER_URL?google_id=...]
                    ↓
          [API Response]
                    ↓
     ┌──────────────┼──────────────┐
     ↓              ↓              ↓
  ADMIN       TEACHER          USER
     ↓              ↓              ↓
  Full       Full Access    Read Only
  Access
```

---

## 🎯 AI Колдонуу Үчүн Жалпы Структура

### Prompt Template

```
Төмөнкү авторизация системасын колдонуп, [ФУНКЦИЯ] жаратыңыз:

Environment Variables:
- AUTH_SERVICE_URL: Google OAuth авторизация сервиси
- EXTERNAL_CHECK_USER_URL: Роль текшерүү API
- EXTERNAL_API_KEY: API'ге кирүү ачкычы

Rollery:
- ADMIN: Толук мүмкүнчүлүк
- TEACHER: Контентти башкарууга мүмкүнчүлүк (активдүү подписка)
- USER: Көрүү гана (подписка жок)

Керектүү файлдар:
require_once 'auth.php';     // Авторизация текшерүү
require_once 'add_theme.php'; // Роль текшерүү

Код:
requireAuth(); // Кирүүнү талап кылат

// Роль алуу
if (!isset($_SESSION['user_role'])) {
    $googleId = $_SESSION['user']['google_id'] ?? null;
    $roleInfo = checkExternalRole($googleId);
    $_SESSION['user_role'] = $roleInfo['role'];
}

$canEdit = in_array($_SESSION['user_role'], ['ADMIN', 'TEACHER']);
```

---

## 📝 Changelog

- **v1.1** (2024-02-28): OAuth Callback Handler кошулду
  - `/auth/success/index.php` файылы документацияланды
  - Redirect chain толук түшүндүрүлдү
  - Google OAuth Configuration кошулду
  - Flow диаграммалар жаңыртылды

- **v1.0** (2024-02-28): Биринчи документация
  - JWT авторизация логикасы
  - Роль жана подписка текшерүү
  - Environment variables
  - Коопсуздук сунуштары

---

## 📧 Колдоо

Суроолор же көйгөйлөр болсо:
- GitHub Issues: [repository-link]
- Email: support@example.com

---

**© 2024 - Авторизация Системасы Документациясы**
