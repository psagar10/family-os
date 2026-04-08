import { db } from '@/lib/db'
import { members, notificationLog } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ulid } from 'ulid'

export interface NotificationPayload {
  memberId: string
  channel: 'push' | 'telegram' | 'sms'
  message: string
  metadata?: Record<string, any>
}

// Send via Telegram
export async function sendTelegramMessage(
  chatId: string,
  message: string,
  botToken: string
): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Telegram send failed:', error)
    return false
  }
}

// Main notification sender
export async function sendNotification(payload: NotificationPayload): Promise<boolean> {
  const { memberId, channel, message } = payload
  const now = Date.now()

  try {
    const [member] = await db.select().from(members).where(eq(members.id, memberId))

    if (!member) {
      console.error('Member not found:', memberId)
      return false
    }

    let success = false

    switch (channel) {
      case 'telegram': {
        const contact = JSON.parse(member.contactInfo || '{}')
        const chatId = contact.telegramChatId

        if (chatId && process.env.TELEGRAM_BOT_TOKEN) {
          success = await sendTelegramMessage(
            chatId,
            message,
            process.env.TELEGRAM_BOT_TOKEN
          )
        } else {
          console.warn('Telegram not configured for member:', memberId)
          success = false
        }
        break
      }

      case 'push': {
        // Push notifications are handled via Service Worker API
        // In production, use web-push library
        console.log('Push notification:', message)
        success = true
        break
      }

      case 'sms':
        // Future implementation with Twilio
        console.warn('SMS not implemented yet')
        success = false
        break

      default:
        console.warn('Unknown channel:', channel)
        success = false
    }

    // Log notification
    await db.insert(notificationLog).values({
      id: ulid(),
      memberId,
      channel,
      message,
      sentAt: now,
      status: success ? 'sent' : 'failed',
    })

    return success
  } catch (error) {
    console.error('Notification failed:', error)

    // Log failure
    await db.insert(notificationLog).values({
      id: ulid(),
      memberId,
      channel,
      message,
      sentAt: now,
      status: 'failed',
    })

    return false
  }
}

// Broadcast to all family members
export async function broadcastNotification(
  message: string,
  channels: Array<'push' | 'telegram'> = ['push']
): Promise<void> {
  const allMembers = await db.select().from(members)

  for (const member of allMembers) {
    for (const channel of channels) {
      await sendNotification({
        memberId: member.id,
        channel,
        message,
      })
    }
  }
}

// Schedule-aware notifications
export async function sendMealReminder(
  memberId: string,
  mealType: string,
  recipeName: string
): Promise<boolean> {
  return sendNotification({
    memberId,
    channel: 'push',
    message: `⏰ Time to start ${mealType}! Today's recipe: ${recipeName}`,
  })
}

export async function sendTaskReminder(
  memberId: string,
  taskName: string,
  scheduledDate: string
): Promise<boolean> {
  return sendNotification({
    memberId,
    channel: 'push',
    message: `📋 Task reminder: "${taskName}" is scheduled for ${scheduledDate}`,
  })
}
