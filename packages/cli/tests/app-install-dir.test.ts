import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { appBinaryForResources } from '../src/resources'

describe('appBinaryForResources', () => {
  it('finds the app in a custom Windows install directory', () => {
    expect(appBinaryForResources(join('D:\\Apps\\HuanOffice', 'resources'), 'win32')).toBe(
      join('D:\\Apps\\HuanOffice', 'HuanOffice.exe'),
    )
  })

  it('resolves the same binary for the default Windows install directory', () => {
    const localAppData = 'C:\\Users\\test\\AppData\\Local'
    const resources = join(localAppData, 'Programs', 'HuanOffice', 'resources')
    expect(appBinaryForResources(resources, 'win32')).toBe(
      join(localAppData, 'Programs', 'HuanOffice', 'HuanOffice.exe'),
    )
  })

  it('finds the app in a custom macOS bundle location', () => {
    expect(
      appBinaryForResources(join('/Volumes/Work/HuanOffice.app/Contents/Resources'), 'darwin'),
    ).toBe(join('/Volumes/Work/HuanOffice.app/Contents/MacOS/HuanOffice'))
  })

  it('finds the app in a custom Linux prefix', () => {
    expect(appBinaryForResources(join('/opt/huanoffice-custom/resources'), 'linux')).toBe(
      join('/opt/huanoffice-custom/huanoffice'),
    )
  })
})
