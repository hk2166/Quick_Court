import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  TrendingUp, 
  BookOpen, 
  Heart,
  ArrowRight,
  Search,
  Filter,
  Eye,
  Clock as ClockIcon,
  CheckCircle,
  X,
  Plus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { facilities, bookings } from '../../lib/supabase';
import { Facility } from '../../types/facility';

interface CustomerBooking {
  id: string;
  facilityId: string;
  facilityName: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  price: number;
  endTime: string;
  isVacant: boolean;
  nextAvailable?: string;
}

interface FavoriteFacility {
  id: string;
  name: string;
  type: string;
  city: string;
  rating: number;
  image?: string;
}

export default function CustomerDashboard() {
  console.log('CustomerDashboard component rendering...');
  
  const { user } = useAuth();
  console.log('User from auth context:', user);
  
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<CustomerBooking[]>([]);
  const [favoriteFacilities, setFavoriteFacilities] = useState<FavoriteFacility[]>([]);
  const [nearbyFacilities, setNearbyFacilities] = useState<Facility[]>([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0
  });

  // Add error boundary state
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  console.log('State variables initialized successfully');

  useEffect(() => {
    const loadCustomerData = async () => {
      try {
        setLoading(true);
        console.log('Loading customer dashboard data...');

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log('Customer dashboard loading timeout reached, stopping loading state');
          setLoading(false);
        }, 10000); // 10 second timeout

        // Load actual bookings if user is authenticated
        if (user?.id) {
          try {
            const { data: bookingsData, error: bookingsError } = await bookings.getByCustomer(user.id);
            console.log('Bookings API response:', { bookingsData, bookingsError });
            
            if (bookingsData && !bookingsError) {
              const mappedBookings: CustomerBooking[] = bookingsData.map((booking: any) => ({
                id: booking.id,
                facilityId: booking.facility_id,
                facilityName: booking.facilities?.name || 'Unknown Facility',
                date: booking.booking_date,
                time: booking.start_time,
                endTime: booking.end_time,
                status: booking.status,
                price: booking.total_amount,
                isVacant: booking.status === 'completed',
                nextAvailable: booking.status === 'completed' ? new Date(booking.booking_date).toISOString() : undefined
              }));
              setRecentBookings(mappedBookings);
              
              // Calculate stats from actual bookings
              const totalBookings = mappedBookings.length;
              const activeBookings = mappedBookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;
              const completedBookings = mappedBookings.filter(b => b.status === 'completed').length;
              const totalSpent = mappedBookings
                .filter(b => b.status === 'confirmed' || b.status === 'completed')
                .reduce((sum, b) => sum + b.price, 0);
              
              setStats({
                totalBookings,
                activeBookings,
                completedBookings,
                totalSpent
              });
            }
          } catch (err) {
            console.error('Error loading bookings:', err);
            setRecentBookings([]);
          }
        }

        // Fetch all facilities to simulate nearby facilities and favorites
        const { data: facilitiesData, error } = await facilities.getAllWithStatus();
        
        // Clear timeout since we got a response
        clearTimeout(timeoutId);
        
        console.log('Facilities API response:', { facilitiesData, error });
        
        if (error) {
          console.error('Error fetching facilities:', error);
          // Set default data if API fails
          setNearbyFacilities([]);
          setFavoriteFacilities([]);
          setLoading(false);
          return;
        }

        // If no facilities data, set empty arrays to prevent crashes
        if (!facilitiesData || facilitiesData.length === 0) {
          console.log('No facilities data, setting empty arrays');
          setNearbyFacilities([]);
          setFavoriteFacilities([]);
          setLoading(false);
          return;
        }

        const allFacilities = facilitiesData || [];
        console.log('All facilities:', allFacilities);
        
        // Filter out banned facilities
        const activeFacilities = allFacilities.filter(f => f.status !== 'banned');
        console.log('Active facilities (after filtering banned):', activeFacilities);
        
        // Simulate nearby facilities (first 6 active facilities)
        const nearby = activeFacilities.slice(0, 6);
        console.log('Setting nearby facilities:', nearby);
        setNearbyFacilities(nearby);
        
        // Set favorite facilities based on real data (first 4 active facilities)
        const realFavorites = activeFacilities.slice(0, 4).map(f => ({
          id: f.id,
          name: f.name,
          type: f.facility_type || 'Unknown',
          city: f.city || 'Unknown',
          rating: 4.5, // Default rating since we don't have reviews yet
          image: undefined
        }));
        console.log('Setting favorite facilities:', realFavorites);
        setFavoriteFacilities(realFavorites);

        // For now, we'll show empty bookings since we don't have a bookings table yet
        // In a real app, you would fetch from a bookings table
        setRecentBookings([]);
        
        // Calculate stats based on real facilities data
        setStats({
          totalBookings: 0, // Will be updated when bookings table is available
          activeBookings: activeFacilities.filter(f => f.status === 'active').length,
          completedBookings: 0, // Will be updated when bookings table is available
          totalSpent: 0 // Will be updated when pricing and bookings are available
        });

      } catch (err) {
        console.error('Error loading customer data:', err);
        // Set loading to false even on error
        setLoading(false);
        setHasError(true);
        setErrorMessage(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        console.log('Setting customer dashboard loading to false');
        setLoading(false);
      }
    };
    
    if (user) {
      loadCustomerData();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Error boundary - show error message if something goes wrong
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-gray-600 mb-4">Something went wrong loading your dashboard</p>
          <p className="text-sm text-red-500 mb-4">{errorMessage}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <ClockIcon className="h-4 w-4" />;
      case 'cancelled': return <X className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      default: return <ClockIcon className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="h-6 w-6 text-red-600" />
          </div>
          <p className="text-gray-600">Please log in to view your dashboard</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Simple test component to debug white screen
  console.log('Rendering main component...');
  console.log('User data:', user);
  console.log('Nearby facilities:', nearbyFacilities);
  console.log('Loading state:', loading);
  console.log('Error state:', hasError);
  
  // Fallback component if no data is loaded
  if (!nearbyFacilities || nearbyFacilities.length === 0) {
    console.log('No facilities, showing fallback UI');
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8">
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.fullName || 'Customer'}!</h1>
              <p className="text-gray-600 mt-2">Here's what's happening with your sports activities</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Facilities Available</h2>
              <p className="text-gray-600 mb-4">It looks like there are no facilities in the system yet.</p>
              <p className="text-sm text-gray-500">This could be because:</p>
              <ul className="text-sm text-gray-500 mt-2 space-y-1">
                <li>• No facilities have been added yet</li>
                <li>• There's a database connection issue</li>
                <li>• The facilities table is empty</li>
              </ul>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 page-transition">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center justify-between">
              <div className="slide-in-left">
                <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.fullName || 'Customer'}!</h1>
                <p className="text-gray-600 mt-2">Here's what's happening with your sports activities</p>
              </div>
              <div className="flex space-x-3">
                <Link
                  to="/venues"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors hover-lift ripple"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Browse Venues
                </Link>
                <Link
                  to="/bookings/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors hover-lift ripple pulse-effect"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Booking
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover slide-in-up stagger-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Facilities</p>
                <p className="text-2xl font-bold text-gray-900">{nearbyFacilities.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover slide-in-up stagger-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Facilities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover slide-in-up stagger-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Now</p>
                <p className="text-2xl font-bold text-gray-900">{nearbyFacilities.filter(f => f.status === 'active').length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover slide-in-up stagger-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nearby Courts</p>
                <p className="text-2xl font-bold text-gray-900">{nearbyFacilities.length}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Recent Bookings</h2>
                <Link
                  to="/my-bookings"
                  className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
                >
                  View All
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
              
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Bookings</h3>
                <p className="text-gray-600 mb-4">You haven't made any bookings yet. Browse available facilities to get started!</p>
                <Link
                  to="/venues"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Browse Available Venues
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions & Favorites */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  to="/venues"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Search className="h-5 w-5 text-blue-600 mr-3" />
                  <span className="text-gray-700">Find New Venues</span>
                </Link>
                <Link
                  to="/my-bookings"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <BookOpen className="h-5 w-5 text-green-600 mr-3" />
                  <span className="text-gray-700">My Bookings</span>
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Users className="h-5 w-5 text-purple-600 mr-3" />
                  <span className="text-gray-700">Update Profile</span>
                </Link>
              </div>
            </div>

            {/* Favorite Facilities */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Favorite Facilities</h3>
                <Heart className="h-5 w-5 text-red-500" />
              </div>
              
              {favoriteFacilities.length === 0 ? (
                <div className="text-center py-4">
                  <Heart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No favorites yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favoriteFacilities.map((facility) => (
                    <div key={facility.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{facility.name}</h4>
                        <p className="text-xs text-gray-600">{facility.city} • {facility.type}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600">{facility.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* All Available Courts/Properties */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">All Available Courts & Properties</h2>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Available Now</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Booked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Maintenance</span>
                </div>
              </div>
              <Link
                to="/venues"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search facilities by name, type, or location..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="all">All Types</option>
                    <option value="basketball_court">Basketball Court</option>
                    <option value="tennis_court">Tennis Court</option>
                    <option value="volleyball_court">Volleyball Court</option>
                    <option value="gym">Gym</option>
                    <option value="swimming_pool">Swimming Pool</option>
                  </select>
                </div>
                <div>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="all">All Status</option>
                    <option value="available">Available Now</option>
                    <option value="booked">Booked</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyFacilities && nearbyFacilities.length > 0 ? nearbyFacilities.map((facility) => {
                // Use real facility status from database
                const isAvailable = facility.status === 'active';
                const isMaintenance = facility.status === 'maintenance';
                const isClosed = facility.status === 'closed';
                
                return (
                  <div key={facility.id} className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                    isAvailable ? 'border-green-200 bg-green-50' : 
                    isMaintenance ? 'border-yellow-200 bg-yellow-50' : 
                    'border-red-200 bg-red-50'
                  }`}>
                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center relative">
                      <MapPin className="h-12 w-12 text-gray-400" />
                      {/* Status indicator */}
                      <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                        isAvailable ? 'bg-green-500 text-white' : 
                        isMaintenance ? 'bg-yellow-500 text-white' : 
                        'bg-red-500 text-white'
                      }`}>
                        {isAvailable ? 'Available' : isMaintenance ? 'Maintenance' : 'Closed'}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{facility.name}</h3>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                        <span>{facility.city}, {facility.state}</span>
                        <span className="capitalize">{facility.facility_type?.replace('_', ' ')}</span>
                      </div>
                      
                      {/* Availability info */}
                      <div className="mb-3">
                        {isAvailable ? (
                          <div className="flex items-center space-x-2 text-green-700">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Available Now</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-yellow-700">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">Status: {facility.status}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-600">4.5</span>
                        </div>
                        <div className="flex space-x-2">
                          {isAvailable ? (
                            <Link
                              to={`/book-facility/${facility.id}`}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Book Now
                            </Link>
                          ) : (
                            <Link
                              to={`/venues/${facility.id}`}
                              className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              View Details
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="col-span-full text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No facilities available at the moment</p>
                  <p className="text-sm text-gray-500">Check back later for available courts and properties</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Nearby Facilities */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Nearby Facilities</h2>
              <Link
                to="/venues"
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center"
              >
                View All
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyFacilities && nearbyFacilities.length > 0 ? nearbyFacilities.map((facility) => (
                <div key={facility.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                    <MapPin className="h-12 w-12 text-gray-400" />
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{facility.name}</h3>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
                      <span>{facility.city}, {facility.state}</span>
                      <span className="capitalize">{facility.facility_type?.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">4.5</span>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          to={`/book-facility/${facility.id}`}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Book Now
                        </Link>
                        <Link
                          to={`/venues/${facility.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="col-span-full text-center py-12">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No nearby facilities found</p>
                  <p className="text-sm text-gray-500">Try expanding your search area</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
