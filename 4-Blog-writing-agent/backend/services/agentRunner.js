const { spawn } = require('child_process');
const path = require('path');

function buildFriendlyAgentError(rawMessage) {
  const message = rawMessage || 'Generation failed';

  if (message.includes('groq.RateLimitError') || message.includes('Rate limit reached for model')) {
    const retryMatch = message.match(/Please try again in\s+([^.]+(?:\.\d+)?s?)/i);
    const retryAfter = retryMatch ? retryMatch[1].trim() : null;
    const friendlyMessage = retryAfter
      ? `Groq rate limit reached for the blog model. Please try again in about ${retryAfter}.`
      : 'Groq rate limit reached for the blog model. Please try again later.';

    const error = new Error(friendlyMessage);
    error.userMessage = friendlyMessage;
    return error;
  }

  const quotaMatch = message.match(/Need more tokens\?/i);
  if (quotaMatch) {
    const friendlyMessage = 'The Groq daily token quota has been exhausted for this project. Please wait and try again later.';
    const error = new Error(friendlyMessage);
    error.userMessage = friendlyMessage;
    return error;
  }

  const error = new Error(message);
  error.userMessage = message;
  return error;
}

/**
 * Runs the Python LangGraph blog-writing agent and streams progress steps via a callback.
 * 
 * @param {Object} params - { topic, mode, audience, tone, targetWordCount, includeCode, includeCitations, includeImages }
 * @param {Function} onStep - callback(stepIndex, status) for progress updates
 * @returns {Promise<Object>} - The generated blog data
 */
async function runAgent(params, onStep) {
  const { topic, llmProvider, llmModel } = params;

  return new Promise((resolve, reject) => {
    // Step 0: Routing
    onStep(0, 'active');

    // backend/services/ -> backend/ -> 4-Blog-writing-agent/  (go up 2 levels)
    const agentScriptDir = path.resolve(__dirname, '..', '..');
    const wrapperScript = path.resolve(__dirname, 'agent_wrapper.py');
    const pythonCommand = process.platform === 'win32' ? 'py' : 'python3';
    const provider = llmProvider || 'groq';
    const model = llmModel || '';
    const payload = JSON.stringify({
      ...params,
      topic,
      llmProvider: provider,
      llmModel: model,
    });
    const pythonArgs = [wrapperScript, payload];

    const child = spawn(pythonCommand, pythonArgs, {
      cwd: agentScriptDir,
      env: {
        ...process.env,
        PYTHONIOENCODING: 'utf-8',
      },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;

      // Parse step updates from stdout
      const lines = text.split('\n');
      for (const line of lines) {
        if (line.startsWith('STEP:')) {
          try {
            const stepData = JSON.parse(line.slice(5));
            onStep(stepData.index, stepData.status);
          } catch (e) {
            // ignore
          }
        }
      }
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(buildFriendlyAgentError(`Agent exited with code ${code}: ${stderr}`));
        return;
      }

      // Find the JSON result in stdout
      try {
        const jsonMatch = stdout.match(/RESULT:(.*)/s);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[1]);
          resolve(result);
        } else {
          reject(buildFriendlyAgentError('No result found in agent output'));
        }
      } catch (e) {
        reject(buildFriendlyAgentError(`Failed to parse agent output: ${e.message}`));
      }
    });

    child.on('error', (err) => {
      reject(buildFriendlyAgentError(err.message || 'Failed to start agent process'));
    });
  });
}

module.exports = {
  runAgent,
};
