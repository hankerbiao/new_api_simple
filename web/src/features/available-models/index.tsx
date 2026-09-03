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
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Box, Check, KeyRound, RefreshCw, Search } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

import {
  CodeBlock,
  CodeBlockCopyButton,
} from '@/components/ai-elements/code-block'
import { SectionPageLayout } from '@/components/layout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getUserModels } from '@/lib/api'
import { cn } from '@/lib/utils'

import {
  buildApiExamples,
  getApiExampleEndpoint,
  normalizeAvailableModels,
} from './lib/examples'
import { FunasrWebSocketDemo } from './components/funasr-websocket-demo'
import { REQUEST_PARAMETERS } from './lib/request-parameters'

const EXAMPLE_TABS = [
  { id: 'curl', label: 'cURL' },
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
] as const

export function AvailableModels() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState('')
  const [selectedModel, setSelectedModel] = useState('')
  const modelsQuery = useQuery({
    queryKey: ['available-models'],
    queryFn: getUserModels,
    staleTime: 60 * 1000,
  })

  const models = useMemo(
    () => normalizeAvailableModels(modelsQuery.data?.data ?? []),
    [modelsQuery.data]
  )
  const filteredModels = useMemo(() => {
    const normalizedFilter = filter.trim().toLowerCase()
    if (!normalizedFilter) return models
    return models.filter((model) =>
      model.toLowerCase().includes(normalizedFilter)
    )
  }, [filter, models])
  const activeModel = models.includes(selectedModel)
    ? selectedModel
    : (models[0] ?? '')
  const gatewayBaseUrl =
    typeof window === 'undefined'
      ? 'https://your-gateway.example.com'
      : window.location.origin
  const chatEndpoint = `${gatewayBaseUrl}/v1/chat/completions`
  const apiExampleEndpoint = getApiExampleEndpoint(
    chatEndpoint,
    activeModel || 'your-model'
  )
  const examples = useMemo(
    () => buildApiExamples(chatEndpoint, activeModel || 'your-model'),
    [activeModel, chatEndpoint]
  )
  const emptyTitle =
    models.length === 0
      ? t('No available models')
      : t('No models match your search')
  const emptyDescription =
    models.length === 0
      ? t('Ask an administrator to enable a model for your group.')
      : t('Try a different search term.')

  let modelListContent: ReactNode
  if (modelsQuery.isLoading) {
    modelListContent = (
      <div className='space-y-2 p-2'>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className='h-9 w-full' />
        ))}
      </div>
    )
  } else if (modelsQuery.isError) {
    modelListContent = (
      <Alert variant='destructive' className='m-2'>
        <AlertTitle>{t('Failed to load models')}</AlertTitle>
        <AlertDescription>
          <Button
            variant='outline'
            size='sm'
            onClick={() => void modelsQuery.refetch()}
          >
            {t('Try again')}
          </Button>
        </AlertDescription>
      </Alert>
    )
  } else if (filteredModels.length === 0) {
    modelListContent = (
      <Empty className='min-h-48 border-0'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <Box />
          </EmptyMedia>
          <EmptyTitle>{emptyTitle}</EmptyTitle>
          <EmptyDescription>{emptyDescription}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  } else {
    modelListContent = (
      <div className='max-h-[min(62vh,640px)] space-y-1 overflow-y-auto pr-1'>
        {filteredModels.map((model) => {
          const isSelected = model === activeModel
          return (
            <button
              key={model}
              type='button'
              onClick={() => setSelectedModel(model)}
              aria-pressed={isSelected}
              className={cn(
                'hover:bg-muted/70 flex min-h-9 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                isSelected && 'bg-primary/10 text-primary'
              )}
            >
              <span
                className='min-w-0 flex-1 truncate font-mono text-xs'
                title={model}
              >
                {model}
              </span>
              {isSelected && (
                <Check className='size-4 shrink-0' aria-hidden='true' />
              )}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <SectionPageLayout>
      <SectionPageLayout.Title>{t('Available Models')}</SectionPageLayout.Title>
      <SectionPageLayout.Actions>
        <Button
          variant='outline'
          size='sm'
          onClick={() => void modelsQuery.refetch()}
          disabled={modelsQuery.isFetching}
        >
          <RefreshCw className={cn(modelsQuery.isFetching && 'animate-spin')} />
          {t('Refresh')}
        </Button>
      </SectionPageLayout.Actions>
      <SectionPageLayout.Content>
        <div className='grid min-h-full gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]'>
          <Card className='min-h-0'>
            <CardHeader className='border-b'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <CardTitle>{t('Models for your account')}</CardTitle>
                  <CardDescription>
                    {t('Only models available to your account are shown.')}
                  </CardDescription>
                </div>
                <Badge variant='secondary' className='shrink-0'>
                  {t('{{count}} models', { count: models.length })}
                </Badge>
              </div>
              <div className='relative pt-1'>
                <Search className='text-muted-foreground pointer-events-none absolute top-3.5 left-2.5 size-4' />
                <Input
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder={t('Search models...')}
                  aria-label={t('Search models...')}
                  className='pl-8'
                />
              </div>
            </CardHeader>
            <CardContent className='min-h-0 flex-1 p-2'>
              {modelListContent}
              <div className='mt-3 border-t pt-3'>
                <div className='flex items-start justify-between gap-2 px-2 pb-2'>
                  <div className='min-w-0'>
                    <div className='text-sm font-medium'>
                      {t('Models for your account')}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      {t('Only models available to your account are shown.')}
                    </div>
                  </div>
                  <Badge variant='secondary' className='shrink-0'>
                    {t('{{count}} models', { count: 1 })}
                  </Badge>
                </div>
                <details className='group rounded-lg border'>
                  <summary className='hover:bg-muted/70 flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-left text-sm'>
                    <span className='min-w-0 truncate font-mono text-xs'>
                      {t('FunASR Speech Recognition')}
                    </span>
                    <Badge variant='outline' className='shrink-0'>
                      {t('WebSocket')}
                    </Badge>
                  </summary>
                  <div className='border-t p-3'>
                    <FunasrWebSocketDemo />
                  </div>
                </details>
              </div>
            </CardContent>
          </Card>

          <Card className='min-w-0'>
            <CardHeader className='border-b'>
              <CardTitle>{t('How to use a model')}</CardTitle>
              <CardDescription>
                {t(
                  'Use an active API key with the OpenAI-compatible endpoint.'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-5 pt-1'>
              <div className='grid gap-3 sm:grid-cols-2'>
                <div className='bg-muted/35 min-w-0 rounded-lg border p-3'>
                  <div className='text-muted-foreground mb-1 text-xs'>
                    {t('Selected model')}
                  </div>
                  <div
                    className='truncate font-mono text-sm'
                    title={activeModel}
                  >
                    {activeModel || t('No available models')}
                  </div>
                </div>
                <div className='bg-muted/35 min-w-0 rounded-lg border p-3'>
                  <div className='text-muted-foreground mb-1 text-xs'>
                    {t('API endpoint')}
                  </div>
                  <div
                    className='truncate font-mono text-sm'
                    title={apiExampleEndpoint.url}
                  >
                    {apiExampleEndpoint.url.replace(gatewayBaseUrl, '')}
                  </div>
                </div>
              </div>

              <div className='flex flex-wrap items-center gap-2 text-sm'>
                <KeyRound
                  className='text-muted-foreground size-4'
                  aria-hidden='true'
                />
                <span className='text-muted-foreground'>
                  {t('Need an API key?')}
                </span>
                <Link
                  to='/keys'
                  className='text-primary inline-flex items-center font-medium hover:underline'
                >
                  {t('Manage API Keys')}
                </Link>
              </div>

              <div>
                <div className='mb-2 flex items-center justify-between gap-3'>
                  <div>
                    <h3 className='text-sm font-medium'>
                      {t('Request examples')}
                    </h3>
                    <p className='text-muted-foreground text-xs'>
                      {t('Replace sk-... with an active API key.')}
                    </p>
                  </div>
                </div>
                <Tabs defaultValue='curl'>
                  <TabsList className='w-full sm:w-fit'>
                    {EXAMPLE_TABS.map((tab) => (
                      <TabsTrigger key={tab.id} value={tab.id}>
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {examples.map((example) => (
                    <TabsContent key={example.id} value={example.id}>
                      <CodeBlock
                        code={example.code}
                        language={example.language}
                        showToolbar
                        title={example.language}
                      >
                        <CodeBlockCopyButton />
                      </CodeBlock>
                    </TabsContent>
                  ))}
                </Tabs>
              </div>

              <div>
                <h3 className='text-sm font-medium'>
                  {t('List models through the API')}
                </h3>
                <CodeBlock
                  code={`curl ${gatewayBaseUrl}/v1/models \\\n  -H "Authorization: Bearer sk-..."`}
                  language='bash'
                  showToolbar
                  title={t('Model list endpoint')}
                >
                  <CodeBlockCopyButton />
                </CodeBlock>
              </div>
            </CardContent>
          </Card>

          <Card className='min-w-0 lg:col-span-2'>
            <CardHeader className='border-b'>
              <CardTitle>{t('Supported request parameters')}</CardTitle>
              <CardDescription>
                {t(
                  'These parameters apply to the OpenAI-compatible chat endpoint. Support may vary by model and upstream provider.'
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Parameter')}</TableHead>
                    <TableHead>{t('Type')}</TableHead>
                    <TableHead>{t('Support scope')}</TableHead>
                    <TableHead>{t('Description')}</TableHead>
                    <TableHead>{t('Default / range')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {REQUEST_PARAMETERS.map((parameter) => (
                    <TableRow key={parameter.name}>
                      <TableCell className='font-mono font-medium'>
                        {parameter.name}
                      </TableCell>
                      <TableCell className='font-mono text-xs'>
                        {parameter.type}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            parameter.availability === 'common'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {t(
                            parameter.availability === 'common'
                              ? 'Common'
                              : 'Model-dependent'
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className='min-w-64 whitespace-normal'>
                        {t(parameter.descriptionKey)}
                      </TableCell>
                      <TableCell className='text-muted-foreground whitespace-normal'>
                        {parameter.details ? t(parameter.details) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </SectionPageLayout.Content>
    </SectionPageLayout>
  )
}
