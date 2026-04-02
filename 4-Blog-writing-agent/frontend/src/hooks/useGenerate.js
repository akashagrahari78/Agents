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

function buildInitialProgress(activeIndex = null) {
  return STEP_LABELS.map((label, index) => ({
    id: index,
    label,
    status: activeIndex === index ? 'active' : 'pending',
  }))
}

async function readSseStream(response, onData) {
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      try {
        onData(JSON.parse(line.slice(6)))
      } catch (_) {
        // Ignore malformed SSE payloads
      }
    }
  }
}

export function useGenerate() {
  const {
    setIsGenerating,
    addProgress,
    updateProgress,
    resetProgress,
    setProgress,
    setGeneratedBlog,
    setPendingPlanReview,
    setGenerationSessionId,
  } = useStore()

  const [error, setError] = useState(null)

  const runRequest = useCallback(async (url, body) => {
    const token = useStore.getState().token
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers.Authorization = `Bearer ${token}`

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error(`Server error: ${response.status}`)
    }

    await readSseStream(response, (data) => {
      if (data.type === 'step') {
        if (data.stepIndex !== undefined) {
          if (data.status === 'active') {
            const currentProgress = useStore.getState().progress
            for (let index = 0; index < data.stepIndex; index += 1) {
              const step = currentProgress[index]
              if (step && step.status !== 'done' && step.status !== 'error') {
                updateProgress(index, { status: 'done' })
              }
            }
          }
          updateProgress(data.stepIndex, { status: data.status })
        }
        return
      }

      if (data.type === 'plan_review') {
        setProgress([
          { id: 0, label: STEP_LABELS[0], status: 'done' },
          { id: 1, label: STEP_LABELS[1], status: 'done' },
          { id: 2, label: STEP_LABELS[2], status: 'done' },
          { id: 3, label: STEP_LABELS[3], status: 'pending' },
          { id: 4, label: STEP_LABELS[4], status: 'pending' },
        ])
        setPendingPlanReview(data.review)
        setGenerationSessionId(data.sessionId)
        return
      }

      if (data.type === 'complete') {
        setPendingPlanReview(null)
        setGenerationSessionId(null)
        setGeneratedBlog(data.blog)
        return
      }

      if (data.type === 'error') {
        const activeStepIndex = useStore.getState().progress.findIndex((step) => step.status === 'active')
        if (activeStepIndex !== -1) {
          updateProgress(activeStepIndex, { status: 'error' })
        }
        setError(getFriendlyErrorMessage(data.message))
      }
    })
  }, [setGeneratedBlog, setGenerationSessionId, setPendingPlanReview, setProgress, updateProgress])

  const generate = useCallback(async (formData) => {
    setError(null)
    resetProgress()
    setIsGenerating(true)
    setGeneratedBlog(null)
    setPendingPlanReview(null)
    setGenerationSessionId(null)
    setProgress(buildInitialProgress())

    try {
      await runRequest('/api/generate', formData)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message))
    } finally {
      setIsGenerating(false)
    }
  }, [resetProgress, runRequest, setGeneratedBlog, setGenerationSessionId, setIsGenerating, setPendingPlanReview, setProgress])

  const submitPlanReview = useCallback(async ({ approved, topic }) => {
    const { generationSessionId } = useStore.getState()
    if (!generationSessionId) {
      setError('Plan review session expired. Please generate again.')
      return
    }

    setError(null)
    setIsGenerating(true)
    setPendingPlanReview(null)

    if (approved) {
      setProgress([
        { id: 0, label: STEP_LABELS[0], status: 'done' },
        { id: 1, label: STEP_LABELS[1], status: 'done' },
        { id: 2, label: STEP_LABELS[2], status: 'done' },
        { id: 3, label: STEP_LABELS[3], status: 'active' },
        { id: 4, label: STEP_LABELS[4], status: 'pending' },
      ])
    } else {
      resetProgress()
      setProgress(buildInitialProgress(0))
    }

    try {
      await runRequest('/api/generate/review', {
        sessionId: generationSessionId,
        approved,
        topic,
      })
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message))
    } finally {
      setIsGenerating(false)
    }
  }, [resetProgress, runRequest, setIsGenerating, setPendingPlanReview, setProgress])

  return { generate, submitPlanReview, error, stepLabels: STEP_LABELS }
}
