// Проверка 3: ЧТЕНИЕ из общей памяти (@zos/share-storage) — свои данные, данные Luv Sync, «Таймера» и тестового циферблата.
import * as sh from '@zos/share-storage'
import { startView } from '../shared/view'
import { DIAG_APP_ID, DIAG_FACE_ID, SYNC_APP_ID, TIMER_APP_ID, SHARE_SCOPE, SHARE_FILE } from '../shared/const'

const WHO = [
  ['Luv Diag (своё)', DIAG_APP_ID, 'ping'],
  ['Luv Sync', SYNC_APP_ID, 'luv_c'],
  ['Таймер', TIMER_APP_ID, 'luv_c'],
  ['Тест-циферблат', DIAG_FACE_ID, 'face']
]

Page({
  build() {
    const v = startView('read', '3 Чтение')
    v.line('Что есть в @zos/share-storage', () =>
      ['TypedStorage', 'LocalStorage'].map((n) => n + (typeof sh[n] === 'function' ? '+' : '-')).join(' '))
    let ownTyped = false
    let ownLocal = false
    for (let i = 0; i < WHO.length; i++) {
      const name = WHO[i][0]
      const id = WHO[i][1]
      const key = WHO[i][2]
      v.line(name + ' typed ' + key, () => {
        const t = new sh.TypedStorage(id, SHARE_SCOPE)
        const val = t.getString(key, '')
        if (i === 0 && val) ownTyped = true
        return val ? '«' + val.slice(0, 18) + '»' : 'пусто'
      })
      v.line(name + ' local ' + key, () => {
        const l = new sh.LocalStorage(id, SHARE_FILE)
        if (!l.isExisted()) return 'файла нет'
        const val = String(l.getItem(key, ''))
        if (i === 0 && val) ownLocal = true
        return val ? '«' + val.slice(0, 18) + '»' : 'пусто'
      })
    }
    v.done('своё: typed ' + (ownTyped ? 'OK' : 'пусто') + ', local ' + (ownLocal ? 'OK' : 'пусто'))
  },
  onDestroy() {}
})
