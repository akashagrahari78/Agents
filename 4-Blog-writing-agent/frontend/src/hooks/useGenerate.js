import { useState, useCallback, useContext, useEffect, useRef } from 'react'
import { userContext } from '../context/userContext'
import { buildApiUrl } from '../utils/api'

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
      } catch {
        // Ignore malformed SSE payloads
      }
    }
  }
}

export function useGenerate() {
  const {
    setIsGenerating,
    setGeneratedBlog,
    setPendingPlanReview,
    setGenerationSessionId,
    token,
    generationSessionId,
  } = useContext(userContext)

  const [error, setError] = useState(null)
  const tokenRef = useRef(token)
  const generationSessionIdRef = useRef(generationSessionId)

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  useEffect(() => {
    generationSessionIdRef.current = generationSessionId
  }, [generationSessionId])

  const setGenerationSessionIdWithRef = useCallback((sessionId) => {
    generationSessionIdRef.current = sessionId
    setGenerationSessionId(sessionId)
  }, [setGenerationSessionId])

  const runRequest = useCallback(async (url, body) => {
    const headers = { 'Content-Type': 'application/json' }
    if (tokenRef.current) headers.Authorization = `Bearer ${tokenRef.current}`

    // doing a request to backend
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
        return
      }

      if (data.type === 'plan_review') {
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
        setError(getFriendlyErrorMessage(data.message))
      }
    })
  }, [setGeneratedBlog, setGenerationSessionIdWithRef, setPendingPlanReview])


  const generate = useCallback(async (formData) => {
    setError(null)
    setIsGenerating(true)
    setGeneratedBlog(null)
    setPendingPlanReview(null)
    setGenerationSessionIdWithRef(null)

    try {
      await runRequest('/api/generate', formData)
    } catch (err) {
      setError(getFriendlyErrorMessage(err.message))
    } finally {
      setIsGenerating(false)
    }
  }, [runRequest, setGeneratedBlog, setGenerationSessionIdWithRef, setIsGenerating, setPendingPlanReview])



  // this function resumes a paused blog generation session after the user says yes or no for the plan, then waits for the backend to finish streaming the result.
  const submitPlanReview = useCallback(async ({ approved, topic }) => {
    const generationSessionId = generationSessionIdRef.current
    if (!generationSessionId) {
      setError('Plan review session expired. Please generate again.')
      return
    }

    setError(null)
    setIsGenerating(true)
    setPendingPlanReview(null)

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
  }, [runRequest, setIsGenerating, setPendingPlanReview])

  return { generate, submitPlanReview, error }
}
