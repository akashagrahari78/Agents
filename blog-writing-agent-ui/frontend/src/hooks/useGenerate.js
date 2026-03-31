import { useState, useCallback } from 'react'
import useStore from '../store/useStore'

const STEP_LABELS = [
  'Routing topic...',
  'Running research (Tavily)...',
  'Planning sections...',
  'Writing sections...',
  'Assembling final blog...',
]

export function useGenerate() {
  const {
    setIsGenerating,
    addProgress,
    updateProgress,
    resetProgress,
    setGeneratedBlog,
  } = useStore()

  const [error, setError] = useState(null)

  const generate = useCallback(async (formData) => {
    setError(null)
    resetProgress()
    setIsGenerating(true)
    setGeneratedBlog(null)

    // Initialize all steps
    STEP_LABELS.forEach((label) => {
      addProgress({ label, status: 'pending' })
    })

    try {
      const token = useStore.getState().token;
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'step') {
                const stepIndex = data.stepIndex
                if (stepIndex !== undefined) {
                  updateProgress(stepIndex, { status: data.status })
                }
              }

              if (data.type === 'complete') {
                setGeneratedBlog(data.blog)
              }

              if (data.type === 'error') {
                setError(data.message)
              }
            } catch (e) {
              // Skip malformed SSE lines
            }
          }
        }
      }
    } catch (err) {
      setError(err.message || 'Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }, [setIsGenerating, addProgress, updateProgress, resetProgress, setGeneratedBlog])

  return { generate, error }
}
