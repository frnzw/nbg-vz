# NBG-VZ / Herrnhut: Wer, wo, wann?

Visualierungsprototyp für Aufenthaltsorte Herrnhuther Missionar:innen.

Der Prototyp basiert auf den Quellen ausgewählter "Verzeichnisse" aus den "Nachrichten aus der Brüdergemeine".

### Dokumentation

Die Dokumentation, insbesondere die Kommentare im JS-Doc Stil wurden zu großen Teilen mit Google Gemini Pro 2.5 erzeugt, geprüft und ggf. inhaltlich angepasst.

### Code Formatting and Linting

Das Projekt nutzt ESLint und Prettier für Code Linting und Formatierung.

**VSCodium / VS Code Editor Setup**

Empfohlene Erweiterungen:

- ESLint (by dbaeumer)
- Prettier - Code formatter (by esbenp)
- Vue (by Vue)

Einstellungen in `settings.json` (User) --- ⚠️ Vorsicht bei Anpassungen der Einstellungen im eigenen Editor!

```
{
    // ... other config

    // Enable formatting on save globally
    "editor.formatOnSave": true,

    // Assign Prettier as the default formatter for relevant languages
    "[javascript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[typescript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[vue]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },

    // Essential setting for Prettier to correctly handle <script> and <style> blocks in Vue files
    "prettier.vueIndentScriptAndStyle": true
}
```
