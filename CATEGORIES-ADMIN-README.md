# Categories Admin Management

This document describes the admin categories management functionality that has been implemented to work with real data from the database.

## Overview

The admin categories page allows administrators to:
- View all business categories with real-time statistics
- Add new categories with images and metadata
- Edit existing categories
- Delete categories (with safety checks)
- Update category counts based on actual business associations
- View category performance metrics

## Features

### 📊 Real-time Statistics
- Total categories count
- Active categories (with businesses)
- Most popular category
- Newest category
- Business counts per category
- View and click tracking

### 🖼️ Image Management
- Upload category images to Supabase storage
- Image validation (type and size)
- Progress tracking during upload
- Preview functionality

### 🔧 CRUD Operations
- **Create**: Add new categories with validation
- **Read**: View categories with sorting and filtering
- **Update**: Edit existing categories
- **Delete**: Remove categories (with business association checks)

### 📈 Performance Tracking
- View counts per category
- Click tracking
- Business association counts
- Last updated timestamps

## Database Schema

### Tables

#### `business_categories`
```sql
CREATE TABLE business_categories (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    image_path VARCHAR(255) NOT NULL,
    icon_type VARCHAR(50) NOT NULL,
    count INTEGER,
    link_path VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### `business_categories_stats`
```sql
CREATE TABLE business_categories_stats (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES business_categories(id) ON DELETE CASCADE,
    total_businesses INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(category_id)
);
```

### Database Functions

#### `admin_get_business_categories_with_stats()`
Returns all categories with their associated statistics.

#### `get_business_categories_stats()`
Returns overview statistics for the admin dashboard.

#### `update_business_category_counts()`
Updates business counts for all categories based on actual business associations.

#### `admin_create_business_category()`
Creates a new category with validation and initial stats entry.

#### `admin_update_business_category()`
Updates an existing category with validation.

#### `admin_delete_business_category()`
Deletes a category with safety checks for business associations.

#### `increment_category_view()`
Increments the view count for a specific category.

## Setup Instructions

### 1. Database Setup
Run the setup script to create all necessary database functions and tables:

```bash
# Execute the setup script in your Supabase SQL editor
# File: setup-categories-admin.sql
```

### 2. Storage Bucket
Create a storage bucket named `category` in your Supabase dashboard:

1. Go to Storage in your Supabase dashboard
2. Click "Create a new bucket"
3. Name it `category`
4. Set it as public
5. Configure RLS policies as needed

### 3. Environment Variables
Ensure your environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Test the Setup
Run the test script to verify everything is working:

```bash
node test-categories-admin.mjs
```

## Usage

### Accessing the Admin Page
Navigate to `/admin/categories` in your application (requires admin authentication).

### Adding a New Category
1. Click "Add New Category" button
2. Fill in the required fields:
   - Title (required)
   - Description (required, max 255 characters)
   - Upload an image (required, max 5MB)
   - Select an icon type (optional)
   - Add a link path (optional)
3. Click "Create Category"

### Editing a Category
1. Click the edit icon (pencil) next to any category
2. Modify the fields as needed
3. Click "Update Category"

### Deleting a Category
1. Click the delete icon (trash) next to any category
2. Confirm the deletion in the modal
3. Note: Categories with associated businesses cannot be deleted

### Updating Category Counts
Click the "Update Category Counts" button to refresh business counts based on actual database associations.

## Components

### Main Page: `src/app/(admin)/admin/categories/page.tsx`
- Main categories management interface
- Handles data fetching and CRUD operations
- Error handling and loading states

### CategoryStats: `src/app/(admin)/admin/components/CategoryStats.tsx`
- Displays overview statistics
- Real-time data from database functions
- Fallback to manual calculations if functions fail

### CategoriesTable: `src/app/(admin)/admin/components/CategoriesTable.tsx`
- Displays categories in a sortable table
- Shows business counts, views, and creation dates
- Action buttons for edit, delete, and view

### CategoryModal: `src/app/(admin)/admin/components/CategoryModal.tsx`
- Form for creating/editing categories
- Image upload with validation
- Category suggestions and icon selection

## Error Handling

The system includes comprehensive error handling:

### Database Function Failures
- Automatic fallback to direct database queries
- Graceful degradation when functions are unavailable
- Detailed error logging

### Image Upload Issues
- File type validation
- File size limits (5MB)
- Upload progress tracking
- Error recovery

### Validation Errors
- Form field validation
- Real-time error feedback
- User-friendly error messages

## Performance Considerations

### Database Optimization
- Indexes on frequently queried columns
- Efficient JOIN operations
- Temporary tables for batch updates

### Image Optimization
- Client-side image validation
- Progress tracking for large uploads
- Efficient storage bucket usage

### Caching
- Component-level state management
- Optimistic updates for better UX
- Efficient re-rendering

## Security

### Row Level Security (RLS)
- Admin-only access to CRUD operations
- Proper authentication checks
- Secure function execution

### Input Validation
- Server-side validation in database functions
- Client-side validation for immediate feedback
- SQL injection prevention

### File Upload Security
- File type validation
- Size limits
- Secure storage bucket configuration

## Troubleshooting

### Common Issues

#### "Function not found" errors
- Ensure the setup script has been executed
- Check that all functions are created in the correct schema
- Verify function permissions

#### Image upload failures
- Check storage bucket exists and is public
- Verify RLS policies allow uploads
- Check file size and type restrictions

#### Category counts not updating
- Run the "Update Category Counts" button
- Check for businesses with valid category_id values
- Verify the update function is working

#### Permission errors
- Ensure user has admin role
- Check RLS policies
- Verify function permissions

### Debug Mode
Enable debug logging by checking browser console for detailed error messages and warnings.

## Future Enhancements

### Planned Features
- Bulk category operations
- Category import/export
- Advanced analytics dashboard
- Category performance insights
- Automated category suggestions

### Performance Improvements
- Database query optimization
- Image compression and optimization
- Caching strategies
- Lazy loading for large datasets

## Support

For issues or questions:
1. Check the troubleshooting section
2. Run the test script to verify setup
3. Review browser console for error messages
4. Check Supabase logs for database errors

## Changelog

### v1.0.0 (Current)
- Initial implementation with real data integration
- Complete CRUD operations
- Image upload functionality
- Statistics dashboard
- Error handling and fallbacks
- Comprehensive testing
