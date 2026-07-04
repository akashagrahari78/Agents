import { useState, useCallback, useEffect, useRef } from 'react'
import { useUserContext } from '../context/userContext'
import { buildApiUrl } from '../utils/api'

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
    updateProgress,
    resetProgress,
    setProgress,
    setGeneratedBlog,
    setPendingPlanReview,
    setGenerationSessionId,
    token,
    progress,
    generationSessionId,
  } = useUserContext()

  const [error, setError] = useState(null)
  const tokenRef = useRef(token)
  const progressRef = useRef(progress)
  const generationSessionIdRef = useRef(generationSessionId)

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    generationSessionIdRef.current = generationSessionId
  }, [generationSessionId])

  const setProgressWithRef = useCallback((nextProgress) => {
    progressRef.current = nextProgress
    setProgress(nextProgress)
  }, [setProgress])

  const updateProgressWithRef = useCallback((index, updates) => {
    progressRef.current = progressRef.current.map((step, stepIndex) => (
      stepIndex === index ? { ...step, ...updates } : step
    ))
    updateProgress(index, updates)
  }, [updateProgress])

  const setGenerationSessionIdWithRef = useCallback((sessionId) => {
    generationSessionIdRef.current = sessionId
    setGenerationSessionId(sessionId)
  }, [setGenerationSessionId])

  const runRequest = useCallback(async (url, body) => {
    const headers = { 'Content-Type': 'application/json' }
    if (tokenRef.current) headers.Authorization = `Bearer ${tokenRef.current}`

    const response = await fetch(buildApiUrl(url), {
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
            const currentProgress = progressRef.current
            for (let index = 0; index < data.stepIndex; index += 1) {
              const step = currentProgress[index]
              if (step && step.status !== 'done' && step.status !== 'error') {
                updateProgressWithRef(index, { status: 'done' })
              }
            }
          }
          updateProgressWithRef(data.stepIndex, { status: data.status })
        }
        return
      }

      if (data.type === 'plan_review') {
        setProgressWithRef([
          { id: 0, label: STEP_LABELS[0], status: 'done' },
          { id: 1, label: STEP_LABELS[1], status: 'done' },
          { id: 2, label: STEP_LABELS[2], status: 'done' },
          { id: 3, label: STEP_LABELS[3], status: 'pending' },
          { id: 4, label: STEP_LABELS[4], status: 'pending' },
        ])
        setPendingPlanReview(data.review)
        setGenerationSessionIdWithRef(data.sessionId)
        return
      }

      if (data.type === 'complete') {
        setPendingPlanReview(null)
        setGenerationSessionIdWithRef(null)
        setGeneratedBlog(data.blog)
        return
      }

      if (data.type === 'error') {
        const activeStepIndex = progressRef.current.findIndex((step) => step.status === 'active')
        if (activeStepIndex !== -1) {
          updateProgressWithRef(activeStepIndex, { status: 'error' })
        }
        setError(getFriendlyErrorMessage(data.message))
      }
    })
  }, [setGeneratedBlog, setGenerationSessionIdWithRef, setPendingPlanReview, setProgressWithRef, updateProgressWithRef])

  const generate = useCallback(async (formData) => {
    setError(null)
    resetProgress()
    setIsGenerating(true)
    setGeneratedBlog(null)
    setPendingPlanReview(null)
    setGenerationSessionIdWithRef(null)
    setProgressWithRef(buildInitialProgress())

    try {
      await runRequest('/api/generate', formData)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message))
    } finally {
      setIsGenerating(false)
    }
  }, [resetProgress, runRequest, setGeneratedBlog, setGenerationSessionIdWithRef, setIsGenerating, setPendingPlanReview, setProgressWithRef])

  const submitPlanReview = useCallback(async ({ approved, topic }) => {
    const generationSessionId = generationSessionIdRef.current
    if (!generationSessionId) {
      setError('Plan review session expired. Please generate again.')
      return
    }

    setError(null)
    setIsGenerating(true)
    setPendingPlanReview(null)

    if (approved) {
      setProgressWithRef([
        { id: 0, label: STEP_LABELS[0], status: 'done' },
        { id: 1, label: STEP_LABELS[1], status: 'done' },
        { id: 2, label: STEP_LABELS[2], status: 'done' },
        { id: 3, label: STEP_LABELS[3], status: 'active' },
        { id: 4, label: STEP_LABELS[4], status: 'pending' },
      ])
    } else {
      resetProgress()
      setProgressWithRef(buildInitialProgress(0))
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
  }, [resetProgress, runRequest, setIsGenerating, setPendingPlanReview, setProgressWithRef])

  return { generate, submitPlanReview, error, stepLabels: STEP_LABELS }
}
