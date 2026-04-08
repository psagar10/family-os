import { db } from './index'
import { members, taskTemplates, modes } from './schema'
import { ulid } from 'ulid'

const now = Date.now()

async function seed() {
  console.log('🌱 Seeding database...')

  // ============ FAMILY MEMBERS ============
  const familyMembers = [
    {
      id: ulid(),
      name: 'Parent 1',
      pin: '1234',
      role: 'admin',
      age: null,
      biologicalSex: null,
      weight: 70,
      height: 170,
      activityLevel: 'moderate',
      healthGoal: 'maintenance',
      notificationChannels: JSON.stringify(['push', 'telegram']),
      contactInfo: JSON.stringify({}),
      createdAt: now,
    },
    {
      id: ulid(),
      name: 'Parent 2',
      pin: '5678',
      role: 'admin',
      age: null,
      biologicalSex: null,
      weight: 65,
      height: 165,
      activityLevel: 'moderate',
      healthGoal: 'maintenance',
      notificationChannels: JSON.stringify(['push', 'telegram']),
      contactInfo: JSON.stringify({}),
      createdAt: now,
    },
    {
      id: ulid(),
      name: 'Toddler',
      pin: '0000',
      role: 'child',
      age: 1,
      biologicalSex: null,
      weight: 11,
      height: 80,
      activityLevel: 'active',
      healthGoal: 'general-health',
      notificationChannels: JSON.stringify(['push']),
      contactInfo: JSON.stringify({}),
      createdAt: now,
    },
  ]

  for (const member of familyMembers) {
    await db.insert(members).values(member).onConflictDoNothing()
  }
  console.log('✅ Family members created')

  // ============ TASK TEMPLATES (80 templates) ============
  const taskTemplateCategories = [
    { category: 'Kitchen', templates: [
      { name: 'Wash dishes', estimatedMinutes: 20, priority: 'medium' },
      { name: 'Load dishwasher', estimatedMinutes: 10, priority: 'low' },
      { name: 'Unload dishwasher', estimatedMinutes: 15, priority: 'low' },
      { name: 'Wipe kitchen counters', estimatedMinutes: 10, priority: 'medium' },
      { name: 'Clean stovetop', estimatedMinutes: 15, priority: 'medium' },
      { name: 'Clean oven', estimatedMinutes: 45, priority: 'high' },
      { name: 'Empty trash bins', estimatedMinutes: 10, priority: 'medium' },
      { name: 'Take out recycling', estimatedMinutes: 15, priority: 'medium' },
      { name: 'Organize pantry', estimatedMinutes: 30, priority: 'low' },
      { name: 'Check food expiration dates', estimatedMinutes: 20, priority: 'medium' },
    ]},
    { category: 'Bathroom', templates: [
      { name: 'Clean toilet', estimatedMinutes: 15, priority: 'high' },
      { name: 'Clean bathroom sink', estimatedMinutes: 10, priority: 'medium' },
      { name: 'Clean shower/tub', estimatedMinutes: 20, priority: 'high' },
      { name: 'Mop bathroom floor', estimatedMinutes: 15, priority: 'medium' },
      { name: 'Restock toiletries', estimatedMinutes: 10, priority: 'low' },
      { name: 'Clean mirror', estimatedMinutes: 5, priority: 'low' },
    ]},
    { category: 'Living Areas', templates: [
      { name: 'Vacuum living room', estimatedMinutes: 20, priority: 'high' },
      { name: 'Dust furniture', estimatedMinutes: 15, priority: 'medium' },
      { name: 'Fold blankets/cushions', estimatedMinutes: 10, priority: 'low' },
      { name: 'Organize toys', estimatedMinutes: 20, priority: 'medium' },
      { name: 'Vacuum bedrooms', estimatedMinutes: 30, priority: 'high' },
      { name: 'Make beds', estimatedMinutes: 15, priority: 'medium' },
      { name: 'Change bed sheets', estimatedMinutes: 20, priority: 'medium' },
      { name: 'Dust shelves', estimatedMinutes: 15, priority: 'low' },
    ]},
    { category: 'Laundry', templates: [
      { name: 'Do laundry (wash)', estimatedMinutes: 60, priority: 'high', isRecurring: 1 },
      { name: 'Do laundry (dry/fold)', estimatedMinutes: 45, priority: 'high' },
      { name: 'Iron clothes', estimatedMinutes: 30, priority: 'medium' },
      { name: 'Organize closets', estimatedMinutes: 30, priority: 'low' },
      { name: 'Sort laundry', estimatedMinutes: 10, priority: 'medium' },
    ]},
    { category: 'Outdoor', templates: [
      { name: 'Mow lawn', estimatedMinutes: 45, priority: 'high', isRecurring: 1 },
      { name: 'Water plants', estimatedMinutes: 15, priority: 'high', isRecurring: 1 },
      { name: 'Pull weeds', estimatedMinutes: 30, priority: 'medium', isRecurring: 1 },
      { name: 'Sweep patio/deck', estimatedMinutes: 15, priority: 'low' },
      { name: 'Clean garage', estimatedMinutes: 60, priority: 'low' },
      { name: 'Rake leaves', estimatedMinutes: 30, priority: 'medium', isRecurring: 1 },
      { name: 'Take out compost', estimatedMinutes: 10, priority: 'medium', isRecurring: 1 },
    ]},
    { category: 'Grocery & Errands', templates: [
      { name: 'Weekly grocery shop', estimatedMinutes: 90, priority: 'high', isRecurring: 1 },
      { name: 'Pick up prescriptions', estimatedMinutes: 30, priority: 'high' },
      { name: 'Return borrowed items', estimatedMinutes: 20, priority: 'low' },
      { name: 'Mail packages', estimatedMinutes: 15, priority: 'medium' },
    ]},
    { category: 'Meal Prep', templates: [
      { name: 'Prepare weekday lunches', estimatedMinutes: 45, priority: 'high', isRecurring: 1 },
      { name: 'Meal prep for week', estimatedMinutes: 120, priority: 'high', isRecurring: 1 },
      { name: 'Bake bread', estimatedMinutes: 90, priority: 'low' },
      { name: 'Make baby food', estimatedMinutes: 30, priority: 'medium' },
      { name: 'Prep vegetables for week', estimatedMinutes: 30, priority: 'medium', isRecurring: 1 },
    ]},
    { category: 'Childcare', templates: [
      { name: 'Bathe toddler', estimatedMinutes: 30, priority: 'high', isRecurring: 1 },
      { name: 'Toddler playtime', estimatedMinutes: 60, priority: 'high', isRecurring: 1 },
      { name: 'Read to toddler', estimatedMinutes: 20, priority: 'medium', isRecurring: 1 },
      { name: 'Toddler nap routine', estimatedMinutes: 30, priority: 'high', isRecurring: 1 },
      { name: 'Kids homework help', estimatedMinutes: 45, priority: 'medium', isRecurring: 1 },
      { name: 'Pack kids lunch', estimatedMinutes: 15, priority: 'high', isRecurring: 1 },
      { name: 'Morning routine with kids', estimatedMinutes: 45, priority: 'high', isRecurring: 1 },
      { name: 'Evening routine with kids', estimatedMinutes: 45, priority: 'high', isRecurring: 1 },
    ]},
    { category: 'Administration', templates: [
      { name: 'Pay bills', estimatedMinutes: 20, priority: 'high', isRecurring: 1 },
      { name: 'Check mail', estimatedMinutes: 10, priority: 'medium', isRecurring: 1 },
      { name: 'File documents', estimatedMinutes: 15, priority: 'low' },
      { name: 'Review calendar', estimatedMinutes: 10, priority: 'medium', isRecurring: 1 },
      { name: 'Schedule appointments', estimatedMinutes: 15, priority: 'medium' },
    ]},
    { category: 'Deep Clean', templates: [
      { name: 'Clean refrigerator', estimatedMinutes: 45, priority: 'low' },
      { name: 'Clean windows', estimatedMinutes: 60, priority: 'low' },
      { name: 'Deep clean oven', estimatedMinutes: 60, priority: 'low' },
      { name: 'Clean air vents', estimatedMinutes: 30, priority: 'low' },
      { name: 'Wash curtains', estimatedMinutes: 45, priority: 'low' },
      { name: 'Clean light fixtures', estimatedMinutes: 30, priority: 'low' },
      { name: 'Organize storage areas', estimatedMinutes: 60, priority: 'low' },
      { name: 'Clean basement/attic', estimatedMinutes: 120, priority: 'low' },
    ]},
  ]

  let templateCount = 0
  for (const cat of taskTemplateCategories) {
    for (const t of cat.templates) {
      await db.insert(taskTemplates).values({
        id: ulid(),
        name: t.name,
        category: cat.category,
        estimatedMinutes: t.estimatedMinutes,
        priority: t.priority,
        isRecurring: t.isRecurring || 0,
        recurrencePattern: t.isRecurring ? 'weekly' : null,
        createdAt: now,
      }).onConflictDoNothing()
      templateCount++
    }
  }
  console.log(`✅ ${templateCount} task templates created`)

  // ============ MODES ============
  const defaultModes = [
    { name: 'vacation', description: 'Relaxed mode - minimal tasks' },
    { name: 'sick', description: 'Reduced capacity - prioritize essentials' },
    { name: 'busy', description: 'Minimal time - quick tasks only' },
    { name: 'guests', description: 'Company coming - extra cleaning' },
    { name: 'deep-clean', description: 'Full house clean - rotate deep tasks' },
  ]

  for (const mode of defaultModes) {
    await db.insert(modes).values({
      id: ulid(),
      name: mode.name,
      description: mode.description,
      isActive: 0,
      createdAt: now,
    }).onConflictDoNothing()
  }
  console.log('✅ Default modes created')

  console.log('🎉 Seeding complete!')
}

seed().catch(console.error)
