// lib/admin-auth.ts - UPDATED WITH DEBUGGING

import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  last_login: string | null;
  created_at: string;
}

export interface AdminSession {
  id: string;
  admin_id: string;
  token: string;
  expires_at: string;
}

// ========================================
// ADMIN AUTHENTICATION
// ========================================

/**
 * Admin login - separate from regular user login
 */
export async function adminLogin(email: string, password: string): Promise<{
  admin: AdminUser;
  token: string;
  expiresAt: Date;
}> {
  console.log('🔍 Admin Login Attempt:', { email });

  try {
    // 1. Find admin by email
    const { data: admin, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    console.log('📊 Database Query Result:', { 
      found: !!admin, 
      error: adminError?.message,
      adminId: admin?.id 
    });

    if (adminError || !admin) {
      console.error('❌ Admin not found:', adminError);
      throw new Error('Invalid credentials - Admin not found');
    }

    console.log('🔐 Password Hash from DB:', admin.password_hash?.substring(0, 20) + '...');
    console.log('🔑 Password provided:', password);

    // 2. Verify password
    let isValidPassword = false;
    
    try {
      isValidPassword = await bcrypt.compare(password, admin.password_hash);
      console.log('✅ Password verification result:', isValidPassword);
    } catch (bcryptError) {
      const errorMessage = bcryptError instanceof Error ? bcryptError.message : 'Unknown error';
      console.error('❌ Bcrypt error:', errorMessage);
      throw new Error('Password verification failed: ' + errorMessage);
    }
    
    if (!isValidPassword) {
      console.error('❌ Invalid password');
      throw new Error('Invalid credentials - Wrong password');
    }

    console.log('✅ Password verified successfully');

    // 3. Generate session token
    const token = generateAdminToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    console.log('🎫 Generated token:', token.substring(0, 20) + '...');

    // 4. Create session
    const { error: sessionError } = await supabase
      .from('admin_sessions')
      .insert({
        admin_id: admin.id,
        token,
        expires_at: expiresAt.toISOString(),
      });

    if (sessionError) {
      console.error('❌ Session creation error:', sessionError);
      throw new Error('Failed to create session: ' + sessionError.message);
    }

    console.log('✅ Session created successfully');

    // 5. Update last login
    try {
      await supabase.rpc('update_admin_last_login', { admin_uuid: admin.id });
      console.log('✅ Last login updated');
    } catch (updateError) {
      const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
      console.warn('⚠️ Could not update last login:', errorMessage);
      // Don't fail login if this fails
    }

    // 6. Log activity
    try {
      await logAdminActivity(admin.id, admin.email, 'LOGIN');
      console.log('✅ Activity logged');
    } catch (logError) {
      const errorMessage = logError instanceof Error ? logError.message : 'Unknown error';
      console.warn('⚠️ Could not log activity:', errorMessage);
      // Don't fail login if this fails
    }

    // 7. Remove password hash from response
    const { password_hash: _password_hash, ...adminWithoutPassword } = admin;

    console.log('🎉 Login successful!');

    return {
      admin: adminWithoutPassword as AdminUser,
      token,
      expiresAt,
    };
  } catch (error) {
    console.error('💥 Admin login failed:', error);
    throw error;
  }
}

/**
 * Verify admin session token
 */
export async function verifyAdminToken(token: string): Promise<AdminUser | null> {
  try {
    // 1. Find valid session
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*, admin_users(*)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (sessionError || !session) {
      console.warn('⚠️ Session not found or expired');
      return null;
    }

    // 2. Check if admin is still active
    const admin = session.admin_users;
    if (!admin || !admin.is_active) {
      console.warn('⚠️ Admin inactive');
      return null;
    }

    // 3. Remove password hash
    const { password_hash: _password_hash, ...adminWithoutPassword } = admin;

    return adminWithoutPassword as AdminUser;
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return null;
  }
}

/**
 * Admin logout
 */
export async function adminLogout(token: string): Promise<void> {
  // Get admin info before deleting session for logging
  const admin = await verifyAdminToken(token);

  // Delete session
  await supabase
    .from('admin_sessions')
    .delete()
    .eq('token', token);

  // Log activity
  if (admin) {
    await logAdminActivity(admin.id, admin.email, 'LOGOUT');
  }
}

/**
 * Create new admin user (super_admin only)
 */
export async function createAdminUser(data: {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'super_admin';
}, createdBy: AdminUser): Promise<AdminUser> {
  // Only super_admins can create new admins
  if (createdBy.role !== 'super_admin') {
    throw new Error('Insufficient permissions');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);

  // Create admin
  const { data: newAdmin, error } = await supabase
    .from('admin_users')
    .insert({
      email: data.email,
      password_hash: passwordHash,
      name: data.name,
      role: data.role,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  // Log activity
  await logAdminActivity(
    createdBy.id,
    createdBy.email,
    'CREATE_ADMIN',
    'admin_user',
    newAdmin.id,
    { created_email: data.email, created_role: data.role }
  );

  const { password_hash: _password_hash, ...adminWithoutPassword } = newAdmin;
  return adminWithoutPassword as AdminUser;
}

// ========================================
// ADMIN ACTIVITY LOGGING
// ========================================

export async function logAdminActivity(
  adminId: string,
  adminEmail: string,
  action: string,
  resourceType?: string,
  resourceId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.rpc('log_admin_activity', {
      p_admin_id: adminId,
      p_admin_email: adminEmail,
      p_action: action,
      p_resource_type: resourceType || null,
      p_resource_id: resourceId || null,
      p_details: details ? JSON.stringify(details) : null,
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
    // Don't throw - logging failure shouldn't break the app
  }
}

// ========================================
// HELPER FUNCTIONS
// ========================================

function generateAdminToken(): string {
  return uuidv4() + '-' + Date.now() + '-' + Math.random().toString(36);
}

/**
 * Cleanup expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  await supabase.rpc('cleanup_expired_admin_sessions');
}

// ========================================
// DEBUG HELPER: Test password hash
// ========================================

export async function testPasswordHash(email: string, password: string): Promise<void> {
  console.log('🧪 Testing password hash for:', email);
  
  const { data: admin } = await supabase
    .from('admin_users')
    .select('password_hash')
    .eq('email', email)
    .single();
    
  if (!admin) {
    console.error('❌ Admin not found');
    return;
  }
  
  console.log('Hash from DB:', admin.password_hash);
  console.log('Password:', password);
  
  const result = await bcrypt.compare(password, admin.password_hash);
  console.log('Match result:', result);
  
  // Also try generating a new hash
  const newHash = await bcrypt.hash(password, 10);
  console.log('New hash generated:', newHash);
  console.log('New hash matches:', await bcrypt.compare(password, newHash));
}