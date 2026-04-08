'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/components/providers/auth-provider'
import { Bell, MessageCircle, Key, User, Check, AlertCircle } from 'lucide-react'

export default function SettingsPage() {
  const { currentMember } = useAuth()
  const [notifications, setNotifications] = useState({
    push: true,
    telegram: false,
    mealReminders: true,
    taskReminders: true,
  })
  const [telegramChatId, setTelegramChatId] = useState('')
  const [botUsername, setBotUsername] = useState('')
  const [apiKeys, setApiKeys] = useState({
    minimax: '',
    rapidapi: '',
  })
  const [saved, setSaved] = useState<string | null>(null)

  const handleSave = (section: string) => {
    setSaved(section)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your Family OS configuration</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="telegram">Telegram</TabsTrigger>
          <TabsTrigger value="api">API Keys</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications from Family OS
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications in your browser
                  </p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, push: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Telegram Bot</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notifications via Telegram
                  </p>
                </div>
                <Switch
                  checked={notifications.telegram}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, telegram: checked })}
                />
              </div>

              <hr />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Meal Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded when it&apos;s time to cook
                  </p>
                </div>
                <Switch
                  checked={notifications.mealReminders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, mealReminders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded about scheduled tasks
                  </p>
                </div>
                <Switch
                  checked={notifications.taskReminders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, taskReminders: checked })}
                />
              </div>

              <Button onClick={() => handleSave('notifications')}>
                {saved === 'notifications' && <Check className="w-4 h-4 mr-2" />}
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Telegram Tab */}
        <TabsContent value="telegram">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Telegram Integration
              </CardTitle>
              <CardDescription>
                Connect Family OS to your Telegram bot for notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Setup Instructions
                </h4>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Create a bot via <strong>@BotFather</strong> on Telegram</li>
                  <li>Copy your bot token to the API Keys tab</li>
                  <li>Start a chat with your bot and send <code className="bg-background px-1 rounded">/start</code></li>
                  <li>Message <strong>@userinfobot</strong> to get your Chat ID</li>
                  <li>Enter your Chat ID below to link your account</li>
                </ol>
              </div>

              <div className="space-y-2">
                <Label htmlFor="botUsername">Bot Username</Label>
                <Input
                  id="botUsername"
                  placeholder="@YourFamilyOSBot"
                  value={botUsername}
                  onChange={(e) => setBotUsername(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The username of your Telegram bot (starts with @)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegramChatId">Your Chat ID</Label>
                <Input
                  id="telegramChatId"
                  placeholder="123456789"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Send a message to @userinfobot to get your Chat ID
                </p>
              </div>

              <Button onClick={() => handleSave('telegram')}>
                {saved === 'telegram' && <Check className="w-4 h-4 mr-2" />}
                Link Telegram Account
              </Button>

              {telegramChatId && (
                <div className="bg-green-500/10 border border-green-500/50 p-4 rounded-lg">
                  <p className="text-sm text-green-600 dark:text-green-400">
                    ✅ Telegram account linked! You&apos;ll receive notifications at the configured Chat ID.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Manage your API keys for AI and external services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="minimaxKey">MiniMax API Key</Label>
                <Input
                  id="minimaxKey"
                  type="password"
                  placeholder="••••••••••••••••"
                  value={apiKeys.minimax}
                  onChange={(e) => setApiKeys({ ...apiKeys, minimax: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  API key for AI features (recipe parsing, meal planning, task planning)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rapidapiKey">RapidAPI Key</Label>
                <Input
                  id="rapidapiKey"
                  type="password"
                  placeholder="••••••••••••••••"
                  value={apiKeys.rapidapi}
                  onChange={(e) => setApiKeys({ ...apiKeys, rapidapi: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  For Instagram recipe extraction (free tier available at rapidapi.com)
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  ⚠️ API keys are stored in environment variables. In production, configure these in your Vercel project settings.
                </p>
              </div>

              <Button onClick={() => handleSave('api')}>
                {saved === 'api' && <Check className="w-4 h-4 mr-2" />}
                Save API Keys
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Settings
              </CardTitle>
              <CardDescription>
                Manage your personal information and health goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input defaultValue={currentMember?.name || ''} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input type="number" defaultValue={currentMember?.age || 0} />
                </div>
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input type="number" defaultValue={currentMember?.weight || 0} />
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input type="number" defaultValue={currentMember?.height || 0} />
                </div>
                <div className="space-y-2">
                  <Label>Activity Level</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                    <option value="sedentary">Sedentary</option>
                    <option value="light">Light</option>
                    <option value="moderate" selected>Moderate</option>
                    <option value="active">Active</option>
                    <option value="very-active">Very Active</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Health Goal</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="maintain">Maintain Weight</option>
                  <option value="lose">Lose Weight</option>
                  <option value="gain">Gain Weight / Muscle</option>
                  <option value="general">General Health</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Dietary Restrictions</Label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="e.g., Vegetarian, Gluten-free, Nut allergy..."
                  defaultValue={currentMember?.dietaryRestrictions || ''}
                />
              </div>

              <Button onClick={() => handleSave('profile')}>
                {saved === 'profile' && <Check className="w-4 h-4 mr-2" />}
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
