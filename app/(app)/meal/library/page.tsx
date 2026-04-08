'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Youtube, Globe, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MealLibraryPage() {
  const router = useRouter()
  const [sourceType, setSourceType] = useState<'youtube' | 'instagram' | 'webpage' | 'text'>('youtube')
  const [source, setSource] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/meal/recipes/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, sourceType }),
      })

      const result = await response.json()

      if (result.success) {
        router.push(`/meal/library/${result.recipeId}`)
      } else {
        setError(result.error || 'Failed to ingest recipe')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }

    setIsLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Recipe Library</h1>
        <Button onClick={() => router.push('/meal/library/new')}>
          <Plus className="w-4 h-4 mr-2" />
          Add Recipe Manually
        </Button>
      </div>

      {/* Add Recipe Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Recipe from URL or Text</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleIngest} className="space-y-4">
            {/* Source Type Tabs */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant={sourceType === 'youtube' ? 'default' : 'outline'}
                onClick={() => setSourceType('youtube')}
                size="sm"
              >
                <Youtube className="w-4 h-4 mr-1" />
                YouTube
              </Button>
              <Button
                type="button"
                variant={sourceType === 'instagram' ? 'default' : 'outline'}
                onClick={() => setSourceType('instagram')}
                size="sm"
              >
                <Globe className="w-4 h-4 mr-1" />
                Instagram
              </Button>
              <Button
                type="button"
                variant={sourceType === 'webpage' ? 'default' : 'outline'}
                onClick={() => setSourceType('webpage')}
                size="sm"
              >
                <Globe className="w-4 h-4 mr-1" />
                Blog/Webpage
              </Button>
              <Button
                type="button"
                variant={sourceType === 'text' ? 'default' : 'outline'}
                onClick={() => setSourceType('text')}
                size="sm"
              >
                <FileText className="w-4 h-4 mr-1" />
                Paste Text
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">
                {sourceType === 'text' ? 'Recipe Text' : 'URL'}
              </Label>
              {sourceType === 'text' ? (
                <textarea
                  id="source"
                  className="w-full h-40 p-3 border rounded-md"
                  placeholder="Paste your recipe text here..."
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              ) : (
                <Input
                  id="source"
                  type="url"
                  placeholder={
                    sourceType === 'youtube'
                      ? 'https://www.youtube.com/watch?v=...'
                      : sourceType === 'instagram'
                      ? 'https://www.instagram.com/p/...'
                      : 'https://...'
                  }
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                />
              )}
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <Button type="submit" disabled={!source || isLoading}>
              {isLoading ? 'Extracting Recipe...' : 'Extract Recipe'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Recipe List (placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle>Your Recipes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500">
            <p>No recipes yet.</p>
            <p className="text-sm mt-2">Add your first recipe above to get started!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
