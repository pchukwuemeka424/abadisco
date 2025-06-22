import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wfhjcblhlsdtxpwuxvgm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaGpjYmxobHNkdHhwd3V4dmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MTgxNjIsImV4cCI6MjA2MTA5NDE2Mn0.obdVVQCGZzUnLR44cJNXXGno6qSnEVOuek84TGL0qlY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testCRUD() {
  console.log('🧪 Testing CRUD operations for markets...')
  
  try {
    // Test CREATE
    console.log('\n📝 Testing CREATE...')
    const testMarket = {
      name: 'Test Market CRUD ' + Date.now(),
      location: 'Test Location',
      description: 'Test market for CRUD verification',
      is_active: true
    }
    
    const { data: createData, error: createError } = await supabase
      .from('markets')
      .insert(testMarket)
      .select()
    
    if (createError) {
      console.error('❌ CREATE failed:', createError)
      if (createError.code === 'PGRST301') {
        console.log('💡 This is a permission error. You need to run the fix-markets-permissions.sql script.')
      }
      return false
    }
    
    console.log('✅ CREATE successful:', createData[0].name)
    const marketId = createData[0].id
    
    // Test READ
    console.log('\n📖 Testing READ...')
    const { data: readData, error: readError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
    
    if (readError) {
      console.error('❌ READ failed:', readError)
      return false
    }
    
    console.log('✅ READ successful:', readData[0].name)
    
    // Test UPDATE
    console.log('\n✏️ Testing UPDATE...')
    const { data: updateData, error: updateError } = await supabase
      .from('markets')
      .update({ description: 'Updated test description' })
      .eq('id', marketId)
      .select()
    
    if (updateError) {
      console.error('❌ UPDATE failed:', updateError)
      if (updateError.code === 'PGRST301') {
        console.log('💡 This is a permission error. You need to run the fix-markets-permissions.sql script.')
      }
      return false
    }
    
    console.log('✅ UPDATE successful')
    
    // Test DELETE
    console.log('\n🗑️ Testing DELETE...')
    const { error: deleteError } = await supabase
      .from('markets')
      .delete()
      .eq('id', marketId)
    
    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError)
      if (deleteError.code === 'PGRST301') {
        console.log('💡 This is a permission error. You need to run the fix-markets-permissions.sql script.')
      }
      return false
    }
    
    console.log('✅ DELETE successful')
    console.log('\n🎉 All CRUD operations successful!')
    console.log('✅ Your markets admin should work perfectly!')
    return true
    
  } catch (err) {
    console.error('❌ CRUD test failed:', err)
    return false
  }
}

testCRUD().then(success => {
  if (!success) {
    console.log('\n🔧 To fix permission issues:')
    console.log('1. Go to your Supabase dashboard SQL editor')
    console.log('2. Copy and paste the contents of fix-markets-permissions.sql')
    console.log('3. Run the script')
    console.log('4. Test again')
  }
})
