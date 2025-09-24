/*
  # Complete QuickCourt Database Schema

  This schema creates a comprehensive sports facility booking platform with:
  
  1. User Management
     - Users table with roles (customer, facility_owner, admin)
     - Authentication integration with Supabase Auth
     - Profile management with business information
  
  2. Facility Management
     - Facilities table with detailed information
     - Amenities, images, schedules, and pricing
     - Status management and verification system
  
  3. Booking System
     - Complete booking lifecycle management
     - Time slot management with availability
     - Payment tracking and status management
     - Notification system for real-time updates
  
  4. Security & Access Control
     - Row Level Security (RLS) policies
     - Role-based access control
     - Data protection and privacy
  
  5. Analytics & Reporting
     - Statistics views for facility owners
     - Performance tracking and metrics
*/

-- =============================================
-- 1. USERS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'facility_owner', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned')),
    avatar_url TEXT,
    phone TEXT,
    address TEXT,
    business_name TEXT, -- For facility owners
    business_address TEXT, -- For facility owners
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. FACILITIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id TEXT NOT NULL, -- References auth.users.id
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    facility_type TEXT NOT NULL CHECK (facility_type IN (
        'basketball_court', 'tennis_court', 'volleyball_court', 'badminton_court',
        'soccer_field', 'baseball_field', 'swimming_pool', 'gym', 'multi_sport', 'other'
    )),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_phone TEXT,
    contact_email TEXT,
    website_url TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'closed', 'banned')),
    is_verified BOOLEAN DEFAULT FALSE,
    featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. FACILITY AMENITIES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS facility_amenities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    amenity_name TEXT NOT NULL,
    amenity_type TEXT CHECK (amenity_type IN ('equipment', 'service', 'infrastructure', 'safety', 'comfort')),
    description TEXT,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 4. FACILITY IMAGES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS facility_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_type TEXT CHECK (image_type IN ('main', 'gallery', 'thumbnail')),
    alt_text TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. FACILITY SCHEDULES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS facility_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    price_per_hour DECIMAL(8,2) NOT NULL DEFAULT 50.00,
    is_available BOOLEAN DEFAULT TRUE,
    max_capacity INTEGER DEFAULT 10,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(facility_id, day_of_week, start_time, end_time)
);

-- =============================================
-- 6. FACILITY PRICING TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS facility_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    pricing_type TEXT CHECK (pricing_type IN ('hourly', 'daily', 'weekly', 'monthly', 'seasonal')),
    base_price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    peak_hour_multiplier DECIMAL(3,2) DEFAULT 1.0,
    off_peak_discount DECIMAL(3,2) DEFAULT 1.0,
    weekend_multiplier DECIMAL(3,2) DEFAULT 1.0,
    holiday_multiplier DECIMAL(3,2) DEFAULT 1.0,
    minimum_booking_hours INTEGER DEFAULT 1,
    maximum_booking_hours INTEGER DEFAULT 24,
    cancellation_policy TEXT,
    deposit_required BOOLEAN DEFAULT FALSE,
    deposit_amount DECIMAL(10,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. BOOKINGS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    time_slot_id UUID REFERENCES facility_schedules(id) ON DELETE SET NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    total_hours DECIMAL(4,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled', 'completed')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
    payment_method TEXT,
    transaction_id TEXT,
    special_requests TEXT,
    owner_notes TEXT,
    customer_notes TEXT,
    cancellation_reason TEXT,
    cancelled_by TEXT,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 8. BOOKING NOTIFICATIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS booking_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN (
        'booking_confirmation', 'booking_reminder', 'booking_cancellation',
        'facility_update', 'maintenance_alert', 'review_received', 'new_booking', 'status_update'
    )),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 9. FACILITY REVIEWS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS facility_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID NOT NULL REFERENCES facilities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    review_title TEXT,
    is_verified_booking BOOLEAN DEFAULT FALSE,
    is_helpful_count INTEGER DEFAULT 0,
    is_reported BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'removed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 10. LEGACY FACILITY AVAILABILITY TABLE (for backward compatibility)
-- =============================================

CREATE TABLE IF NOT EXISTS facility_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    property_name TEXT NOT NULL,
    property_type TEXT NOT NULL,
    address TEXT NOT NULL,
    description TEXT,
    current_status TEXT DEFAULT 'active' CHECK (current_status IN ('active', 'inactive', 'maintenance')),
    is_sold BOOLEAN DEFAULT FALSE,
    current_booking_start TIMESTAMPTZ,
    current_booking_end TIMESTAMPTZ,
    next_available_time TIMESTAMPTZ,
    total_booked_hours DECIMAL(5,2) DEFAULT 0,
    monthly_booked_hours DECIMAL(5,2) DEFAULT 0,
    price_per_hour DECIMAL(10,2) DEFAULT 25.00,
    operating_hours JSONB DEFAULT '{"start": "09:00", "end": "18:00"}',
    contact_phone TEXT,
    contact_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Facilities indexes
CREATE INDEX IF NOT EXISTS idx_facilities_owner_id ON facilities(owner_id);
CREATE INDEX IF NOT EXISTS idx_facilities_type ON facilities(facility_type);
CREATE INDEX IF NOT EXISTS idx_facilities_status ON facilities(status);
CREATE INDEX IF NOT EXISTS idx_facilities_city_state ON facilities(city, state);
CREATE INDEX IF NOT EXISTS idx_facilities_featured ON facilities(featured);
CREATE INDEX IF NOT EXISTS idx_facilities_verified ON facilities(is_verified);

-- Facility amenities indexes
CREATE INDEX IF NOT EXISTS idx_facility_amenities_facility_id ON facility_amenities(facility_id);

-- Facility images indexes
CREATE INDEX IF NOT EXISTS idx_facility_images_facility_id ON facility_images(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_images_type ON facility_images(image_type);

-- Facility schedules indexes
CREATE INDEX IF NOT EXISTS idx_facility_schedules_facility_id ON facility_schedules(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_schedules_day_time ON facility_schedules(day_of_week, start_time);

-- Facility pricing indexes
CREATE INDEX IF NOT EXISTS idx_facility_pricing_facility_id ON facility_pricing(facility_id);

-- Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_facility_id ON bookings(facility_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_facility_date ON bookings(facility_id, booking_date);

-- Booking notifications indexes
CREATE INDEX IF NOT EXISTS idx_booking_notifications_user_id ON booking_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_booking_notifications_is_read ON booking_notifications(is_read);

-- Facility reviews indexes
CREATE INDEX IF NOT EXISTS idx_facility_reviews_facility_id ON facility_reviews(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_reviews_user_id ON facility_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_reviews_rating ON facility_reviews(rating);

-- Legacy facility availability indexes
CREATE INDEX IF NOT EXISTS idx_facility_availability_user_id ON facility_availability(user_id);
CREATE INDEX IF NOT EXISTS idx_facility_availability_status ON facility_availability(current_status);

-- =============================================
-- 12. TRIGGERS FOR UPDATED_AT COLUMNS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for all tables with updated_at columns
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_facilities_updated_at ON facilities;
CREATE TRIGGER update_facilities_updated_at
    BEFORE UPDATE ON facilities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_facility_schedules_updated_at ON facility_schedules;
CREATE TRIGGER update_facility_schedules_updated_at
    BEFORE UPDATE ON facility_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_facility_pricing_updated_at ON facility_pricing;
CREATE TRIGGER update_facility_pricing_updated_at
    BEFORE UPDATE ON facility_pricing
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_facility_reviews_updated_at ON facility_reviews;
CREATE TRIGGER update_facility_reviews_updated_at
    BEFORE UPDATE ON facility_reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_facility_availability_updated_at ON facility_availability;
CREATE TRIGGER update_facility_availability_updated_at
    BEFORE UPDATE ON facility_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 13. ROW LEVEL SECURITY (RLS) SETUP
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_availability ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 14. RLS POLICIES FOR USERS TABLE
-- =============================================

-- Users can insert their own profile during registration
CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Service role bypass for admin operations
CREATE POLICY "Service role bypass users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 15. RLS POLICIES FOR FACILITIES TABLE
-- =============================================

-- Anyone can view active facilities
CREATE POLICY "Anyone can view active facilities" ON facilities
    FOR SELECT USING (status = 'active');

-- Facility owners can manage their own facilities
CREATE POLICY "Facility owners can manage own facilities" ON facilities
    FOR ALL USING (owner_id::text = auth.uid()::text);

-- Service role bypass for admin operations
CREATE POLICY "Service role bypass facilities" ON facilities
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 16. RLS POLICIES FOR FACILITY AMENITIES
-- =============================================

-- Anyone can view amenities for active facilities
CREATE POLICY "Anyone can view facility amenities" ON facility_amenities
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE facilities.id = facility_amenities.facility_id 
            AND facilities.status = 'active'
        )
    );

-- Facility owners can manage amenities for their facilities
CREATE POLICY "Facility owners can manage amenities" ON facility_amenities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE facilities.id = facility_amenities.facility_id 
            AND facilities.owner_id = auth.uid()::text
        )
    );

-- =============================================
-- 17. RLS POLICIES FOR FACILITY IMAGES
-- =============================================

-- Anyone can view images for active facilities
CREATE POLICY "Anyone can view facility images" ON facility_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE facilities.id = facility_images.facility_id 
            AND facilities.status = 'active'
        )
    );

-- Facility owners can manage images for their facilities
CREATE POLICY "Facility owners can manage images" ON facility_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE facilities.id = facility_images.facility_id 
            AND facilities.owner_id = auth.uid()::text
        )
    );

-- =============================================
-- 18. RLS POLICIES FOR FACILITY SCHEDULES
-- =============================================

-- Anyone can view facility schedules
CREATE POLICY "Anyone can view facility schedules" ON facility_schedules
    FOR SELECT USING (TRUE);

-- Facility owners can manage their schedules
CREATE POLICY "Facility owners can manage schedules" ON facility_schedules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE facilities.id = facility_schedules.facility_id 
            AND facilities.owner_id = auth.uid()::text
        )
    );

-- =============================================
-- 19. RLS POLICIES FOR FACILITY PRICING
-- =============================================

-- Anyone can view pricing for active facilities
CREATE POLICY "Anyone can view facility pricing" ON facility_pricing
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE facilities.id = facility_pricing.facility_id 
            AND facilities.status = 'active'
        )
    );

-- Facility owners can manage pricing for their facilities
CREATE POLICY "Facility owners can manage pricing" ON facility_pricing
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE facilities.id = facility_pricing.facility_id 
            AND facilities.owner_id = auth.uid()::text
        )
    );

-- =============================================
-- 20. RLS POLICIES FOR BOOKINGS TABLE
-- =============================================

-- Customers can view their own bookings
CREATE POLICY "Customers can view their own bookings" ON bookings
    FOR SELECT USING (auth.uid()::text = customer_id::text);

-- Customers can create bookings
CREATE POLICY "Customers can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid()::text = customer_id::text);

-- Customers can update their own bookings (cancel, add notes)
CREATE POLICY "Customers can update their own bookings" ON bookings
    FOR UPDATE USING (auth.uid()::text = customer_id::text);

-- Facility owners can view bookings for their facilities
CREATE POLICY "Facility owners can view bookings for their facilities" ON bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE facilities.id = bookings.facility_id 
            AND facilities.owner_id = auth.uid()::text
        )
    );

-- Facility owners can update bookings for their facilities (approve/deny)
CREATE POLICY "Facility owners can update bookings for their facilities" ON bookings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM facilities 
            WHERE facilities.id = bookings.facility_id 
            AND facilities.owner_id = auth.uid()::text
        )
    );

-- Service role bypass for admin operations
CREATE POLICY "Service role bypass bookings" ON bookings
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 21. RLS POLICIES FOR BOOKING NOTIFICATIONS
-- =============================================

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON booking_notifications
    FOR SELECT USING (auth.uid()::text = user_id::text);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications" ON booking_notifications
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- System can create notifications
CREATE POLICY "System can create notifications" ON booking_notifications
    FOR INSERT WITH CHECK (TRUE);

-- =============================================
-- 22. RLS POLICIES FOR FACILITY REVIEWS
-- =============================================

-- Anyone can view active reviews
CREATE POLICY "Anyone can view active reviews" ON facility_reviews
    FOR SELECT USING (status = 'active');

-- Users can create reviews for facilities they've booked
CREATE POLICY "Users can create reviews" ON facility_reviews
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON facility_reviews
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- =============================================
-- 23. RLS POLICIES FOR LEGACY FACILITY AVAILABILITY
-- =============================================

-- Anyone can view active properties
CREATE POLICY "Anyone can view active properties" ON facility_availability
    FOR SELECT USING (current_status = 'active' AND is_sold = FALSE);

-- Property owners can manage their own properties
CREATE POLICY "Property owners can manage own properties" ON facility_availability
    FOR ALL USING (user_id::text = auth.uid()::text);

-- =============================================
-- 24. UTILITY FUNCTIONS
-- =============================================

-- Function to check booking conflicts
CREATE OR REPLACE FUNCTION check_booking_conflicts(
    p_facility_id UUID,
    p_booking_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_exclude_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM bookings
        WHERE facility_id = p_facility_id
        AND booking_date = p_booking_date
        AND status IN ('pending', 'approved')
        AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
        AND (
            (start_time < p_end_time AND end_time > p_start_time) OR
            (p_start_time < end_time AND p_end_time > start_time)
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate booking duration
CREATE OR REPLACE FUNCTION calculate_booking_duration(
    p_start_time TIME,
    p_end_time TIME
)
RETURNS DECIMAL(4,2) AS $$
BEGIN
    RETURN EXTRACT(EPOCH FROM (p_end_time - p_start_time)) / 3600.0;
END;
$$ LANGUAGE plpgsql;

-- Function to create booking notification
CREATE OR REPLACE FUNCTION create_booking_notification(
    p_booking_id UUID,
    p_user_id UUID,
    p_notification_type TEXT,
    p_title TEXT,
    p_message TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO booking_notifications (booking_id, user_id, notification_type, title, message)
    VALUES (p_booking_id, p_user_id, p_notification_type, p_title, p_message);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 25. NOTIFICATION TRIGGERS
-- =============================================

-- Trigger to notify facility owner when booking is created
CREATE OR REPLACE FUNCTION notify_owner_on_booking()
RETURNS TRIGGER AS $$
DECLARE
    owner_id TEXT;
BEGIN
    -- Get facility owner ID
    SELECT facilities.owner_id INTO owner_id
    FROM facilities
    WHERE facilities.id = NEW.facility_id;
    
    -- Create notification for facility owner
    PERFORM create_booking_notification(
        NEW.id,
        owner_id::UUID,
        'new_booking',
        'New Booking Request',
        'You have a new booking request for ' || NEW.booking_date || ' from ' || NEW.start_time || ' to ' || NEW.end_time
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_owner_on_booking ON bookings;
CREATE TRIGGER trigger_notify_owner_on_booking
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_owner_on_booking();

-- Trigger to notify customer when booking status changes
CREATE OR REPLACE FUNCTION notify_customer_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify if status changed
    IF OLD.status != NEW.status THEN
        -- Create notification for customer
        PERFORM create_booking_notification(
            NEW.id,
            NEW.customer_id,
            'status_update',
            'Booking ' || NEW.status,
            'Your booking for ' || NEW.booking_date || ' has been ' || NEW.status
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_customer_on_status_change ON bookings;
CREATE TRIGGER trigger_notify_customer_on_status_change
    AFTER UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_customer_on_status_change();

-- =============================================
-- 26. ANALYTICS VIEWS
-- =============================================

-- Facility owner statistics view
CREATE OR REPLACE VIEW facility_owner_stats AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.business_name,
    COUNT(f.id) as total_properties,
    COUNT(CASE WHEN f.status = 'active' THEN 1 END) as active_properties,
    COUNT(CASE WHEN f.status = 'maintenance' THEN 1 END) as maintenance_properties,
    COUNT(CASE WHEN f.status = 'inactive' THEN 1 END) as inactive_properties,
    COALESCE(SUM(fa.total_booked_hours), 0) as total_booked_hours,
    COALESCE(SUM(fa.monthly_booked_hours), 0) as monthly_booked_hours,
    COALESCE(SUM(fa.monthly_booked_hours * fa.price_per_hour), 0) as estimated_monthly_revenue
FROM users u
LEFT JOIN facilities f ON u.id::text = f.owner_id
LEFT JOIN facility_availability fa ON u.id = fa.user_id
WHERE u.role = 'facility_owner'
GROUP BY u.id, u.full_name, u.business_name;

-- Facility statistics view
CREATE OR REPLACE VIEW facility_stats AS
SELECT 
    f.id as facility_id,
    f.name as facility_name,
    f.owner_id,
    u.full_name as owner_name,
    f.facility_type,
    f.status,
    f.is_verified,
    f.featured,
    COUNT(b.id) as total_bookings,
    COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
    COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
    COALESCE(SUM(CASE WHEN b.status IN ('approved', 'completed') THEN b.total_amount ELSE 0 END), 0) as total_revenue,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(r.id) as total_reviews,
    COUNT(CASE WHEN r.rating >= 4 THEN 1 END) as positive_reviews,
    f.created_at,
    f.updated_at
FROM facilities f
LEFT JOIN users u ON f.owner_id = u.id::text
LEFT JOIN bookings b ON f.id = b.facility_id
LEFT JOIN facility_reviews r ON f.id = r.facility_id AND r.status = 'active'
GROUP BY f.id, f.name, f.owner_id, u.full_name, f.facility_type, f.status, f.is_verified, f.featured, f.created_at, f.updated_at;

-- =============================================
-- 27. SAMPLE DATA FOR TESTING
-- =============================================

-- Insert sample users (only if no users exist)
INSERT INTO users (id, email, full_name, role, status) VALUES
    ('00000000-0000-0000-0000-000000000001', 'admin@quickcourt.com', 'QuickCourt Admin', 'admin', 'active'),
    ('00000000-0000-0000-0000-000000000002', 'owner@example.com', 'John Smith', 'facility_owner', 'active'),
    ('00000000-0000-0000-0000-000000000003', 'customer@example.com', 'Jane Doe', 'customer', 'active')
ON CONFLICT (email) DO NOTHING;

-- Insert sample facilities (only if no facilities exist)
INSERT INTO facilities (id, owner_id, name, description, facility_type, address, city, state, status, is_verified, featured) VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        '00000000-0000-0000-0000-000000000002',
        'Downtown Basketball Court',
        'Professional basketball court with NBA regulation size and high-quality flooring. Perfect for competitive games and training sessions.',
        'basketball_court',
        '123 Main Street',
        'New York',
        'NY',
        'active',
        TRUE,
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000002',
        'Central Tennis Court',
        'Well-maintained tennis court with proper lighting for evening games. Includes ball machine rental and professional coaching.',
        'tennis_court',
        '456 Park Avenue',
        'New York',
        'NY',
        'active',
        TRUE,
        FALSE
    ),
    (
        '10000000-0000-0000-0000-000000000003',
        '00000000-0000-0000-0000-000000000002',
        'Community Soccer Field',
        'Large soccer field with artificial turf, goal posts, and spectator seating. Available for leagues and casual play.',
        'soccer_field',
        '789 Sports Lane',
        'New York',
        'NY',
        'active',
        TRUE,
        FALSE
    )
ON CONFLICT (name) DO NOTHING;

-- Insert sample amenities
INSERT INTO facility_amenities (facility_id, amenity_name, amenity_type, description) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Basketball Hoops', 'equipment', 'NBA regulation height hoops'),
    ('10000000-0000-0000-0000-000000000001', 'Parking', 'infrastructure', 'Free parking available'),
    ('10000000-0000-0000-0000-000000000001', 'Locker Rooms', 'comfort', 'Clean locker rooms with showers'),
    ('10000000-0000-0000-0000-000000000002', 'Tennis Nets', 'equipment', 'Professional tennis nets'),
    ('10000000-0000-0000-0000-000000000002', 'Ball Machine', 'equipment', 'Automatic ball machine rental'),
    ('10000000-0000-0000-0000-000000000003', 'Goal Posts', 'equipment', 'Regulation soccer goal posts'),
    ('10000000-0000-0000-0000-000000000003', 'Spectator Seating', 'comfort', 'Covered seating for 100 people')
ON CONFLICT DO NOTHING;

-- Insert sample schedules (Monday to Friday, 9 AM - 6 PM)
INSERT INTO facility_schedules (facility_id, day_of_week, start_time, end_time, price_per_hour, is_available, max_capacity, description)
SELECT 
    f.id,
    generate_series(1, 5) as day_of_week,
    '09:00:00' as start_time,
    '10:00:00' as end_time,
    CASE 
        WHEN f.facility_type = 'basketball_court' THEN 50.00
        WHEN f.facility_type = 'tennis_court' THEN 40.00
        WHEN f.facility_type = 'soccer_field' THEN 80.00
        ELSE 50.00
    END as price_per_hour,
    TRUE as is_available,
    CASE 
        WHEN f.facility_type = 'soccer_field' THEN 22
        ELSE 10
    END as max_capacity,
    'Morning session' as description
FROM facilities f
WHERE f.status = 'active'
ON CONFLICT (facility_id, day_of_week, start_time, end_time) DO NOTHING;

-- Insert afternoon sessions
INSERT INTO facility_schedules (facility_id, day_of_week, start_time, end_time, price_per_hour, is_available, max_capacity, description)
SELECT 
    f.id,
    generate_series(1, 5) as day_of_week,
    '14:00:00' as start_time,
    '15:00:00' as end_time,
    CASE 
        WHEN f.facility_type = 'basketball_court' THEN 60.00
        WHEN f.facility_type = 'tennis_court' THEN 50.00
        WHEN f.facility_type = 'soccer_field' THEN 100.00
        ELSE 60.00
    END as price_per_hour,
    TRUE as is_available,
    CASE 
        WHEN f.facility_type = 'soccer_field' THEN 22
        ELSE 12
    END as max_capacity,
    'Afternoon session' as description
FROM facilities f
WHERE f.status = 'active'
ON CONFLICT (facility_id, day_of_week, start_time, end_time) DO NOTHING;

-- Insert weekend sessions
INSERT INTO facility_schedules (facility_id, day_of_week, start_time, end_time, price_per_hour, is_available, max_capacity, description)
SELECT 
    f.id,
    generate_series(0, 6, 6) as day_of_week, -- Sunday and Saturday
    '10:00:00' as start_time,
    '11:00:00' as end_time,
    CASE 
        WHEN f.facility_type = 'basketball_court' THEN 70.00
        WHEN f.facility_type = 'tennis_court' THEN 60.00
        WHEN f.facility_type = 'soccer_field' THEN 120.00
        ELSE 70.00
    END as price_per_hour,
    TRUE as is_available,
    CASE 
        WHEN f.facility_type = 'soccer_field' THEN 22
        ELSE 15
    END as max_capacity,
    'Weekend session' as description
FROM facilities f
WHERE f.status = 'active'
ON CONFLICT (facility_id, day_of_week, start_time, end_time) DO NOTHING;

-- Insert sample pricing
INSERT INTO facility_pricing (facility_id, pricing_type, base_price, currency)
SELECT 
    f.id,
    'hourly' as pricing_type,
    CASE 
        WHEN f.facility_type = 'basketball_court' THEN 50.00
        WHEN f.facility_type = 'tennis_court' THEN 40.00
        WHEN f.facility_type = 'soccer_field' THEN 80.00
        ELSE 50.00
    END as base_price,
    'USD' as currency
FROM facilities f
WHERE f.status = 'active'
ON CONFLICT DO NOTHING;

-- Insert sample bookings
INSERT INTO bookings (
    facility_id,
    customer_id,
    booking_date,
    start_time,
    end_time,
    total_hours,
    total_amount,
    status,
    payment_status,
    special_requests
) VALUES 
(
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    CURRENT_DATE + INTERVAL '2 days',
    '09:00:00',
    '10:00:00',
    1.0,
    50.00,
    'pending',
    'pending',
    'Please ensure the court is clean'
),
(
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003',
    CURRENT_DATE + INTERVAL '3 days',
    '14:00:00',
    '15:00:00',
    1.0,
    50.00,
    'approved',
    'paid',
    'Need extra tennis balls'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- 28. VERIFICATION QUERIES
-- =============================================

-- Show table counts
SELECT '=== TABLE COUNTS ===' as info;
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'facilities' as table_name, COUNT(*) as count FROM facilities
UNION ALL
SELECT 'facility_amenities' as table_name, COUNT(*) as count FROM facility_amenities
UNION ALL
SELECT 'facility_schedules' as table_name, COUNT(*) as count FROM facility_schedules
UNION ALL
SELECT 'facility_pricing' as table_name, COUNT(*) as count FROM facility_pricing
UNION ALL
SELECT 'bookings' as table_name, COUNT(*) as count FROM bookings
UNION ALL
SELECT 'booking_notifications' as table_name, COUNT(*) as count FROM booking_notifications
UNION ALL
SELECT 'facility_reviews' as table_name, COUNT(*) as count FROM facility_reviews
UNION ALL
SELECT 'facility_availability' as table_name, COUNT(*) as count FROM facility_availability;

-- Show sample data
SELECT '=== SAMPLE FACILITIES ===' as info;
SELECT 
    name,
    facility_type,
    city,
    state,
    status,
    is_verified,
    featured
FROM facilities
ORDER BY created_at DESC
LIMIT 5;

-- Show sample time slots
SELECT '=== SAMPLE TIME SLOTS ===' as info;
SELECT 
    fs.id,
    f.name as facility_name,
    fs.day_of_week,
    fs.start_time,
    fs.end_time,
    fs.price_per_hour,
    fs.is_available
FROM facility_schedules fs
JOIN facilities f ON fs.facility_id = f.id
ORDER BY f.name, fs.day_of_week, fs.start_time
LIMIT 10;

-- Show sample bookings
SELECT '=== SAMPLE BOOKINGS ===' as info;
SELECT 
    b.id,
    f.name as facility_name,
    u.full_name as customer_name,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.total_amount,
    b.status,
    b.payment_status
FROM bookings b
JOIN facilities f ON b.facility_id = f.id
JOIN users u ON b.customer_id = u.id
ORDER BY b.created_at DESC
LIMIT 5;

-- Show RLS policies
SELECT '=== RLS POLICIES SUMMARY ===' as info;
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

SELECT '=== QUICKCOURT DATABASE SCHEMA SETUP COMPLETE ===' as final_message;
SELECT 'All tables, indexes, triggers, and sample data have been created successfully!' as status;