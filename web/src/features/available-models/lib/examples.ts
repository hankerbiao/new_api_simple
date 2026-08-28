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

export function normalizeAvailableModels(models: readonly string[]): string[] {
  return [...new Set(models.map((model) => model.trim()).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b)
  )
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", "'\\''")}'`
}

export function buildApiExamples(
  endpoint: string,
  model: string
): ApiExample[] {
  const payload = JSON.stringify({
    model,
    messages: [{ role: 'user', content: 'Say hello in one sentence.' }],
  })

  return [
    {
      id: 'curl',
      language: 'bash',
      code: [
        `curl ${endpoint} \\`,
        '  -H "Content-Type: application/json" \\',
        '  -H "Authorization: Bearer sk-..." \\',
        `  -d ${shellQuote(payload)}`,
      ].join('\n'),
    },
    {
      id: 'python',
      language: 'python',
      code: [
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
      ].join('\n'),
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
        '  body: JSON.stringify({',
        `    model: ${JSON.stringify(model)},`,
        "    messages: [{ role: 'user', content: 'Say hello in one sentence.' }],",
        '  }),',
        '})',
        '',
        'const data = await response.json()',
        'console.log(data.choices[0].message.content)',
      ].join('\n'),
    },
  ]
}
