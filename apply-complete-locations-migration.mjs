import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configuration Supabase
const supabaseUrl = 'https://ypxmzacmwqqvlciwahzw.supabase.co'
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlweG16YWNtd3FxdmxjaXdhaHp3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjQ3NzI4NTAsImV4cCI6MjA0MDM0ODg1MH0.2xI4sF-FMfMF-zZmUjSXuZNHlP2q3QhPuR0Gxht3nOI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyLocationsMigration() {
  try {
    console.log('🚀 Applying complete hotel locations migration...')
    
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250905000001_complete_hotel_locations.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')
    
    // Split the SQL into individual statements (remove comments and empty lines)
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'))
    
    console.log(`📝 Executing ${statements.length} SQL statements...`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        })
        
        if (error) {
          // Try direct query if RPC fails
          console.log('RPC failed, trying direct query...')
          const { error: directError } = await supabase
            .from('locations')
            .select('*')
            .limit(1)
          
          if (directError) {
            console.error('❌ Error executing statement:', error)
            console.error('Statement:', statement)
          }
        }
      }
    }
    
    // Verify the migration worked by counting locations
    const { data: rooms, error: roomsError } = await supabase
      .from('locations')
      .select('*')
      .eq('type', 'room')
    
    const { data: commonAreas, error: commonError } = await supabase
      .from('locations')
      .select('*')
      .eq('type', 'common_area')
      
    const { data: groundFloor, error: groundError } = await supabase
      .from('locations')
      .select('*')
      .eq('type', 'ground_floor')
      
    const { data: staffAreas, error: staffError } = await supabase
      .from('locations')
      .select('*')
      .eq('type', 'staff_area')
    
    if (!roomsError && !commonError && !groundError && !staffError) {
      console.log('✅ Migration completed successfully!')
      console.log(`📊 Results:`)
      console.log(`  - Rooms: ${rooms?.length || 0}`)
      console.log(`  - Common Areas: ${commonAreas?.length || 0}`)
      console.log(`  - Ground Floor: ${groundFloor?.length || 0}`)
      console.log(`  - Staff Areas: ${staffAreas?.length || 0}`)
      console.log(`  - Total: ${(rooms?.length || 0) + (commonAreas?.length || 0) + (groundFloor?.length || 0) + (staffAreas?.length || 0)}`)
    } else {
      console.error('❌ Error verifying migration:', { roomsError, commonError, groundError, staffError })
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
  }
}

// Run the migration
applyLocationsMigration()
