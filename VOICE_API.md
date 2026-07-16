# Озвучка через OpenAI API

Ключ API не используется в браузере. GitHub Action один раз создаёт MP3 для русской, английской и польской версий, после чего GitHub Pages раздаёт их как обычные статические файлы.

1. В репозитории откройте `Settings → Secrets and variables → Actions`.
2. Создайте secret `OPENAI_API_KEY`.
3. Откройте `Actions → Generate API voice → Run workflow`.
4. Workflow добавит созданные файлы в `assets/audio` и автоматически запустит обновление GitHub Pages.

Основная модель и голос задаются в `.github/workflows/generate-voice.yml`. Пока MP3 отсутствует, приложение автоматически использует системную озвучку браузера.
