import { useState, useCallback } from 'react'
import useStore from '../store/useStore'

const STEP_LABELS = [
  'Analyzing topic and selecting the best writing mode',
  'Researching sources and gathering useful evidence',
  'Generating outline and planning sections',
  'Writing the blog sections',
  'Assembling the final blog and formatting output',
]

function getFriendlyErrorMessage(message) {
  if (!message) {
    return 'Unable to complete blog generation right now. Please try again.'
  }

  if (message.includes('Rate limit') || message.includes('groq.RateLimitError') || message.includes('429')) {
    return 'The blog generator is temporarily rate-limited. Please wait a bit and try again.'
  }

  if (message.includes('Traceback') || message.includes('Agent exited with code')) {
    return 'Unable to complete blog generation right now. Please try again.'
  }

  if (message.length > 220) {
    return 'Generation failed before the blog could be completed. Please try again.'
  }

  return message
}

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
    STEP_LABELS.forEach((label, index) => {
      addProgress({
        id: index,
        label,
        status: 'pending',
      })
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
                const activeStepIndex = useStore.getState().progress.findIndex((step) => step.status === 'active')
                if (activeStepIndex !== -1) {
                  updateProgress(activeStepIndex, { status: 'error' })
                }
                setError(getFriendlyErrorMessage(data.message))
              }
            } catch (e) {
              // Skip malformed SSE lines
            }
          }
        }
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message))
    } finally {
      setIsGenerating(false)
    }
  }, [setIsGenerating, addProgress, updateProgress, resetProgress, setGeneratedBlog])

  return { generate, error }
}
