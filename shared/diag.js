/**
 * Журнал результатов проверок. Лежит в файле приложения (@zos/fs). Меню читает его, чтобы показать итоги.
 * Состояние проверки: 'T' — на неё нажали, но страница ничего не записала (значит, не загрузилась или упала);
 * 'OK|текст', 'PART|текст', 'ERR|текст' — итог, записанный самой страницей.
 */
import { readFileSync, writeFileSync } from '@zos/fs'

const FILE = 'diag_state.json'

export function loadAll() {
  try {
    const s = readFileSync({ path: FILE, options: { encoding: 'utf8' } })
    if (typeof s === 'string' && s) return JSON.parse(s)
  } catch (e) { /* пусто */ }
  return {}
}

export function saveOne(key, value) {
  const all = loadAll()
  all[key] = value
  try {
    writeFileSync({ path: FILE, data: JSON.stringify(all), options: { encoding: 'utf8' } })
    return true
  } catch (e) { return false }
}
