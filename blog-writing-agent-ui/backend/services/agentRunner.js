import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Runs the Python LangGraph blog-writing agent and streams progress steps via a callback.
 * 
 * @param {Object} params - { topic, mode, audience, tone, targetWordCount, includeCode, includeCitations, includeImages }
 * @param {Function} onStep - callback(stepIndex, status) for progress updates
 * @returns {Promise<Object>} - The generated blog data
 */
export async function runAgent(params, onStep) {
  const { topic, mode } = params;

  return new Promise((resolve, reject) => {
    // Step 0: Routing
    onStep(0, 'active');

    const agentScriptDir = path.resolve(__dirname, '..', '..', '..', '4-Blog-writing-agent');
    const agentScript = path.join(agentScriptDir, 'main.py');

    // We'll use a wrapper script that outputs JSON progress
    const wrapperScript = path.resolve(__dirname, 'agent_wrapper.py');

    const child = spawn('python', [wrapperScript, topic, mode || 'hybrid'], {
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
        reject(new Error(`Agent exited with code ${code}: ${stderr}`));
        return;
      }

      // Find the JSON result in stdout
      try {
        const jsonMatch = stdout.match(/RESULT:(.*)/s);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[1]);
          resolve(result);
        } else {
          reject(new Error('No result found in agent output'));
        }
      } catch (e) {
        reject(new Error(`Failed to parse agent output: ${e.message}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
}
