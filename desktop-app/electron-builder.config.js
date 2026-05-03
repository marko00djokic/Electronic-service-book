module.exports = {
  appId: 'rs.kafanica.esb',
  productName: 'Elektronska Servisna Knjizica',
  copyright: 'Copyright 2024 Kafanica sa dobrom klopom',
  directories: {
    output: 'dist'
  },
  files: [
    'out/**/*',
    'package.json'
  ],
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ]
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'ESB'
  }
}
