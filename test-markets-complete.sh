#!/bin/bash

echo "🚀 Testing Markets Admin Functionality"
echo "======================================"

echo ""
echo "1. Checking environment file..."
if [ -f ".env.local" ]; then
    echo "✅ .env.local exists"
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo "✅ SUPABASE_URL is set"
    else
        echo "❌ SUPABASE_URL missing"
    fi
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        echo "✅ SUPABASE_ANON_KEY is set"
    else
        echo "❌ SUPABASE_ANON_KEY missing"
    fi
else
    echo "❌ .env.local not found"
    exit 1
fi

echo ""
echo "2. Testing direct database connection..."
node test-connection.mjs

echo ""
echo "3. Testing markets operations..."

# Create a simple test script for CRUD operations
cat > test-crud.mjs << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://wfhjcblhlsdtxpwuxvgm.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndmaGpjYmxobHNkdHhwd3V4dmdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU1MTgxNjIsImV4cCI6MjA2MTA5NDE2Mn0.obdVVQCGZzUnLR44cJNXXGno6qSnEVOuek84TGL0qlY'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testCRUD() {
  console.log('Testing CRUD operations...')
  
  try {
    // Test CREATE
    console.log('📝 Testing CREATE...')
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
      return
    }
    
    console.log('✅ CREATE successful:', createData[0].name)
    const marketId = createData[0].id
    
    // Test READ
    console.log('📖 Testing READ...')
    const { data: readData, error: readError } = await supabase
      .from('markets')
      .select('*')
      .eq('id', marketId)
    
    if (readError) {
      console.error('❌ READ failed:', readError)
      return
    }
    
    console.log('✅ READ successful:', readData[0].name)
    
    // Test UPDATE
    console.log('✏️ Testing UPDATE...')
    const { data: updateData, error: updateError } = await supabase
      .from('markets')
      .update({ description: 'Updated test description' })
      .eq('id', marketId)
      .select()
    
    if (updateError) {
      console.error('❌ UPDATE failed:', updateError)
      return
    }
    
    console.log('✅ UPDATE successful')
    
    // Test DELETE
    console.log('🗑️ Testing DELETE...')
    const { error: deleteError } = await supabase
      .from('markets')
      .delete()
      .eq('id', marketId)
    
    if (deleteError) {
      console.error('❌ DELETE failed:', deleteError)
      return
    }
    
    console.log('✅ DELETE successful')
    console.log('')
    console.log('🎉 All CRUD operations successful!')
    
  } catch (err) {
    console.error('❌ CRUD test failed:', err)
  }
}

testCRUD()
EOF

node test-crud.mjs

echo ""
echo "4. Checking if dev server is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Dev server is running"
    echo "📱 You can test the markets admin at: http://localhost:3000/admin/markets"
    echo "🔍 Debug page available at: http://localhost:3000/debug"
else
    echo "❌ Dev server is not running"
    echo "💡 Start it with: npm run dev"
fi

echo ""
echo "5. Next steps:"
echo "   - Visit http://localhost:3000/admin/markets"
echo "   - Check browser console for any errors"
echo "   - If still not working, run the SQL fix: fix-markets-permissions.sql"

# Clean up
rm -f test-crud.mjs
