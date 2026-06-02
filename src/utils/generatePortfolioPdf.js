// src/utils/generatePortfolioPdf.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getDeadlineStatus } from './deadlineStatus'

const TEAL = '#0d9488'
const DARK = '#0f172a'
const LIGHT_ROW = '#f8fafc'

/**
 * Pure computation — no side effects, fully testable.
 * @param {Array} projects - project records from useProjects()
 * @param {Array} allTasks - all tasks across all projects
 * @returns {{ totalValue, activeCount, completionPct, overdueCount, taskBreakdown, phaseCounts }}
 */
export function computePortfolioStats(projects, allTasks) {
  const totalValue = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const activeCount = projects.length // caller passes only active/relevant projects

  const totalTasks = allTasks.length
  const completedTasks = allTasks.filter(t => t.status === 'completed').length
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const overdueCount = projects.filter(p => getDeadlineStatus(p.deadline) === 'overdue').length

  const taskBreakdown = { todo: 0, inprogress: 0, inreview: 0, completed: 0 }
  allTasks.forEach(t => {
    if (t.status in taskBreakdown) taskBreakdown[t.status]++
  })

  const phaseCounts = { SD: 0, DD: 0, CD: 0, CA: 0 }
  projects.forEach(p => {
    if (p.phase in phaseCounts) phaseCounts[p.phase]++
  })

  return { totalValue, activeCount, completionPct, overdueCount, taskBreakdown, phaseCounts }
}

/**
 * Builds and downloads a portfolio PDF.
 * @param {Array} projects
 * @param {Array} allTasks
 * @param {{ donutCanvas: HTMLCanvasElement|null, barCanvas: HTMLCanvasElement|null }} canvases
 */
export function generatePortfolioPdf(projects, allTasks, { donutCanvas, barCanvas } = {}) {
  const stats = computePortfolioStats(projects, allTasks)
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  let y = 0

  // ── Header band ──────────────────────────────────────────────────────────
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, W, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(255, 255, 255)
  doc.text('ARCFLOW', 10, 13)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Portfolio Report', 45, 13)
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-AU')}`, W - 10, 13, { align: 'right' })

  y = 32

  // ── Summary stats 2×2 grid ───────────────────────────────────────────────
  const fmt = n => `$${Number(n).toLocaleString('en-US')}`
  const statItems = [
    ['Total Portfolio Value', fmt(stats.totalValue)],
    ['Active Projects', String(stats.activeCount)],
    ['Overall Completion', `${stats.completionPct}%`],
    ['Overdue Items', String(stats.overdueCount)],
  ]
  doc.setFontSize(9)
  statItems.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const sx = 10 + col * 95
    const sy = y + row * 16
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(sx, sy, 90, 12, 2, 2, 'F')
    doc.setTextColor(100, 116, 139)
    doc.text(label, sx + 4, sy + 5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(15, 23, 42)
    doc.text(value, sx + 4, sy + 10)
    doc.setFont('helvetica', 'normal')
  })

  y += 38

  // ── Charts ───────────────────────────────────────────────────────────────
  if (donutCanvas) {
    try {
      const imgData = donutCanvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', 10, y, 80, 60)
    } catch (_) { /* canvas not ready */ }
  }
  if (barCanvas) {
    try {
      const imgData = barCanvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', 105, y, 95, 60)
    } catch (_) { /* canvas not ready */ }
  }
  y += 68

  // ── Project table ─────────────────────────────────────────────────────────
  const rows = projects.map(p => {
    const pTasks = allTasks.filter(t => t.project_id === p.id)
    const done = pTasks.filter(t => t.status === 'completed').length
    const pct = pTasks.length > 0 ? `${Math.round((done / pTasks.length) * 100)}%` : '—'
    const status = getDeadlineStatus(p.deadline)
    const statusLabel = status === 'overdue' ? 'Overdue' : status === 'soon' ? 'Due soon' : 'On track'
    return [
      p.name || '—',
      p.client?.name || '—',
      p.phase || '—',
      fmt(p.budget || 0),
      pct,
      p.deadline ? new Date(p.deadline).toLocaleDateString('en-AU') : '—',
      statusLabel,
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Project', 'Client', 'Phase', 'Budget', 'Progress', 'Deadline', 'Status']],
    body: rows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT_ROW },
    columnStyles: {
      0: { cellWidth: 42 },
      3: { halign: 'right' },
      4: { halign: 'center' },
      5: { halign: 'center' },
      6: { halign: 'center' },
    },
  })

  // ── Footer ───────────────────────────────────────────────────────────────
  const finalY = doc.lastAutoTable?.finalY || pageH - 10
  if (finalY + 10 < pageH) {
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text('Confidential — ArcFlow CRM', W / 2, pageH - 8, { align: 'center' })
  }

  doc.save(`arcflow-portfolio-${new Date().toISOString().slice(0, 10)}.pdf`)
}
