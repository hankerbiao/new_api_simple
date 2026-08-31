/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
export type ApiExample = {
  id: 'curl' | 'python' | 'javascript'
  language: string
  code: string
}

type ApiRequestType = 'chat' | 'embedding' | 'rerank'

export type ApiExampleEndpoint = {
  url: string
  requestType: ApiRequestType
}

export function normalizeAvailableModels(models: readonly string[]): string[] {
  return [...new Set(models.map((model) => model.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b)
  )
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

export function getApiExampleEndpoint(
  chatEndpoint: string,
  model: string
): ApiExampleEndpoint {
  const gatewayBaseUrl = chatEndpoint.replace(/\/v1\/chat\/completions\/?$/, '')
  const normalizedModel = model.toLowerCase()

  if (normalizedModel.includes('rerank')) {
    return { url: `${gatewayBaseUrl}/v1/rerank`, requestType: 'rerank' }
  }
  if (normalizedModel.includes('embedding')) {
    return {
      url: `${gatewayBaseUrl}/v1/embeddings`,
      requestType: 'embedding',
    }
  }
  return { url: chatEndpoint, requestType: 'chat' }
}

export function buildApiExamples(
  chatEndpoint: string,
  model: string
): ApiExample[] {
  const { url: endpoint, requestType } = getApiExampleEndpoint(
    chatEndpoint,
    model
  )
  let payload: Record<string, unknown> = {
    model,
    messages: [{ role: 'user', content: 'Say hello in one sentence.' }],
  }
  if (requestType === 'embedding') {
    payload = { model, input: ['Text to embed'] }
  } else if (requestType === 'rerank') {
    payload = {
      model,
      query: 'How to change a tire',
      documents: [
        'Instructions for changing a car tire',
        'A collection of recipes',
        'How to handle a flat tire',
      ],
    }
  }
  const payloadJson = JSON.stringify(payload)

  let pythonCode = [
    'from openai import OpenAI',
    '',
    'client = OpenAI(',
    `    base_url=${JSON.stringify(endpoint.replace('/chat/completions', ''))},`,
    '    api_key="sk-...",',
    ')',
    '',
    'response = client.chat.completions.create(',
    `    model=${JSON.stringify(model)},`,
    '    messages=[{"role": "user", "content": "Say hello in one sentence."}],',
    ')',
    'print(response.choices[0].message.content)',
  ].join('\n')
  if (requestType === 'embedding') {
    pythonCode = [
      'from openai import OpenAI',
      '',
      'client = OpenAI(',
      `    base_url=${JSON.stringify(endpoint.replace('/embeddings', ''))},`,
      '    api_key="sk-...",',
      ')',
      '',
      'response = client.embeddings.create(',
      `    model=${JSON.stringify(model)},`,
      '    input=["Text to embed"],',
      ')',
      'print(response.data[0].embedding)',
    ].join('\n')
  } else if (requestType === 'rerank') {
    pythonCode = [
      'import json',
      'from urllib.request import Request, urlopen',
      '',
      `request = Request(${JSON.stringify(endpoint)},`,
      `    data=${JSON.stringify(payloadJson)}.encode('utf-8'),`,
      "    headers={'Authorization': 'Bearer sk-...', 'Content-Type': 'application/json'},",
      "    method='POST')",
      '',
      'with urlopen(request) as response:',
      '    print(json.load(response))',
    ].join('\n')
  }

  const javascriptResult =
    requestType === 'chat'
      ? 'console.log(data.choices[0].message.content)'
      : 'console.log(data)'

  return [
    {
      id: 'curl',
      language: 'bash',
      code: [
        `curl ${endpoint} \\`,
        '  -H "Content-Type: application/json" \\',
        '  -H "Authorization: Bearer sk-..." \\',
        `  -d ${shellQuote(payloadJson)}`,
      ].join('\n'),
    },
    {
      id: 'python',
      language: 'python',
      code: pythonCode,
    },
    {
      id: 'javascript',
      language: 'javascript',
      code: [
        `const response = await fetch(${JSON.stringify(endpoint)}, {`,
        "  method: 'POST',",
        '  headers: {',
        "    'Content-Type': 'application/json',",
        "    Authorization: 'Bearer sk-...',",
        '  },',
        `  body: JSON.stringify(${JSON.stringify(payload, null, 2)}),`,
        '})',
        '',
        'const data = await response.json()',
        javascriptResult,
      ].join('\n'),
    },
  ]
}
