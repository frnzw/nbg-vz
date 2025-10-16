# NBG-VZ / Herrnhut: Wer, wo, wann?

Work in progress.

Visualierungsprototyp für Aufenthaltsorte Herrnhuther Missionar:innen.

Der Prototyp basiert auf den Quellen ausgewählter "Verzeichnisse" aus den "Nachrichten aus der Brüdergemeine".

### Code Formatting and Linting

The project uses ESLint and Prettier for code linting and formatting.

**VSCodium / VS Code Editor Setup**

Extensions used:

- ESLint (by dbaeumer)
- Prettier - Code formatter (by esbenp)
- Vue (by Vue)

Settings used in `settings.json` (User) --- ⚠️ proceed with caution when editing your own!

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
