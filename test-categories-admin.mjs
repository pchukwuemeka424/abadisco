#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCategoriesAdmin() {
  console.log('🧪 Testing Categories Admin Functionality...\n');

  try {
    // Test 1: Get categories with stats
    console.log('1. Testing admin_get_business_categories_with_stats()...');
    const { data: categories, error: categoriesError } = await supabase.rpc('admin_get_business_categories_with_stats');
    
    if (categoriesError) {
      console.error('❌ Error fetching categories:', categoriesError);
    } else {
      console.log(`✅ Found ${categories.length} categories`);
      if (categories.length > 0) {
        console.log('   Sample category:', {
          id: categories[0].id,
          title: categories[0].title,
          total_businesses: categories[0].total_businesses,
          total_views: categories[0].total_views
        });
      }
    }

    // Test 2: Get category statistics
    console.log('\n2. Testing get_business_categories_stats()...');
    const { data: stats, error: statsError } = await supabase.rpc('get_business_categories_stats');
    
    if (statsError) {
      console.error('❌ Error fetching stats:', statsError);
    } else {
      console.log('✅ Category statistics:', stats);
    }

    // Test 3: Update category counts
    console.log('\n3. Testing update_business_category_counts()...');
    const { error: updateError } = await supabase.rpc('update_business_category_counts');
    
    if (updateError) {
      console.error('❌ Error updating counts:', updateError);
    } else {
      console.log('✅ Category counts updated successfully');
    }

    // Test 4: Check if storage bucket exists
    console.log('\n4. Testing storage bucket access...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError);
    } else {
      const categoryBucket = buckets.find(bucket => bucket.name === 'category');
      if (categoryBucket) {
        console.log('✅ Category storage bucket exists');
      } else {
        console.log('⚠️  Category storage bucket not found - you may need to create it');
      }
    }

    // Test 5: Check business_categories_stats table
    console.log('\n5. Testing business_categories_stats table...');
    const { data: statsTable, error: statsTableError } = await supabase
      .from('business_categories_stats')
      .select('*')
      .limit(5);
    
    if (statsTableError) {
      console.error('❌ Error accessing stats table:', statsTableError);
    } else {
      console.log(`✅ Stats table accessible, found ${statsTable.length} entries`);
    }

    // Test 6: Check businesses table structure
    console.log('\n6. Testing businesses table structure...');
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('id, name, category_id')
      .limit(5);
    
    if (businessesError) {
      console.error('❌ Error accessing businesses table:', businessesError);
    } else {
      console.log(`✅ Businesses table accessible, found ${businesses.length} businesses`);
      if (businesses.length > 0) {
        console.log('   Sample business:', {
          id: businesses[0].id,
          name: businesses[0].name,
          category_id: businesses[0].category_id
        });
      }
    }

    console.log('\n🎉 Categories admin functionality test completed!');
    
    // Summary
    console.log('\n📊 Summary:');
    console.log(`- Categories: ${categories?.length || 0}`);
    console.log(`- Stats entries: ${statsTable?.length || 0}`);
    console.log(`- Businesses: ${businesses?.length || 0}`);
    
    if (categories?.length > 0) {
      const totalBusinesses = categories.reduce((sum, cat) => sum + (cat.total_businesses || 0), 0);
      const totalViews = categories.reduce((sum, cat) => sum + (cat.total_views || 0), 0);
      console.log(`- Total businesses across categories: ${totalBusinesses}`);
      console.log(`- Total views across categories: ${totalViews}`);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCategoriesAdmin().then(() => {
  console.log('\n✨ Test script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test script failed:', error);
  process.exit(1);
});
