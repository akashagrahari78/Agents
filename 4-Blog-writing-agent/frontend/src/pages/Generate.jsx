import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineChevronDown, HiOutlineClipboardCopy, HiOutlineDownload, HiOutlinePencil } from 'react-icons/hi'
import ModeSelector from '../components/ModeSelector'
import ProgressTracker from '../components/ProgressTracker'
import MarkdownViewer from '../components/MarkdownViewer'
import { useGenerate } from '../hooks/useGenerate'
import useStore from '../store/useStore'
import { wordCount } from '../utils/helpers'

const EXAMPLE_TOPICS = [
  'State of Multimodal LLMs in 2026',
  'Building RAG pipelines with LangChain',
  'Kubernetes vs Docker Swarm in production',
  'WebAssembly: The future of web apps',
  'AI Code Assistants: A Deep Dive',
]

export default function Generate() {
  const [topic, setTopic] = useState('')
  const [mode, setMode] = useState('hybrid')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [audience, setAudience] = useState('developers')
  const [tone, setTone] = useState('professional')
  const [wordRange, setWordRange] = useState(2000)
  const [includeCode, setIncludeCode] = useState(true)
  const [includeCitations, setIncludeCitations] = useState(true)
  const [includeImages, setIncludeImages] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const { generate, error } = useGenerate()
  const { isGenerating, progress, generatedBlog, editMode, toggleEditMode, setEditMode } = useStore()
  const [editContent, setEditContent] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => setPlaceholderIndex(i => (i + 1) % EXAMPLE_TOPICS.length), 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (generatedBlog?.finalMarkdown) setEditContent(generatedBlog.finalMarkdown)
  }, [generatedBlog])

  const handleGenerate = () => {
    if (!topic.trim()) return
    setEditMode(false)
    generate({ topic: topic.trim(), mode, audience, tone, targetWordCount: wordRange, includeCode, includeCitations, includeImages })
  }

  const handleCopy = () => {
    const content = editMode ? editContent : generatedBlog?.finalMarkdown
    if (content) {
      navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    const content = editMode ? editContent : generatedBlog?.finalMarkdown
    if (content) {
      const blob = new Blob([content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${generatedBlog?.plan?.blog_title || topic || 'blog'}.md`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const blogContent = editMode ? editContent : generatedBlog?.finalMarkdown
  const wc = wordCount(blogContent || '')

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="generate-container">
      <div className="generate-layout">
        {/* Left Panel — Input */}
        <div className="panel-left">
          <div className="generate-card">
            <div>
              <label className="input-label">Blog Topic</label>
              <textarea
                ref={textareaRef} value={topic} onChange={e => setTopic(e.target.value)}
                placeholder={EXAMPLE_TOPICS[placeholderIndex]} rows={3}
                className="input-textarea"
              />
            </div>

            <div>
              <label className="input-label">Research Mode</label>
              <ModeSelector value={mode} onChange={setMode} />
            </div>

            <div>
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="advanced-toggle">
                Advanced Options
                <motion.span animate={{ rotate: showAdvanced ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <HiOutlineChevronDown />
                </motion.span>
              </button>

              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }} className="advanced-panel"
                  >
                    <div className="advanced-content">
                      <div>
                        <label className="input-label" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Audience</label>
                        <select value={audience} onChange={e => setAudience(e.target.value)} className="select-input">
                          <option value="developers">Developers</option>
                          <option value="beginners">Beginners</option>
                          <option value="technical-leads">Technical Leads</option>
                          <option value="general">General Audience</option>
                          <option value="executives">Executives / Business</option>
                        </select>
                      </div>

                      <div>
                        <label className="input-label" style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Tone</label>
                        <div className="tone-group">
                          {['professional', 'casual', 'academic'].map((t) => (
                            <button
                              key={t} onClick={() => setTone(t)}
                              className="tone-btn"
                              style={{
                                backgroundColor: tone === t ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                                color: tone === t ? '#c084fc' : 'var(--color-text-muted)',
                                border: tone === t ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid var(--color-border)',
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="word-count-header">
                          Target Word Count
                          <span style={{ color: '#d946ef', fontWeight: '600' }}>{wordRange.toLocaleString()}</span>
                        </label>
                        <input type="range" min={500} max={5000} step={100} value={wordRange} onChange={e => setWordRange(Number(e.target.value))} className="slider-input" />
                        <div className="slider-labels"><span>500</span><span>5,000</span></div>
                      </div>

                      <div className="toggle-group">
                        {[
                          { label: 'Include Code Snippets', value: includeCode, onChange: setIncludeCode },
                          { label: 'Include Citations', value: includeCitations, onChange: setIncludeCitations },
                          { label: 'Generate Images', value: includeImages, onChange: setIncludeImages },
                        ].map((toggle) => (
                          <label key={toggle.label} className="toggle-item">
                            <span className="toggle-label">{toggle.label}</span>
                            <div onClick={() => toggle.onChange(!toggle.value)} className={`toggle-switch ${toggle.value ? 'on' : ''}`} style={{ backgroundColor: !toggle.value ? 'var(--color-bg-hover)' : '' }}>
                              <div className="toggle-knob" />
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleGenerate} disabled={isGenerating || !topic.trim()}
              className={`btn-primary generate-btn ${isGenerating || !topic.trim() ? 'btn-secondary' : ''}`}
            >
              {isGenerating ? 'Generating...' : 'Generate Blog'}
            </button>

            {error && <div className="error-badge">{error}</div>}
          </div>
        </div>

        {/* Right Panel — Output */}
        <div className="panel-right">
          {generatedBlog && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="right-toolbar">
              <span className="word-badge">{wc.toLocaleString()} words</span>
              <div className="toolbar-actions">
                <button onClick={handleCopy} className="action-btn" style={{ backgroundColor: 'var(--color-bg-elevated)', color: copied ? '#10b981' : 'var(--color-text-muted)' }}>
                  <HiOutlineClipboardCopy /> {copied ? 'Copied!' : 'Copy MD'}
                </button>
                <button onClick={handleDownload} className="action-btn" style={{ backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-muted)' }}>
                  <HiOutlineDownload /> Download
                </button>
                <button onClick={toggleEditMode} className="action-btn" style={{ backgroundColor: editMode ? 'rgba(139, 92, 246, 0.1)' : 'transparent', color: editMode ? '#c084fc' : 'var(--color-text-muted)' }}>
                  <HiOutlinePencil /> {editMode ? 'Preview' : 'Edit'}
                </button>
              </div>
            </motion.div>
          )}

          {isGenerating && progress.length > 0 && (
            <div className="section-card">
              <h3 className="input-label" style={{ fontSize: '0.875rem' }}>Generation Progress</h3>
              <ProgressTracker steps={progress} />
            </div>
          )}

          {generatedBlog && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="section-card" style={{ padding: '2rem' }}>
              {editMode ? (
                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="markdown-editor" />
              ) : (
                <MarkdownViewer content={blogContent} />
              )}
            </motion.div>
          )}

          {!isGenerating && !generatedBlog && (
            <div className="empty-state">
              <div style={{ textAlign: 'center' }}>
                <div className="empty-box"><HiOutlinePencil size={32} color="var(--color-text-subtle)" /></div>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Enter a topic and click Generate to create your blog</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
