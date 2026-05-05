import { ipcMain, dialog } from 'electron'
import { writeFileSync } from 'fs'
import { generateServiceBookPdf, generateOrderPdf } from '../pdf/pdfGenerator.js'

export function registerPdfHandlers() {
  ipcMain.handle('pdf:serviceBook', async (_, vehicleId) => {
    try {
      const pdfBytes = generateServiceBookPdf(vehicleId)
      const { filePath } = await dialog.showSaveDialog({
        title: 'Sacuvaj servisnu knjizicu',
        defaultPath: `servisna-knjizica-${vehicleId}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })
      if (!filePath) return { cancelled: true }
      writeFileSync(filePath, Buffer.from(pdfBytes))
      return { success: true, filePath }
    } catch (err) {
      return { error: err.message }
    }
  })

  ipcMain.handle('pdf:order', async (_, orderId) => {
    try {
      const pdfBytes = generateOrderPdf(orderId)
      const { filePath } = await dialog.showSaveDialog({
        title: 'Sacuvaj servisni nalog',
        defaultPath: `nalog-${orderId}.pdf`,
        filters: [{ name: 'PDF', extensions: ['pdf'] }]
      })
      if (!filePath) return { cancelled: true }
      writeFileSync(filePath, Buffer.from(pdfBytes))
      return { success: true, filePath }
    } catch (err) {
      return { error: err.message }
    }
  })
}
