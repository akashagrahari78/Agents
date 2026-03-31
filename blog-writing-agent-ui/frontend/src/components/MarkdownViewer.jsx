import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion } from 'framer-motion'

function HeadingRenderer({ level, children, ...props }) {
  const Tag = `h${level}`
  const id = typeof children === 'string' 
    ? children.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : ''
  return <Tag id={id} {...props}>{children}</Tag>
}

export default function MarkdownViewer({ content, animate = true }) {
  if (!content) return null

  const sections = content.split(/(?=^## )/m)

  return (
    <div className="markdown-body">
      {sections.map((section, i) => (
        <motion.div
          key={i}
          initial={animate ? { opacity: 0, y: 15 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: (props) => <HeadingRenderer level={1} {...props} />,
              h2: (props) => <HeadingRenderer level={2} {...props} />,
              h3: (props) => <HeadingRenderer level={3} {...props} />,
              code({ inline, className, children, ...props }) {
                return inline ? (
                  <code className={className} {...props}>{children}</code>
                ) : (
                  <pre>
                    <code className={className} {...props}>{children}</code>
                  </pre>
                )
              },
            }}
          >
            {section}
          </ReactMarkdown>
        </motion.div>
      ))}
    </div>
  )
}
