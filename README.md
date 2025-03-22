# Client-Flow

Простое и удобное веб-приложение для управления клиентами. Поддерживает создание, редактирование, фильтрацию и экспорт/импорт данных о клиентах в формате CSV. Работает как Progressive Web App (PWA), что позволяет устанавливать его на мобильные устройства и ПК.

![Скриншот приложения](https://i.ibb.co/WpFcQWnh/2025-03-21-064306.png)

## Возможности
- **Добавление и редактирование клиентов**: Указывайте имя, компанию, телефоны, соцсети, сайт, теги, дедлайны и заметки.
- **Фильтры и поиск**: Быстро находите клиентов по статусу, тегам, дате или имени.
- **Избранное**: Отмечайте важных клиентов.
- **Экспорт/импорт**: Сохраняйте данные в CSV и загружайте их обратно.
- **Заметки с форматированием**: Поддержка переносов строк в заметках.
- **График роста**: Визуализация новых клиентов по месяцам.
- **PWA**: Устанавливайте приложение на телефон или ПК, работайте офлайн.
- **Адаптивный дизайн**: Работает на любых устройствах.
- **Тёмная тема**: Переключайтесь между светлой и тёмной темой.

## Демо
Посмотрите работающую версию: [Client Flow](https://dev-geniy.github.io/Client-Flow/)

## Установка

1. **Склонируйте репозиторий**:
   ```bash
   git clone https://github.com/DevGeny/Client-Flow.git

2. **Откройте файл index.html в браузере**:
- Перетащите файл в браузер или используйте локальный сервер (например, Live Server в VS Code).

3. **Установите как приложение**:
- На мобильном устройстве: откройте сайт в Chrome (Android) или Safari (iOS) и выберите "Добавить на главный экран".
- На ПК: в Chrome/Edge выберите "Установить Client Flow" из меню.

## Использование
1. Нажмите кнопку "Добавить клиента", чтобы создать новую карточку.
2. Заполните данные: имя, заметки, теги и т.д.
3. Используйте фильтры и поиск для навигации.
4. Экспортируйте данные через кнопку "Экспорт" в боковой панели.
5. Импортируйте данные через "Импорт", загрузив ранее сохранённый CSV-файл.

## Требования
- Современный браузер (Chrome, Firefox, Edge, Safari).
- Подключение к интернету для первой загрузки (после установки работает офлайн).

## Структура проекта

   ```bash
Client-Flow/
├── index.html       # Главная страница
├── styles.css       # Стили приложения
├── script.js        # Логика приложения
├── sw.js            # Service Worker для PWA
├── manifest.json    # Манифест для PWA
├── favicon.png      # Иконка сайта
├── favicon-192x192.png  # Иконка для PWA
├── favicon-512x512.png  # Иконка для PWA
├── sitemap.xml      # Карта сайта для SEO
└── README.md        # Этот файл
   ```

## Зависимости
Chart.js — для построения графиков.
SortableJS — для drag-and-drop карточек.

## Лицензия
Этот проект распространяется под лицензией MIT (LICENSE). Вы можете свободно использовать, изменять и распространять код.

## Автор
Создано [DevGeny](https://github.com/Dev-Geniy/)

## Вклад
Если хотите улучшить проект:
Форкните репозиторий.
Создайте ветку для изменений (git checkout -b feature/имя-фичи).
Закоммитьте изменения (git commit -m "Добавлена новая фича").
Запушьте ветку (git push origin feature/имя-фичи).
Создайте Pull Request.

## Спасибо за использование Client Flow!
