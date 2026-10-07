# GARAGE — веб-сервис для автовладельцев (standalone)

Полный MVP в трёх файлах: Главная (онбординг по VIN), Дашборд «Мой гараж»,
Дневник расходов, Подбор запчастей, Профиль. Тёмная тема по умолчанию + светлая (переключатель 🌙/☀️ в шапке).

## Запуск
Просто открой index.html в браузере. Никакой установки не нужно.

Или через локальный сервер:
  python3 -m http.server 8000
  http://localhost:8000

## Файлы
- index.html  — разметка + подключение стилей/скрипта + анти-фликс темы
- styles.css  — дизайн-система Modern Card UI (CSS-переменные, тёмная/светлая темы)
- script.js   — вся логика: роутинг, localStorage, VIN-декодер, графики, модалки

## Как загрузить на GitHub
1. github.com → New repository → имя garage → БЕЗ галочки README → Create
2. Add file → Upload files → перетащи СОДЕРЖИМОЕ этой папки (index.html, styles.css, script.js, README.md)
3. Commit changes → готово

## Деплой (живая ссылка)
vercel.com → войти через GitHub → Add New Project → Import репозиторий garage → Deploy.
