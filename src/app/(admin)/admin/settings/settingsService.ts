import { supabase } from '@/supabaseClient';

export interface PlatformSetting {
  key: string;
  value: string;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface NotificationPreference {
  role: number;
  system_updates: boolean;
  marketing: boolean;
  security_alerts: boolean;
  new_features: boolean;
  updated_at: string;
}

/**
 * Fetch all platform settings
 */
export async function fetchAllSettings(): Promise<PlatformSetting[]> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('*');
  
  if (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Update a single platform setting
 */
export async function updateSetting(key: string, value: string): Promise<void> {
  // Get the current user for tracking who updated the setting
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  // For Supabase, use the .update() method with an object
  const { error } = await supabase
    .from('platform_settings')
    .update({
      value,
      updated_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq('key', key);
  
  if (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }
}

/**
 * Batch update multiple platform settings
 */
export async function batchUpdateSettings(settings: { key: string; value: string }[]): Promise<void> {
  // Get the current user for tracking who updated the settings
  const { data: { user } } = await supabase.auth.getUser();
  const userId = user?.id;

  const updates = settings.map(setting => ({
    key: setting.key,
    value: setting.value,
    updated_at: new Date().toISOString(),
    updated_by: userId,
  }));
  
  // Use the .upsert() method as recommended for bulk operations
  const { error } = await supabase
    .from('platform_settings')
    .upsert(updates, { 
      onConflict: 'key',
      ignoreDuplicates: false 
    });
  
  if (error) {
    console.error('Error batch updating settings:', error);
    throw error;
  }
}

/**
 * Fetch all notification preferences
 */
export async function fetchNotificationPreferences(): Promise<NotificationPreference[]> {
  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*');
  
  if (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Update notification preferences for a specific role
 */
export async function updateNotificationPreferences(
  role: number,
  preferences: {
    system_updates: boolean;
    marketing: boolean;
    security_alerts: boolean;
    new_features: boolean;
  }
): Promise<void> {
  // Use the .update() method with an object
  const { error } = await supabase
    .from('notification_preferences')
    .update({
      ...preferences,
      updated_at: new Date().toISOString(),
    })
    .eq('role', role);
  
  if (error) {
    console.error(`Error updating notification preferences for role ${role}:`, error);
    throw error;
  }
}

/**
 * Get a specific setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('platform_settings')
    .select('value')
    .eq('key', key)
    .single();
  
  if (error) {
    console.error(`Error fetching setting ${key}:`, error);
    return null;
  }
  
  return data?.value || null;
}

/**
 * Check if a feature is enabled (returns boolean)
 */
export async function isFeatureEnabled(key: string): Promise<boolean> {
  const value = await getSetting(key);
  return value === 'true';
}

/**
 * Export users to CSV format
 */
export async function exportUsersToCSV(): Promise<string> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, created_at');
  
  if (error) {
    console.error('Error exporting users to CSV:', error);
    throw error;
  }
  
  if (!data || data.length === 0) {
    return 'No data available';
  }
  
  // Convert data to CSV
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(user => {
    // Ensure values don't break CSV format by quoting strings
    return Object.values(user).map(val => {
      if (val === null || val === undefined) return '';
      if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
        // Escape quotes and wrap in quotes
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    }).join(',');
  });
  
  return [headers, ...rows].join('\n');
}

/**
 * Export users to JSON format (already in JSON format from Supabase)
 */
export async function exportUsersToJSON(): Promise<object[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, email, created_at');
  
  if (error) {
    console.error('Error exporting users to JSON:', error);
    throw error;
  }
  
  return data || [];
}