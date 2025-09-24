import { createClient } from '@supabase/supabase-js'

// Load environment variables (Vite). Validate to prevent silent runtime failures.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl ? 'VITE_SUPABASE_URL' : null,
    !supabaseAnonKey ? 'VITE_SUPABASE_ANON_KEY' : null,
  ].filter(Boolean).join(', ')
  throw new Error(
    `Missing required environment variable(s): ${missing}. ` +
    'Place a .env file at the envDir configured by vite.config.ts (envDir: "../"), ' +
    'which means it should live at the project root: q2/.env. Ensure variables are prefixed with VITE_.\n' +
    'Example:\n' +
    'VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co\n' +
    'VITE_SUPABASE_ANON_KEY=ey...\n'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// User management functions
export const users = {
  // Create a new user
  create: async (userData: any) => {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
    return { data, error }
  },

  // Get user by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Get user by email
  getByEmail: async (email: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single()
    return { data, error }
  },

  // Update user
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Get all users (admin only)
  getAll: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  }
}

// New Facility management functions
export const facilities = {
  // Create a new facility
  create: async (facilityData: any) => {
    const { data, error } = await supabase
      .from('facilities')
      .insert([facilityData])
      .select()
    return { data, error }
  },

  // Get facility by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('facilities')
      .select(`
        *,
        facility_amenities(*),
        facility_images(*),
        facility_schedules(*),
        facility_pricing(*)
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Get all facilities (for users to browse) - only active ones
  getAll: async () => {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get all facilities including banned ones (for admin and filtering)
  getAllWithStatus: async () => {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get facilities by owner
  getByOwner: async (ownerId: string) => {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Update a facility
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('facilities')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Delete a facility
  delete: async (id: string) => {
    const { data, error } = await supabase
      .from('facilities')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Search facilities
  search: async (params: any) => {
    let query = supabase
      .from('facilities')
      .select(`
        *,
        facility_amenities(*),
        facility_images(*),
        facility_schedules(*),
        facility_pricing(*)
      `)
      .eq('status', 'active')

    if (params.facility_type) {
      query = query.eq('facility_type', params.facility_type)
    }
    if (params.city) {
      query = query.eq('city', params.city)
    }
    if (params.state) {
      query = query.eq('state', params.state)
    }
    if (params.is_verified) {
      query = query.eq('is_verified', params.is_verified)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    return { data, error }
  }
}

// Facility amenities management
export const facilityAmenities = {
  // Add amenities to a facility
  add: async (facilityId: string, amenities: any[]) => {
    const amenitiesData = amenities.map(amenity => ({
      facility_id: facilityId,
      ...amenity
    }))
    
    const { data, error } = await supabase
      .from('facility_amenities')
      .insert(amenitiesData)
      .select()
    return { data, error }
  },

  // Get amenities for a facility
  getByFacility: async (facilityId: string) => {
    const { data, error } = await supabase
      .from('facility_amenities')
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: true })
    return { data, error }
  }
}

// Facility images management
export const facilityImages = {
  // Add images to a facility
  add: async (facilityId: string, images: any[]) => {
    const imagesData = images.map((image, index) => ({
      facility_id: facilityId,
      ...image,
      display_order: index
    }))
    
    const { data, error } = await supabase
      .from('facility_images')
      .insert(imagesData)
      .select()
    return { data, error }
  },

  // Get images for a facility
  getByFacility: async (facilityId: string) => {
    const { data, error } = await supabase
      .from('facility_images')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
    return { data, error }
  }
}

// Facility schedules management
export const facilitySchedules = {
  // Add schedules to a facility
  add: async (facilityId: string, schedules: any[]) => {
    const schedulesData = schedules.map(schedule => ({
      facility_id: facilityId,
      ...schedule
    }))
    
    const { data, error } = await supabase
      .from('facility_schedules')
      .insert(schedulesData)
      .select()
    return { data, error }
  },

  // Get schedules for a facility
  getByFacility: async (facilityId: string) => {
    const { data, error } = await supabase
      .from('facility_schedules')
      .select('*')
      .eq('facility_id', facilityId)
      .order('day_of_week', { ascending: true })
    return { data, error }
  }
}

// Facility pricing management
export const facilityPricing = {
  // Add pricing to a facility
  add: async (facilityId: string, pricing: any) => {
    const { data, error } = await supabase
      .from('facility_pricing')
      .insert([{
        facility_id: facilityId,
        ...pricing
      }])
      .select()
    return { data, error }
  },

  // Get pricing for a facility
  getByFacility: async (facilityId: string) => {
    const { data, error } = await supabase
      .from('facility_pricing')
      .select('*')
      .eq('facility_id', facilityId)
      .single()
    return { data, error }
  }
}

// Legacy property management functions (for backward compatibility)
export const properties = {
  // Create a new property
  create: async (propertyData: any) => {
    const { data, error } = await supabase
      .from('facility_availability')
      .insert([propertyData])
      .select()
    return { data, error }
  },

  // Get all properties (for users to browse)
  getAll: async () => {
    const { data, error } = await supabase
      .from('facility_availability')
      .select(`
        id,
        user_id,
        property_name,
        property_type,
        address,
        description,
        current_status,
        is_sold,
        current_booking_start,
        current_booking_end,
        next_available_time,
        total_booked_hours,
        monthly_booked_hours,
        price_per_hour,
        operating_hours,
        contact_phone,
        contact_email,
        created_at
      `)
      .eq('current_status', 'active')
      .eq('is_sold', false)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get properties by owner
  getByOwner: async (ownerId: string) => {
    const { data, error } = await supabase
      .from('facility_availability')
      .select(`
        id,
        user_id,
        property_name,
        property_type,
        address,
        description,
        current_status,
        is_sold,
        current_booking_start,
        current_booking_end,
        next_available_time,
        total_booked_hours,
        monthly_booked_hours,
        price_per_hour,
        operating_hours,
        contact_phone,
        contact_email,
        created_at
      `)
      .eq('user_id', ownerId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Update a property
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('facility_availability')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Delete a property
  delete: async (id: string) => {
    const { data, error } = await supabase
      .from('facility_availability')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Get a property by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('facility_availability')
      .select(`
        id,
        user_id,
        property_name,
        property_type,
        address,
        description,
        current_status,
        is_sold,
        current_booking_start,
        current_booking_end,
        next_available_time,
        total_booked_hours,
        monthly_booked_hours,
        price_per_hour,
        operating_hours,
        contact_phone,
        contact_email,
        created_at
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Test connection to facility_availability table
  testConnection: async () => {
    const { data, error } = await supabase
      .from('facility_availability')
      .select('id')
      .limit(1)
    return { data, error }
  }
}

// Facility owner statistics
export const facilityStats = {
  // Get statistics for a specific facility owner
  getByOwner: async (ownerId: string) => {
    const { data, error } = await supabase
      .from('facility_owner_stats')
      .select('*')
      .eq('user_id', ownerId)
      .single()
    return { data, error }
  },

  // Get all facility owner statistics (admin only)
  getAll: async () => {
    const { data, error } = await supabase
      .from('facility_owner_stats')
      .select('*')
      .order('total_properties', { ascending: false })
    return { data, error }
  }
}

// Time slots management
export const timeSlots = {
  // Create a new time slot
  create: async (slotData: any) => {
    const { data, error } = await supabase
      .from('facility_schedules')
      .insert([slotData])
      .select()
    return { data, error }
  },

  // Get time slots for a facility
  getByFacility: async (facilityId: string) => {
    const { data, error } = await supabase
      .from('facility_schedules')
      .select('*')
      .eq('facility_id', facilityId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })
    return { data, error }
  },

  // Get time slots by day of week for a facility
  getByFacilityAndDay: async (facilityId: string, dayOfWeek: number) => {
    const { data, error } = await supabase
      .from('facility_schedules')
      .select('*')
      .eq('facility_id', facilityId)
      .eq('day_of_week', dayOfWeek)
      .order('start_time', { ascending: true })
    return { data, error }
  },

  // Update a time slot
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('facility_schedules')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Delete a time slot
  delete: async (id: string) => {
    const { data, error } = await supabase
      .from('facility_schedules')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Get all time slots for an owner (across all facilities)
  getByOwner: async (ownerId: string) => {
    const { data, error } = await supabase
      .from('facility_schedules')
      .select(`
        *,
        facilities!inner(owner_id)
      `)
      .eq('facilities.owner_id', ownerId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })
    return { data, error }
  }
}

// Booking management
export const bookings = {
  // Create a new booking
  create: async (bookingData: any) => {
    const { data, error } = await supabase
      .from('bookings')
      .insert([bookingData])
      .select()
    return { data, error }
  },

  // Get bookings for a customer
  getByCustomer: async (customerId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        facilities (
          id,
          name,
          facility_type,
          address,
          city,
          state,
          contact_phone,
          contact_email
        )
      `)
      .eq('customer_id', customerId)
      .order('booking_date', { ascending: false })
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get bookings for a facility owner
  getByOwner: async (ownerId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        facilities!inner(owner_id),
        users!bookings_customer_id_fkey (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('facilities.owner_id', ownerId)
      .order('booking_date', { ascending: false })
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get bookings for a specific facility
  getByFacility: async (facilityId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        users!bookings_customer_id_fkey (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('facility_id', facilityId)
      .order('booking_date', { ascending: false })
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Get a specific booking by ID
  getById: async (bookingId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        facilities (
          id,
          name,
          facility_type,
          address,
          city,
          state,
          contact_phone,
          contact_email,
          owner_id
        ),
        users!bookings_customer_id_fkey (
          id,
          full_name,
          email,
          phone
        )
      `)
      .eq('id', bookingId)
      .single()
    return { data, error }
  },

  // Update a booking (approve/deny/cancel)
  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
    return { data, error }
  },

  // Delete a booking
  delete: async (id: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Check for booking conflicts
  checkConflicts: async (facilityId: string, bookingDate: string, startTime: string, endTime: string, excludeBookingId?: string) => {
    let query = supabase
      .from('bookings')
      .select('id')
      .eq('facility_id', facilityId)
      .eq('booking_date', bookingDate)
      .in('status', ['pending', 'approved']);

    if (excludeBookingId) {
      query = query.neq('id', excludeBookingId);
    }

    const { data, error } = await query;
    return { data, error }
  },

  // Get booking statistics
  getStats: async (userId: string, userRole: string) => {
    if (userRole === 'customer') {
      const { data, error } = await supabase
        .from('bookings')
        .select('status, payment_status')
        .eq('customer_id', userId);
      return { data, error };
    }

    if (userRole === 'facility_owner') {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          status, payment_status,
          facilities!inner(owner_id)
        `)
        .eq('facilities.owner_id', userId);
      return { data, error };
    }

    throw new Error('Invalid userRole provided to bookings.getStats');
  }
}

// Notifications management
export const notifications = {
  // Get notifications for a user
  getByUser: async (userId: string) => {
    const { data, error } = await supabase
      .from('booking_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Mark notification as read
  markAsRead: async (notificationId: string) => {
    const { data, error } = await supabase
      .from('booking_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
    return { data, error }
  },

  // Mark all notifications as read for a user
  markAllAsRead: async (userId: string) => {
    const { data, error } = await supabase
      .from('booking_notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select()
    return { data, error }
  },

  // Get unread notification count
  getUnreadCount: async (userId: string) => {
    const { count, error } = await supabase
      .from('booking_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    return { count, error }
  }
}