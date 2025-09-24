import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase, users } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User> & { password: string }) => Promise<boolean>;
  updateProfile: (userData: Partial<User>) => Promise<boolean>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to map Supabase user to our User type
const mapSupabaseUserToUser = (supabaseUser: SupabaseUser, userData?: any): User => {
  // If we have user data from our users table, use that
  if (userData) {
    return {
      id: userData.id,
      email: userData.email,
      fullName: userData.full_name,
      role: userData.role,
      status: userData.status,
      avatar: userData.avatar_url,
      createdAt: new Date(userData.created_at),
    };
  }
  
  // Fallback to metadata if no user data
  const metadata = supabaseUser.user_metadata || {};
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    fullName: metadata.fullName || metadata.full_name || supabaseUser.email?.split('@')[0] || 'User',
    role: metadata.role || 'customer',
    status: 'active',
    avatar: metadata.avatar_url,
    createdAt: new Date(supabaseUser.created_at || Date.now()),
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { user: supabaseUser } } = await supabase.auth.getUser();
        if (supabaseUser) {
          // Try to get user data from our users table
          try {
            const { data: userData, error } = await users.getByEmail(supabaseUser.email!);
            if (userData && !error) {
              const mappedUser = mapSupabaseUserToUser(supabaseUser, userData);
              setUser(mappedUser);
            } else {
              // Fallback to metadata
              const mappedUser = mapSupabaseUserToUser(supabaseUser);
              setUser(mappedUser);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Fallback to metadata
            const mappedUser = mapSupabaseUserToUser(supabaseUser);
            setUser(mappedUser);
          }
        }
      } catch (e) {
        console.warn('Auth getUser() failed, proceeding without session:', e);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Watchdog: if loading somehow persists, clear it after 5 seconds
    const watchdog = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          console.warn('Auth loading watchdog triggered: forcing loading=false');
        }
        return false;
      });
    }, 5000);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Try to get user data from our users table
          try {
            const { data: userData, error } = await users.getByEmail(session.user.email!);
            if (userData && !error) {
              const mappedUser = mapSupabaseUserToUser(session.user, userData);
              setUser(mappedUser);
            } else {
              // Fallback to metadata
              const mappedUser = mapSupabaseUserToUser(session.user);
              setUser(mappedUser);
            }
          } catch (error) {
            console.error('Error fetching user data:', error);
            // Fallback to metadata
            const mappedUser = mapSupabaseUserToUser(session.user);
            setUser(mappedUser);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Login error:', error.message, error);
        return false;
      }
      
      console.log('Login successful, user data:', data.user);
      if (data.user) {
        // Try to get user data from our users table
        try {
          const { data: userData, error: userError } = await users.getByEmail(data.user.email!);
          if (userData && !userError) {
            const mappedUser = mapSupabaseUserToUser(data.user, userData);
            setUser(mappedUser);
          } else {
            // User exists in auth but not in our users table - create the record
            console.log('User exists in auth but not in users table, creating record...');
            try {
              const { data: newUserData, error: createError } = await users.create({
                id: data.user.id,
                email: data.user.email!,
                full_name: data.user.user_metadata?.fullName || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'User',
                role: data.user.user_metadata?.role || 'customer',
                status: 'active'
              });
              
              if (newUserData && !createError) {
                const mappedUser = mapSupabaseUserToUser(data.user, newUserData[0]);
                setUser(mappedUser);
                console.log('Successfully created user record');
              } else {
                console.error('Failed to create user record:', createError);
                // Fallback to metadata
                const mappedUser = mapSupabaseUserToUser(data.user);
                setUser(mappedUser);
              }
            } catch (createError) {
              console.error('Error creating user record:', createError);
              // Fallback to metadata
              const mappedUser = mapSupabaseUserToUser(data.user);
              setUser(mappedUser);
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to metadata
          const mappedUser = mapSupabaseUserToUser(data.user);
          setUser(mappedUser);
        }
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (userData: Partial<User> & { password: string }): Promise<boolean> => {
    try {
      console.log('Attempting registration for:', userData.email);
      
      // Check if user already exists in our users table
      try {
        const { data: existingUser, error: checkError } = await users.getByEmail(userData.email!);
        if (existingUser && !checkError) {
          console.error('User already exists in users table:', existingUser);
          throw new Error('An account with this email already exists. Please try signing in instead.');
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          throw error;
        }
        console.log('User does not exist in users table, proceeding with registration');
      }
      
      // First, create the user in Supabase Auth with email confirmation
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email!,
        password: userData.password,
        options: {
          data: {
            fullName: userData.fullName,
            role: userData.role || 'customer'
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });
      
      if (authError) {
        console.error('Auth registration error:', authError.message, authError);
        if (authError.message.includes('already registered')) {
          throw new Error('An account with this email already exists. Please try signing in instead.');
        } else if (authError.message.includes('password')) {
          throw new Error('Password is too weak. Please use a stronger password.');
        } else if (authError.message.includes('email')) {
          throw new Error('Please enter a valid email address.');
        } else {
          throw new Error(`Registration failed: ${authError.message}`);
        }
      }
      
      console.log('Auth registration response:', authData);
      
      if (authData.user) {
        // Check if email confirmation is required
        if (!authData.session) {
          console.log('Email confirmation required');
          throw new Error('Please check your email and click the confirmation link to complete registration.');
        }
        
        // Create user record in our users table
        try {
          const userRecordData = {
            id: authData.user.id,
            email: userData.email!,
            full_name: userData.fullName!,
            role: userData.role || 'customer',
            status: 'active'
          };
          
          console.log('Creating user record with data:', userRecordData);
          
          const { data: userRecord, error: userError } = await users.create(userRecordData);
          
          if (userError) {
            console.error('User record creation error:', userError);
            if (userError.message.includes('duplicate key')) {
              throw new Error('An account with this email already exists. Please try signing in instead.');
            } else if (userError.message.includes('permission')) {
              throw new Error('Registration failed due to permission error. Please contact support.');
            } else {
              throw new Error(`Failed to create user profile: ${userError.message}`);
            }
          }
          
          console.log('User record created successfully:', userRecord);
          
          // Set the user in context if we have a session
          if (authData.session && userRecord && userRecord.length > 0) {
            const mappedUser = mapSupabaseUserToUser(authData.user, userRecord[0]);
            setUser(mappedUser);
          }
          
          return true;
        } catch (error) {
          console.error('Error creating user record:', error);
          if (error instanceof Error) {
            throw error;
          }
          throw new Error('Failed to create user profile. Please try again or contact support.');
        }
      }
      
      throw new Error('Registration failed. Please try again.');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!user?.id) return false;
      
      const { data, error } = await users.update(user.id, {
        full_name: userData.fullName,
        phone: userData.phone,
        address: userData.address,
        business_name: userData.businessName,
        business_address: userData.businessAddress
      });
      
      if (error) {
        console.error('Profile update error:', error);
        return false;
      }
      
      if (data) {
        const updatedUser = { ...user, ...userData };
        setUser(updatedUser);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Profile update error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const value = {
    user,
    login,
    logout,
    register,
    updateProfile,
    isAuthenticated: !!user,
    isLoading: loading,
  };
  
  console.log('AuthContext: Current state:', {
    user: value.user,
    isAuthenticated: value.isAuthenticated,
    isLoading: value.isLoading
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}