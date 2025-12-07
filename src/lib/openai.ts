// lib/openai.ts
// Client OpenAI centralisé et réutilisable

type OpenAIMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type OpenAIConfig = {
  apiKey: string
  model?: string
  temperature?: number
  maxRetries?: number
  timeout?: number
}

export class OpenAIClient {
  private apiKey: string
  private model: string
  private temperature: number
  private maxRetries: number
  private timeout: number

  constructor(config: OpenAIConfig) {
    this.apiKey = config.apiKey
    this.model = config.model || 'gpt-4o-mini'
    this.temperature = config.temperature || 0.3
    this.maxRetries = config.maxRetries || 2
    this.timeout = config.timeout || 30000
  }

  async chat(messages: OpenAIMessage[], options?: { jsonMode?: boolean }): Promise<string> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), this.timeout)

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            temperature: this.temperature,
            ...(options?.jsonMode && { response_format: { type: 'json_object' } }),
          }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text().catch(() => '')
          const errorMsg = `OpenAI HTTP ${response.status}: ${errorText}`

          // Retry sur erreurs 5xx ou rate limit
          if ((response.status >= 500 || response.status === 429) && attempt < this.maxRetries) {
            await this.delay(1000 * (attempt + 1))
            continue
          }

          throw new Error(errorMsg)
        }

        const data = await response.json() as any
        const content = data?.choices?.[0]?.message?.content

        if (!content || typeof content !== 'string') {
          throw new Error('Reponse OpenAI invalide: contenu manquant')
        }

        return content
      } catch (error: any) {
        if (error.name === 'AbortError') {
          if (attempt < this.maxRetries) {
            await this.delay(1000 * (attempt + 1))
            continue
          }
          throw new Error("Timeout lors de l'appel OpenAI")
        }

        if (attempt < this.maxRetries) {
          await this.delay(1000 * (attempt + 1))
          continue
        }

        throw error
      }
    }

    throw new Error('Echec apres tous les essais')
  }

  async chatJSON<T>(messages: OpenAIMessage[]): Promise<T> {
    const content = await this.chat(messages, { jsonMode: true })
    
    try {
      return JSON.parse(content) as T
    } catch (parseError) {
      throw new Error(`JSON OpenAI non parseable: ${parseError}`)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Helper pour créer un client OpenAI avec les env vars
export function createOpenAIClient(apiKey: string, model?: string): OpenAIClient {
  return new OpenAIClient({
    apiKey,
    model: model || 'gpt-4o-mini',
    temperature: 0.3,
    maxRetries: 2,
    timeout: 30000,
  })
}


