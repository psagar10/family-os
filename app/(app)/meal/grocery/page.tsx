'use client'

import { useState, useEffect } from 'react'
import { AppLayout } from '@/components/layout/app-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ShoppingCart, 
  Check, 
  Plus, 
  Minus, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

interface GroceryItem {
  name: string
  quantity: number
  unit: string
  category: string
  inPantry: number
  deficit: number
  recipes: string[]
  checked?: boolean
}

const CATEGORIES_ORDER = [
  'Produce',
  'Meat & Poultry',
  'Seafood',
  'Dairy',
  'Bakery',
  'Grains & Pasta',
  'Baking',
  'Pantry',
  'Other'
]

export default function GroceryPage() {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>([])

  useEffect(() => {
    loadGroceryList()
  }, [])

  async function loadGroceryList() {
    setLoading(true)
    try {
      // For demo, generate sample data based on active meal plan
      // In production, this would fetch from API based on meal plan
      const sampleItems: GroceryItem[] = [
        { name: 'Chicken Breast', quantity: 2, unit: 'lb', category: 'Meat & Poultry', inPantry: 0, deficit: 2, recipes: ['Grilled Chicken'] },
        { name: 'Brown Rice', quantity: 2, unit: 'cup', category: 'Grains & Pasta', inPantry: 1, deficit: 1, recipes: ['Stir Fry'] },
        { name: 'Broccoli', quantity: 2, unit: 'piece', category: 'Produce', inPantry: 0, deficit: 2, recipes: ['Stir Fry'] },
        { name: 'Olive Oil', quantity: 2, unit: 'tbsp', category: 'Pantry', inPantry: 5, deficit: 0, recipes: ['Grilled Chicken'] },
        { name: 'Eggs', quantity: 12, unit: 'piece', category: 'Dairy', inPantry: 6, deficit: 6, recipes: ['Breakfast Omelette'] },
        { name: 'Milk', quantity: 1, unit: 'l', category: 'Dairy', inPantry: 0, deficit: 1, recipes: ['Breakfast Omelette'] },
        { name: 'Spinach', quantity: 1, unit: 'bag', category: 'Produce', inPantry: 0, deficit: 1, recipes: ['Breakfast Omelette'] },
        { name: 'Salmon Fillet', quantity: 1, unit: 'lb', category: 'Seafood', inPantry: 0, deficit: 1, recipes: ['Baked Salmon'] },
        { name: 'Lemon', quantity: 2, unit: 'piece', category: 'Produce', inPantry: 0, deficit: 2, recipes: ['Baked Salmon'] },
        { name: 'Garlic', quantity: 4, unit: 'piece', category: 'Produce', inPantry: 2, deficit: 2, recipes: ['Baked Salmon', 'Stir Fry'] },
        { name: 'Bread', quantity: 1, unit: 'loaf', category: 'Bakery', inPantry: 0, deficit: 1, recipes: ['Sandwiches'] },
        { name: 'Cheese', quantity: 200, unit: 'g', category: 'Dairy', inPantry: 100, deficit: 100, recipes: ['Sandwiches'] },
      ]
      
      setItems(sampleItems)
      
      // Extract unique categories
      const cats = Array.from(new Set(sampleItems.map(i => i.category)))
      cats.sort((a, b) => {
        const aIdx = CATEGORIES_ORDER.indexOf(a)
        const bIdx = CATEGORIES_ORDER.indexOf(b)
        return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
      })
      setCategories(cats)
    } catch (e) {
      console.error('Failed to load grocery list')
    }
    setLoading(false)
  }

  function toggleItem(index: number) {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, checked: !item.checked } : item
    ))
  }

  function adjustQuantity(index: number, delta: number) {
    setItems(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ))
  }

  const totalItems = items.length
  const checkedItems = items.filter(i => i.checked).length
  const deficitItems = items.filter(i => i.deficit > 0).length

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Grocery List</h1>
            <p className="text-muted-foreground">
              {checkedItems}/{totalItems} items checked
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadGroceryList}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Generate from Meal Plan
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{totalItems}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Need to Buy</p>
              <p className="text-2xl font-bold text-orange-600">{deficitItems}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">In Pantry</p>
              <p className="text-2xl font-bold text-green-600">
                {items.filter(i => i.deficit === 0).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${totalItems > 0 ? (checkedItems / totalItems) * 100 : 0}%` }}
          />
        </div>

        {/* Category Sections */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : (
          <div className="space-y-6">
            {categories.map(category => {
              const categoryItems = items.filter(i => i.category === category)
              const categoryChecked = categoryItems.filter(i => i.checked).length

              return (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{category}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {categoryChecked}/{categoryItems.length}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categoryItems.map((item, idx) => {
                      const globalIdx = items.indexOf(item)
                      return (
                        <div 
                          key={idx}
                          className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                            item.checked ? 'bg-green-50' : 'hover:bg-accent'
                          }`}
                        >
                          <Checkbox 
                            checked={item.checked}
                            onCheckedChange={() => toggleItem(globalIdx)}
                          />
                          <div className="flex-1">
                            <p className={`font-medium ${item.checked ? 'line-through text-muted-foreground' : ''}`}>
                              {item.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.quantity} {item.unit}
                              {item.deficit > 0 && (
                                <span className="text-orange-600 ml-2">
                                  (need {item.deficit})
                                </span>
                              )}
                              {item.deficit === 0 && (
                                <span className="text-green-600 ml-2">
                                  (in pantry)
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => adjustQuantity(globalIdx, -1)}
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                            <Input 
                              className="w-16 h-8 text-center"
                              type="number"
                              value={item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0
                                setItems(prev => prev.map((it, i) => 
                                  i === globalIdx ? { ...it, quantity: val } : it
                                ))
                              }}
                            />
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => adjustQuantity(globalIdx, 1)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {items.length === 0 && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No items in your grocery list.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Generate a grocery list from your meal plan.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
