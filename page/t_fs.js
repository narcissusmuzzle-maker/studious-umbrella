// Проверка 4: файлы (@zos/fs) и старый hmFS (на нём были «SysPro», которых на этих часах нет).
import * as zfs from '@zos/fs'
import { startView } from '../shared/view'

Page({
  build() {
    const v = startView('fs', '4 Файлы')
    const stamp = String(Date.now())
    v.line('Файл: запись и чтение', () => {
      zfs.writeFileSync({ path: 'diag.txt', data: stamp, options: { encoding: 'utf8' } })
      const back = zfs.readFileSync({ path: 'diag.txt', options: { encoding: 'utf8' } })
      if (back !== stamp) throw new Error('прочиталось другое: ' + String(back).slice(0, 20))
      return 'совпало'
    })
    v.line('@zos/fs: SysPro…', () => ['SysProGetChars', 'SysProSetChars'].map((n) => n + (typeof zfs[n] === 'function' ? '+' : '-')).join(' '))
    v.line('Сколько функций в @zos/fs', () => String(Object.keys(zfs).length))
    v.line('hmFS (глобальный)', () => {
      if (typeof hmFS === 'undefined' || !hmFS) return 'нет'
      return 'есть; SysProGetChars ' + typeof hmFS.SysProGetChars
    })
    v.done('файлы ' + (v.stat.err === 0 ? 'OK' : 'есть ошибки'))
  },
  onDestroy() {}
})
