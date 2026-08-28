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
export type RequestParameter = {
  name: string
  type: string
  availability: 'common' | 'model-dependent'
  descriptionKey: string
  details?: string
}

export const REQUEST_PARAMETERS: readonly RequestParameter[] = [
  {
    name: 'model',
    type: 'string',
    availability: 'common',
    descriptionKey: 'The model ID to invoke from the available model list.',
    details: 'Required',
  },
  {
    name: 'messages',
    type: 'array',
    availability: 'common',
    descriptionKey: 'Conversation messages sent to the model.',
    details: 'Required',
  },
  {
    name: 'stream',
    type: 'boolean',
    availability: 'common',
    descriptionKey: 'Whether to return tokens incrementally over SSE.',
    details: 'Default: false',
  },
  {
    name: 'temperature',
    type: 'number',
    availability: 'model-dependent',
    descriptionKey: 'Controls randomness; lower values are more deterministic.',
    details: '0 ~ 2; default: 1',
  },
  {
    name: 'top_p',
    type: 'number',
    availability: 'model-dependent',
    descriptionKey: 'Nucleus sampling probability mass.',
    details: '0 ~ 1; default: 1',
  },
  {
    name: 'max_tokens',
    type: 'integer',
    availability: 'common',
    descriptionKey: 'Maximum number of output tokens.',
    details: 'Minimum: 1',
  },
  {
    name: 'max_completion_tokens',
    type: 'integer',
    availability: 'model-dependent',
    descriptionKey:
      'Output and reasoning token limit for compatible reasoning models.',
    details: 'Minimum: 1',
  },
  {
    name: 'stop',
    type: 'string | array',
    availability: 'model-dependent',
    descriptionKey:
      'Stops generation when one of the supplied sequences is reached.',
    details: 'Up to 4 sequences',
  },
  {
    name: 'tools',
    type: 'array',
    availability: 'model-dependent',
    descriptionKey: 'Function definitions that the model may choose to call.',
  },
  {
    name: 'tool_choice',
    type: 'string | object',
    availability: 'model-dependent',
    descriptionKey: 'Controls whether and which tool the model should call.',
    details: 'auto | none | required',
  },
  {
    name: 'response_format',
    type: 'object',
    availability: 'model-dependent',
    descriptionKey: 'Requests text, JSON object, or schema-conforming output.',
    details: 'text | json_object | json_schema',
  },
  {
    name: 'frequency_penalty',
    type: 'number',
    availability: 'model-dependent',
    descriptionKey: 'Reduces repetition of tokens that have already appeared.',
    details: '-2 ~ 2; default: 0',
  },
  {
    name: 'presence_penalty',
    type: 'number',
    availability: 'model-dependent',
    descriptionKey: 'Encourages the model to introduce new topics.',
    details: '-2 ~ 2; default: 0',
  },
  {
    name: 'user',
    type: 'string',
    availability: 'common',
    descriptionKey: 'Optional end-user identifier for abuse monitoring.',
  },
]
