// Проверка 2: ЗАПИСЬ в общую память (@zos/storage): ShareTypedStorage и ShareLocalStorage, плюс своё хранилище приложения.
import * as st from '@zos/storage'
import { startView } from '../shared/view'
import { SHARE_SCOPE, SHARE_FILE, SAMPLE_COLORS } from '../shared/const'

Page({
  build() {
    const v = startView('store', '2 Запись')
    const stamp = String(Date.now())
    v.line('Что есть в @zos/storage', () =>
      ['ShareTypedStorage', 'ShareLocalStorage', 'LocalStorage'].map((n) => n + (typeof st[n] === 'function' ? '+' : '-')).join(' '))

    let typed = false
    v.line('typed: запись', () => {
      const t = new st.ShareTypedStorage(SHARE_SCOPE)
      t.putString('ping', stamp)
      t.putString('luv_c', SAMPLE_COLORS)
      t.putString('luv_n', '1')
      t.putString('luv_ts', stamp)
      t.putInt('i', 7)
      return 'ping=' + t.getString('ping', '?').slice(-6)
    })
    v.line('typed: чтение обратно', () => {
      const t = new st.ShareTypedStorage(SHARE_SCOPE)
      if (t.getString('ping', '') !== stamp) throw new Error('не совпало')
      if (t.getInt('i', 0) !== 7) throw new Error('int не совпал')
      typed = true
      return 'совпало, has(ping)=' + t.has('ping')
    })

    let local = false
    v.line('local: запись', () => {
      const l = new st.ShareLocalStorage(SHARE_FILE)
      l.setItem('ping', stamp)
      l.setItem('luv_c', SAMPLE_COLORS)
      l.setItem('luv_n', '1')
      l.setItem('luv_ts', stamp)
      l.setItem('obj', { a: 1 })
      return 'ping=' + String(l.getItem('ping', '?')).slice(-6)
    })
    v.line('local: чтение обратно', () => {
      const l = new st.ShareLocalStorage(SHARE_FILE)
      if (String(l.getItem('ping', '')) !== stamp) throw new Error('не совпало')
      const o = l.getItem('obj', null)
      if (!o || o.a !== 1) throw new Error('объект не совпал')
      local = true
      return 'совпало'
    })

    v.line('Своё хранилище приложения', () => {
      const s = new st.LocalStorage()
      s.setItem('own', stamp)
      if (s.getItem('own') !== stamp) throw new Error('не совпало')
      return 'работает'
    })
    v.add('')
    v.add('Дальше откройте «3 Чтение»: оно проверит, видно ли записанное через TypedStorage / LocalStorage.')
    v.done('typed ' + (typed ? 'OK' : 'нет') + ', local ' + (local ? 'OK' : 'нет'))
  },
  onDestroy() {}
})
