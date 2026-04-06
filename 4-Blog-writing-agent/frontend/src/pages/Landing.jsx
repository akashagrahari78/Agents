import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineSearch, HiOutlineClipboardList, HiOutlinePencil, HiOutlineLightningBolt, HiOutlineGlobe, HiOutlineDatabase, HiOutlineDocumentText } from 'react-icons/hi'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
}

const features = [
  {
    icon: HiOutlineSearch, title: 'Deep Research',
    description: 'AI-powered web research using Tavily to gather the latest data, stats, and sources intelligently.'
  },
  {
    icon: HiOutlineClipboardList, title: 'Smart Outlining',
    description: 'Intelligent planning that creates structured, section-by-section outlines with clear goals and scope.'
  },
  {
    icon: HiOutlinePencil, title: 'Parallel Writing',
    description: 'Simultaneous section writing with strict quality control, citations, code snippets, and consistent tone.'
  },
]

const TechMarquee = () => (
  <div className="marquee-container">
    <div className="marquee-wrapper">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="marquee-content">
          <div className="marquee-item"><HiOutlineLightningBolt /> Llama 3 70B Engine</div>
          <div className="marquee-item"><HiOutlineGlobe /> Multi-Agent Routines</div>
          <div className="marquee-item"><HiOutlineDatabase /> MongoDB Neural Storage</div>
          <div className="marquee-item"><HiOutlineLightningBolt /> GROQ LPU Inference</div>
          <div className="marquee-item"><HiOutlineSearch /> Autonomous Deep Research</div>
          <div className="marquee-item"><HiOutlineGlobe /> Tavily Integration</div>
          <div className="marquee-item"><HiOutlineDocumentText /> Markdown Structuring</div>
          <div className="marquee-item"><HiOutlineLightningBolt /> Real-time SSE Streaming</div>
        </div>
      ))}
    </div>
  </div>
)

const UseCases = () => (
  <section style={{ padding: '0 1.5rem 5rem 1.5rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
    <h2 className="section-heading" style={{ marginBottom: '2.5rem' }}>Perfect For Every Niche</h2>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem' }}>
      {['Technical Tutorials', 'Industry Reviews', 'Thought Leadership', 'Product Comparisons', 'SEO Listicles', 'Weekly Newsletters'].map((useCase) => (
        <div key={useCase} style={{
          padding: '1.1rem 0.9rem',
          borderRadius: 'var(--radius-lg)',
          border: '1.5px solid var(--color-border)',
          backgroundColor: 'var(--color-bg-surface)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          fontSize: '0.9rem',
          transition: 'all 0.25s',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-sm)',
        }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(20, 184, 166, 0.4)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(20, 184, 166, 0.1)' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)' }}>
          {useCase}
        </div>
      ))}
    </div>
  </section>
)

export default function Landing() {
  return (
    <div className="landing-container">
      <div className="vanna-bg" />
      <div className="vanna-square square-1" />
      <div className="vanna-square square-2" />

      {/* Hero */}
      <section className="hero-section">
        <motion.div variants={container} initial="hidden" animate="visible" className="hero-content">
          <motion.div variants={fadeUp} className="hero-badge">
            ✨ Next-Gen Content Engine
          </motion.div>

          <motion.h1 variants={fadeUp} className="hero-title">
            The <span className="hero-gradient">Ultimate</span> <br /> AI Blog Writer
          </motion.h1>

          <motion.p variants={fadeUp} className="hero-subtitle">
            Transform any concept into a comprehensive, deeply-researched blog post.
            Our LangGraph-powered AI handles the research, planning, and writing — fully autonomously.
          </motion.p>

          <motion.div variants={fadeUp} className="hero-cta">
            <Link to="/generate">
              <button className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem' }}>Start Writing</button>
            </Link>
            <Link to="/history">
              <button className="btn-secondary" style={{ padding: '1rem 2.5rem', fontSize: '1.05rem' }}>View Library</button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Premium Mockup Window */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mockup-window"
        >
          <div className="mockup-header">
            <div className="mockup-dot dot-red"></div>
            <div className="mockup-dot dot-yellow"></div>
            <div className="mockup-dot dot-green"></div>
            <div className="mockup-title">agent-workspace.tsx</div>
          </div>
          <div className="mockup-body">
            <span style={{ color: 'var(--color-accent-primary)' }}>&gt;</span> Initializing LangGraph agent...
            <br />
            <span style={{ color: 'var(--color-accent-primary)' }}>&gt;</span> Topic accepted: &quot;The Future of Multimodal LLMs in 2026&quot;
            <br />
            <span style={{ color: '#10b981' }}>✓</span> Tavily web search completed (Found 12 sources)
            <br />
            <span style={{ color: '#10b981' }}>✓</span> Document outline generated (7 major sections)
            <br />
            <span style={{ color: '#f59e0b' }}>⟳</span> Writing sections in parallel using Llama 3 70B...
            <span className="cursor-blink"></span>
          </div>
        </motion.div>
      </section>

      {/* Tech Stack Marquee */}
      <TechMarquee />

      {/* Features */}
      <section className="features-section">
        <h2 className="section-heading">Agentic Workflow</h2>
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-100px' }}
          variants={container} className="features-grid"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={fadeUp} className="feature-card">
              <div className="feature-icon">
                <feature.icon />
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-desc">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Use Cases Grid */}
      <UseCases />

      {/* Premium Stats section */}
      <section className="stats-section">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }} className="stats-card"
        >
          {[
            { value: '~30s', label: 'Generation Time' },
            { value: '5-9', label: 'Smart Sections' },
            { value: '100%', label: 'Autonomous' },
          ].map((stat) => (
            <div key={stat.label} className="stat-item">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>
    </div>
  )
}
