import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const IMAGE_ENDPOINT = '/api/ai-stylist-image'

const readJsonBody = async (req) =>
  await new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
      if (body.length > 1_000_000) {
        reject(new Error('Payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch {
        reject(new Error('Invalid JSON payload'))
      }
    })
    req.on('error', reject)
  })

const sendJson = (res, statusCode, payload) => {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}

const aiStylistImageApiPlugin = ({ apiKey, imageModel }) => {
  const handler = async (req, res, next) => {
    if (req.url !== IMAGE_ENDPOINT || req.method !== 'POST') {
      next()
      return
    }

    if (!apiKey) {
      sendJson(res, 500, { error: 'OPENAI_API_KEY is missing in environment.' })
      return
    }

    try {
      const body = await readJsonBody(req)
      const prompt = String(body?.prompt || '').trim()
      const size = String(body?.size || '1024x1024')
      const quality = String(body?.quality || 'medium')
      const model = String(imageModel || 'gpt-image-1')

      if (!prompt) {
        sendJson(res, 400, { error: 'Prompt is required.' })
        return
      }

      const openAiResp = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          prompt,
          size,
          quality,
        }),
      })

      const result = await openAiResp.json()
      if (!openAiResp.ok) {
        const msg = result?.error?.message || 'OpenAI image generation failed.'
        sendJson(res, openAiResp.status, { error: msg })
        return
      }

      const img = result?.data?.[0]
      if (!img) {
        sendJson(res, 502, { error: 'No image returned from OpenAI.' })
        return
      }

      const imageDataUrl = img.b64_json ? `data:image/png;base64,${img.b64_json}` : img.url || ''
      if (!imageDataUrl) {
        sendJson(res, 502, { error: 'Image payload missing from OpenAI response.' })
        return
      }

      sendJson(res, 200, {
        imageDataUrl,
      })
    } catch (error) {
      sendJson(res, 500, { error: error?.message || 'Unexpected server error.' })
    }
  }

  return {
    name: 'ai-stylist-image-api',
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || ''
  const imageModel = env.OPENAI_IMAGE_MODEL || process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1'

  return {
    plugins: [
      react(),
      aiStylistImageApiPlugin({
        apiKey,
        imageModel,
      }),
    ],
  }
})
