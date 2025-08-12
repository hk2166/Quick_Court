import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Star, 
  Clock, 
  Wifi, 
  Car, 
  Coffee, 
  Shield, 
  Users, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { mockFacilities, mockCourts } from '../../data/mockData';

export default function VenueDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const venue = mockFacilities.find(v => v.id === id);
  const venueCourts = mockCourts.filter(c => c.facilityId === id);

  if (!venue) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Venue not found</h2>
        <Link to="/venues" className="text-blue-600 hover:text-blue-700">
          ← Back to venues
        </Link>
      </div>
    );
  }

  const amenityIcons: { [key: string]: React.ReactNode } = {
    'Parking': <Car className="h-5 w-5" />,
    'Wi-Fi': <Wifi className="h-5 w-5" />,
    'Cafeteria': <Coffee className="h-5 w-5" />,
    'Air Conditioning': <Shield className="h-5 w-5" />,
    'Locker Rooms': <Users className="h-5 w-5" />,
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === venue.photos.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? venue.photos.length - 1 : prev - 1
    );
  };

  const handleBookNow = (courtId?: string) => {
    if (courtId) {
      navigate(`/book/${venue.id}/${courtId}`);
    } else if (venueCourts.length > 0) {
      navigate(`/book/${venue.id}/${venueCourts[0].id}`);
    }
  };

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link 
          to="/venues"
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors hover-lift"
        >
          <ChevronLeft className="h-5 w-5 mr-1" />
          Back to venues
        </Link>
      </div>

      {/* Image Gallery */}
      <div className="relative h-96 md:h-[500px] rounded-2xl overflow-hidden hover-lift">
        <img
          src={venue.photos[currentImageIndex]}
          alt={`${venue.name} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover fade-in"
          key={currentImageIndex}
        />
        
        {/* Image Navigation */}
        {venue.photos.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors ripple"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors ripple"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            
            {/* Dots indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {venue.photos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </>
        )}
        
        {/* Rating overlay */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center">
          <Star className="h-5 w-5 text-yellow-400 fill-current" />
          <span className="font-semibold ml-1">{venue.rating}</span>
          <span className="text-gray-600 ml-1">({venue.reviewCount})</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{venue.name}</h1>
            
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center text-gray-600">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{venue.address}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Clock className="h-5 w-5 mr-2" />
                <span>Open daily</span>
              </div>
            </div>

            {/* Sports Available */}
            <div className="flex flex-wrap gap-2 mb-6">
              {venue.sports.map((sport) => (
                <span
                  key={sport}
                  className="px-3 py-1 bg-blue-100 text-blue-700 font-medium rounded-lg"
                >
                  {sport}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Venue</h2>
            <p className="text-gray-600 leading-relaxed">{venue.description}</p>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {venue.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-blue-600 mr-3">
                    {amenityIcons[amenity] || <Shield className="h-5 w-5" />}
                  </div>
                  <span className="text-gray-900 font-medium">{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Available Courts */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Available Courts</h2>
            <div className="space-y-4">
              {venueCourts.map((court) => (
                <div key={court.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{court.name}</h3>
                      <p className="text-gray-600">{court.sportType}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">${court.pricePerHour}</div>
                      <div className="text-gray-600 text-sm">per hour</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Operating Hours: {court.operatingHours.start} - {court.operatingHours.end}
                    </div>
                    <button
                      onClick={() => handleBookNow(court.id)}
                      className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Book This Court
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-8">
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-gray-900 mb-2">
                ${venue.priceRange.min} - ${venue.priceRange.max}
              </div>
              <div className="text-gray-600">per hour</div>
            </div>
            
            <button
              onClick={() => handleBookNow()}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-lg hover:bg-blue-700 transition-colors mb-4 flex items-center justify-center"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Book Now
              <ArrowRight className="h-5 w-5 ml-2" />
            </button>
            
            <div className="text-center text-sm text-gray-500">
              Free cancellation up to 2 hours before
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Venue Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Courts Available</span>
                <span className="font-semibold">{venueCourts.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sports Offered</span>
                <span className="font-semibold">{venue.sports.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rating</span>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="font-semibold">{venue.rating}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Reviews</span>
                <span className="font-semibold">{venue.reviewCount}</span>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-600">Address:</span>
                <p className="font-medium">{venue.address}</p>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <p className="font-medium">+1 (555) 123-4567</p>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <p className="font-medium">info@{venue.name.toLowerCase().replace(/\s+/g, '')}.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}