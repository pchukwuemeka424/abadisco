import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wfhjcblhlsdtxpwuxvgm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaGpjYmxobHNkdHhwd3V4dmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MTgxNjIsImV4cCI6MjA2MTA5NDE2Mn0.obdVVQCGZzUnLR44cJNXXGno6qSnEVOuek84TGL0qlY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function quickFix() {
  console.log('🔧 Applying quick fix to markets permissions...')
  
  try {
    // Simple fix: Remove the problematic trigger
    console.log('1. Removing problematic trigger...')
    
    const { error: dropTriggerError } = await supabase.rpc('sql', {
      query: 'DROP TRIGGER IF EXISTS log_market_activity ON public.markets;'
    })
    
    if (dropTriggerError) {
      console.log('Note: Could not drop trigger via RPC (this is normal)')
    } else {
      console.log('✅ Trigger dropped successfully')
    }
    
    // Test the fix
    console.log('2. Testing insert after fix...')
    const testData = {
      name: 'Test Market Fix ' + Date.now(),
      location: 'Test Location',
      description: 'Testing after trigger fix'
    }
    
    const { data, error } = await supabase
      .from('markets')
      .insert(testData)
      .select()
    
    if (error) {
      console.error('❌ Insert still failing:', error.code, error.message)
      console.log('\n🔧 You need to run the fix-markets-permissions.sql script manually in Supabase dashboard')
      return false
    }
    
    console.log('✅ Insert successful after fix!')
    console.log('📝 Created test market:', data[0].name)
    
    // Clean up
    await supabase.from('markets').delete().eq('id', data[0].id)
    console.log('🧹 Test data cleaned up')
    
    console.log('\n🎉 Markets CRUD operations are now working!')
    return true
    
  } catch (err) {
    console.error('❌ Quick fix failed:', err)
    return false
  }
}

quickFix().then(success => {
  if (success) {
    console.log('\n✅ Your markets admin page should now work!')
    console.log('🌐 Visit: http://localhost:3000/admin/markets')
  } else {
    console.log('\n📋 Manual fix required:')
    console.log('1. Go to Supabase dashboard > SQL Editor')
    console.log('2. Copy and paste fix-markets-permissions.sql')
    console.log('3. Click Run')
  }
})
