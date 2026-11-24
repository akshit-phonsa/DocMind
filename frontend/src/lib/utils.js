export const formatSize = (b = 0) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1048576).toFixed(1)} MB`

export const formatDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB') : '—')

export const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'md', 'txt', 'csv']
export const MAX_SIZE = 25 * 1024 * 1024
export const extOf = (n) => n.split('.').pop().toLowerCase()

export const TEMPLATES = [
  { icon: '📄', title: 'Summarize Key Points', prompt: 'Summarize the key points and executive highlights of this document.', desc: 'Summarize the key points and executive highlights of this document.' },
  { icon: '❓', title: 'Interview / Q&A Insights', prompt: 'What are the most critical questions and answers covered in this text?', desc: 'What are the most critical questions and answers covered in this text?' },
  { icon: '📝', title: 'Action Items & Deadlines', prompt: 'List all actionable takeaways, deadlines, and responsibilities mentioned.', desc: 'List all actionable takeaways, deadlines, and responsibilities mentioned.' },
  { icon: '🔍', title: 'Technical Concepts', prompt: 'Explain the main technical concepts and architecture described in this document.', desc: 'Explain the main technical concepts and architecture described in this document.' },
]

export const errMsg = (e) =>
  e.response?.data?.message || e.response?.data?.error || e.message || 'Request failed'
