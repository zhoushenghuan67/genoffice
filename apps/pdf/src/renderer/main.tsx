import { createRoot } from 'react-dom/client'
import { htmlDir, htmlLang, type Lang } from '@huanoffice/i18n'
import App from './App'
import { LocaleProvider } from './i18n/locale'
import type { UiTheme } from '../shared/ipc'
import '@huanoffice/ui/tokens.css'
import '@huanoffice/ui/screentip.css'
import '@huanoffice/ui/ai-model-picker.css'
import '@huanoffice/ui/ai-queue-strip.css'
import '@huanoffice/ui/ai-usage.css'
import '@huanoffice/ui/ai-skills.css'
import '@huanoffice/ui/color-picker.css'
import '@huanoffice/ui/dropdown.css'
import '@huanoffice/ui/ribbon-collapse.css'
import '@huanoffice/ui/markdown.css'
import '@huanoffice/ui/ai-panel-prefs.css'
import '@huanoffice/ui/ai-scope-quote.css'
import './styles.css'
import { applyAiPanelPrefs, installScreenTips } from '@huanoffice/ui'

installScreenTips()

function applyTheme(theme: UiTheme): void {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', theme)
}

void (async () => {
  const [lang, theme] = await Promise.all([
    window.pdfApi.getLanguage().catch(() => 'zh' as const),
    window.pdfApi.getTheme().catch(() => 'system' as const),
  ])
  document.documentElement.lang = htmlLang(lang as Lang)
  document.documentElement.dir = htmlDir(lang)
  applyTheme(theme)
  window.pdfApi.onThemeChanged(applyTheme)
  await window.pdfApi
    ?.getAiPanelPrefs?.()
    .then(applyAiPanelPrefs)
    .catch(() => {})
  window.pdfApi?.onAiPanelPrefsChanged?.(applyAiPanelPrefs)
  createRoot(document.getElementById('root')!).render(
    <LocaleProvider initial={lang}>
      <App />
    </LocaleProvider>,
  )
})()
