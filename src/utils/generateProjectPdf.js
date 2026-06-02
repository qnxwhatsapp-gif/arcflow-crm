// src/utils/generateProjectPdf.js
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const TEAL = '#0d9488'
const LIGHT_ROW = '#f8fafc'
const PHASES = { SD: 'Schematic Design', DD: 'Design Development', CD: 'Construction Documents', CA: 'Construction Admin' }

/**
 * Pure computation — groups work logs by team member, totals hours, sorts descending.
 * @param {Array} workLogs - work log records with { user: { name }, duration, unit }
 * @returns {Array<{ name: string, hours: number }>} sorted descending by hours
 */
export function computeWorkSummary(workLogs) {
  const map = {}
  workLogs.forEach(w => {
    const name = w.user?.name || 'Unknown'
    const hours = w.unit === 'days' ? (parseFloat(w.duration) || 0) * 8 : (parseFloat(w.duration) || 0)
    map[name] = (map[name] || 0) + hours
  })
  return Object.entries(map)
    .map(([name, hours]) => ({ name, hours }))
    .sort((a, b) => b.hours - a.hours)
}

/**
 * Builds and downloads a project health PDF.
 * @param {Object} project
 * @param {Array} tasks
 * @param {Array} workLogs
 * @param {Array} comments - comment records with { author: { name }, created_at, text }; function uses the first 5
 * @param {HTMLCanvasElement|null} donutCanvas - task completion donut chart
 */
export function generateProjectPdf(project, tasks, workLogs, comments, donutCanvas) {
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
  doc.text('Project Health Report', 45, 13)
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleDateString('en-AU')}`, W - 10, 13, { align: 'right' })

  y = 30

  // ── Project metadata block ───────────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(15, 23, 42)
  doc.text(project.name || 'Untitled Project', 10, y)
  y += 7

  const metaItems = [
    ['Client', project.client?.name || '—'],
    ['Phase', PHASES[project.phase] || project.phase || '—'],
    ['Lead Architect', project.lead?.name || '—'],
    ['Budget', project.budget ? `$${Number(project.budget).toLocaleString('en-US')}` : '—'],
    ['Deadline', project.deadline ? new Date(project.deadline).toLocaleDateString('en-AU') : '—'],
  ]
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  metaItems.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const mx = 10 + col * 95
    const my = y + row * 8
    doc.setTextColor(100, 116, 139)
    doc.text(`${label}:`, mx, my)
    doc.setTextColor(15, 23, 42)
    doc.text(value, mx + 28, my)
  })
  y += Math.ceil(metaItems.length / 2) * 8 + 8

  // ── Donut chart ──────────────────────────────────────────────────────────
  if (donutCanvas) {
    try {
      const imgData = donutCanvas.toDataURL('image/png')
      doc.addImage(imgData, 'PNG', 10, y, 70, 55)
    } catch (_) { /* canvas not ready */ }
  }

  // Stats alongside chart
  const completed = tasks.filter(t => t.status === 'completed').length
  const total = tasks.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(13, 148, 136) // teal
  doc.text(`${pct}%`, 95, y + 20)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 116, 139)
  doc.text('Complete', 95, y + 27)
  doc.text(`${completed} of ${total} tasks done`, 95, y + 34)
  y += 65

  // ── Task table ───────────────────────────────────────────────────────────
  const taskRows = tasks.map(t => {
    const daysLeft = t.deadline ? Math.ceil((new Date(t.deadline) - new Date()) / 86400000) : null
    const alert = daysLeft === null ? '—' : daysLeft < 0 ? 'Overdue' : daysLeft <= 2 ? 'Due soon' : '—'
    return [
      t.title || '—',
      t.priority ? t.priority.charAt(0).toUpperCase() + t.priority.slice(1) : '—',
      t.status || '—',
      t.assignee?.name || '—',
      t.deadline ? new Date(t.deadline).toLocaleDateString('en-AU') : '—',
      alert,
    ]
  })

  autoTable(doc, {
    startY: y,
    head: [['Task', 'Priority', 'Status', 'Assignee', 'Deadline', 'Alert']],
    body: taskRows,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT_ROW },
    columnStyles: {
      0: { cellWidth: 55 },
      4: { halign: 'center' },
      5: { halign: 'center' },
    },
  })
  y = doc.lastAutoTable?.finalY + 8 || y + 60

  // ── Work log summary ─────────────────────────────────────────────────────
  const workSummary = computeWorkSummary(workLogs)
  const totalHours = workSummary.reduce((s, w) => s + w.hours, 0)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(15, 23, 42)
  doc.text(`Work Log Summary — Total: ${totalHours}h`, 10, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Team Member', 'Hours Logged']],
    body: workSummary.map(w => [w.name, `${w.hours}h`]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: LIGHT_ROW },
    columnStyles: { 1: { halign: 'right' } },
  })
  y = doc.lastAutoTable?.finalY + 8 || y + 40

  // ── Recent comments ───────────────────────────────────────────────────────
  const recentComments = comments.slice(0, 5)
  if (recentComments.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(15, 23, 42)
    doc.text('Recent Comments', 10, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Author', 'Date', 'Comment']],
      body: recentComments.map(c => [
        c.author?.name || '—',
        c.created_at ? new Date(c.created_at).toLocaleDateString('en-AU') : '—',
        (c.text || '').slice(0, 120),
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: TEAL, textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: LIGHT_ROW },
      columnStyles: { 2: { cellWidth: 110 } },
    })
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  doc.setFontSize(8)
  doc.setTextColor(150)
  doc.text('Confidential — ArcFlow CRM', W / 2, pageH - 8, { align: 'center' })

  doc.save(`arcflow-${(project.name || 'project').toLowerCase().replace(/\s+/g, '-')}-health-${new Date().toISOString().slice(0,10)}.pdf`)
}
