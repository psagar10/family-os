import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { members } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// Get allowed Telegram IDs from environment
function getAllowedIds(): string[] {
  const allowed = process.env.TELEGRAM_ALLOWED_IDS || ''
  return allowed.split(',').map(id => id.trim()).filter(Boolean)
}

function isAllowedChatId(chatId: string): boolean {
  const allowedIds = getAllowedIds()
  // If no IDs configured, allow all (not recommended for production)
  if (allowedIds.length === 0) return true
  return allowedIds.includes(chatId)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message, edited_message, callback_query } = body

    // Extract chat ID from various message types
    let chatId: string | null = null
    
    if (message?.chat?.id) {
      chatId = message.chat.id.toString()
    } else if (callback_query?.message?.chat?.id) {
      chatId = callback_query.message.chat.id.toString()
    }

    // Check access control
    if (chatId && !isAllowedChatId(chatId)) {
      console.log(`Blocked unauthorized Telegram access from: ${chatId}`)
      return NextResponse.json({ ok: true })
    }

    // Handle /start command
    if (message?.text === '/start') {
      const userName = message.chat.username || message.chat.first_name || 'User'
      const args = message.text?.split(' ') || []
      const memberToken = args[1] // Optional token for linking account
      
      // Build response message
      let responseText = `👋 Hello ${userName}! Family OS Bot is connected.\n\n`
      
      if (memberToken) {
        // User has a linking token - try to link account
        responseText += `🔗 Attempting to link your account...`
      } else {
        responseText += `📱 Go to your Family OS settings to link this Telegram account to your profile.\n\n`
        responseText += `Commands:\n`
        responseText += `/start - Show this message\n`
        responseText += `/status - Check Family OS status\n`
        responseText += `/meals - Today's meal plan\n`
        responseText += `/tasks - Your tasks for today\n`
        responseText += `/help - Show all commands`
      }

      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: responseText
      })
    }

    // Handle /help command
    if (message?.text === '/help') {
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `📋 Family OS Bot Commands:\n\n` +
              `/start - Register with Family OS\n` +
              `/status - Check system status\n` +
              `/meals - View today's meals\n` +
              `/tasks - View your tasks\n` +
              `/help - Show this help`
      })
    }

    // Handle /status command
    if (message?.text === '/status') {
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `✅ Family OS is running!\n\n` +
              `🕐 Server Time: ${new Date().toLocaleString()}\n` +
              `📱 Web App: Check your deployed URL`
      })
    }

    // Handle /meals command
    if (message?.text?.startsWith('/meals')) {
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `🍽️ Today's Meal Plan\n\n` +
              `Breakfast: Check your app\n` +
              `Lunch: Check your app\n` +
              `Dinner: Check your app\n\n` +
              `📱 Open Family OS for details`
      })
    }

    // Handle /tasks command
    if (message?.text?.startsWith('/tasks')) {
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `📋 Your Tasks\n\n` +
              `• No pending tasks\n\n` +
              `📱 Open Family OS for details`
      })
    }

    // Handle unknown messages
    if (message && !message.text?.startsWith('/')) {
      return NextResponse.json({
        method: 'sendMessage',
        chat_id: chatId,
        text: `🤖 I don't understand that message. Type /help for available commands.`
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
