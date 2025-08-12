import React, { useState, useEffect } from 'react';
import { Users, Building, AlertTriangle, DollarSign, TrendingUp, Calendar, Activity, CheckCircle } from 'lucide-react';
import { users as usersApi, facilities as facilitiesApi } from '../../lib/supabase';

export default function AdminDashboard() {
  const [stats, setStats] = useState([
    {
      title: 'Total Users',
      value: '0',
      change: '+0%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Facilities',
      value: '0',
      change: '+0%',
      changeType: 'increase', 
      icon: Building,
      color: 'bg-green-500'
    },
    {
      title: 'Pending Approvals',
      value: '0',
      change: '0%',
      changeType: 'neutral',
      icon: AlertTriangle,
      color: 'bg-yellow-500'
    },
    {
      title: 'Facility Owners',
      value: '0',
      change: '+0%',
      changeType: 'increase',
      icon: Users,
      color: 'bg-purple-500'
    }
  ]);

  const [loading, setLoading] = useState(true);

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        console.log('Starting to fetch dashboard data...');
        
        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log('Dashboard loading timeout reached, stopping loading state');
          setLoading(false);
        }, 10000); // 10 second timeout
        
        // Fetch users and facilities
        const [usersResponse, facilitiesResponse] = await Promise.all([
          usersApi.getAll(),
          facilitiesApi.getAll()
        ]);
        
        // Clear timeout since we got a response
        clearTimeout(timeoutId);
        
        console.log('Dashboard API responses received:', { usersResponse, facilitiesResponse });
        
        if (usersResponse.error) {
          console.error('Error fetching users:', usersResponse.error);
        }
        
        if (facilitiesResponse.error) {
          console.error('Error fetching facilities:', facilitiesResponse.error);
        }
        
        // Use fallback data if API calls fail
        let users = usersResponse.data || [];
        let facilities = facilitiesResponse.data || [];
        
        // If both API calls failed, set default stats and stop loading
        if (usersResponse.error && facilitiesResponse.error) {
          console.log('Both dashboard API calls failed, setting default stats');
          setStats([
            {
              title: 'Total Users',
              value: '0',
              change: '+0%',
              changeType: 'increase',
              icon: Users,
              color: 'bg-blue-500'
            },
            {
              title: 'Total Facilities',
              value: '0',
              change: '+0%',
              changeType: 'increase', 
              icon: Building,
              color: 'bg-green-500'
            },
            {
              title: 'Pending Approvals',
              value: '0',
              change: '0%',
              changeType: 'neutral',
              icon: AlertTriangle,
              color: 'bg-yellow-500'
            },
            {
              title: 'Facility Owners',
              value: '0',
              change: '+0%',
              changeType: 'increase',
              icon: Users,
              color: 'bg-purple-500'
            }
          ]);
          setLoading(false);
          return;
        }
        
        console.log('Dashboard data extracted:', { users, facilities });
        
        // Calculate real stats
        const totalUsers = users.length;
        const totalFacilities = facilities.length;
        const facilityOwners = users.filter(u => u.role === 'facility_owner').length;
        const pendingFacilities = facilities.filter(f => f.status === 'pending').length;
        
        console.log('Dashboard stats calculated:', { totalUsers, totalFacilities, facilityOwners, pendingFacilities });
        
        setStats([
          {
            title: 'Total Users',
            value: totalUsers.toString(),
            change: '+0%',
            changeType: 'increase',
            icon: Users,
            color: 'bg-blue-500'
          },
          {
            title: 'Total Facilities',
            value: totalFacilities.toString(),
            change: '+0%',
            changeType: 'increase', 
            icon: Building,
            color: 'bg-green-500'
          },
          {
            title: 'Pending Approvals',
            value: pendingFacilities.toString(),
            change: '0%',
            changeType: 'neutral',
            icon: AlertTriangle,
            color: 'bg-yellow-500'
          },
          {
            title: 'Facility Owners',
            value: facilityOwners.toString(),
            change: '+0%',
            changeType: 'increase',
            icon: Users,
            color: 'bg-purple-500'
          }
        ]);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        // Set loading to false even on error
        setLoading(false);
      } finally {
        console.log('Setting dashboard loading to false');
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const [recentActivity, setRecentActivity] = useState([
    {
      id: 1,
      action: 'No recent activity',
      details: 'Data will appear here',
      time: 'Just now',
      type: 'info'
    }
  ]);

  // Update recent activity with real data
  useEffect(() => {
    const updateRecentActivity = () => {
      const now = new Date();
      const activities = [];
      
      // Add recent user registrations
      if (stats[0].value !== '0') {
        activities.push({
          id: 1,
          action: 'Users registered',
          details: `${stats[0].value} total users`,
          time: 'Just now',
          type: 'user'
        });
      }
      
      // Add recent facility additions
      if (stats[1].value !== '0') {
        activities.push({
          id: 2,
          action: 'Facilities added',
          details: `${stats[1].value} total facilities`,
          time: 'Just now',
          type: 'approval'
        });
      }
      
      // Add pending approvals info
      if (stats[2].value !== '0') {
        activities.push({
          id: 3,
          action: 'Pending approvals',
          details: `${stats[2].value} facilities need review`,
          time: 'Just now',
          type: 'moderation'
        });
      }
      
      if (activities.length > 0) {
        setRecentActivity(activities);
      }
    };
    
    if (!loading) {
      updateRecentActivity();
    }
  }, [stats, loading]);

  const [systemHealth, setSystemHealth] = useState([
    { service: 'Web Application', status: 'operational', uptime: '100%' },
    { service: 'Database', status: 'operational', uptime: '100%' },
    { service: 'API Services', status: 'operational', uptime: '100%' },
    { service: 'Authentication', status: 'operational', uptime: '100%' }
  ]);

  // Update system health based on data fetching status
  useEffect(() => {
    if (loading) {
      setSystemHealth([
        { service: 'Web Application', status: 'operational', uptime: '100%' },
        { service: 'Database', status: 'operational', uptime: '100%' },
        { service: 'API Services', status: 'operational', uptime: '100%' },
        { service: 'Authentication', status: 'operational', uptime: '100%' }
      ]);
    } else {
      setSystemHealth([
        { service: 'Web Application', status: 'operational', uptime: '100%' },
        { service: 'Database', status: 'operational', uptime: '100%' },
        { service: 'API Services', status: 'operational', uptime: '100%' },
        { service: 'Data Fetching', status: 'operational', uptime: '100%' }
      ]);
    }
  }, [loading]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'down': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Platform overview and system monitoring</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 page-transition">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 slide-in-left">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2 slide-in-left stagger-1">Platform overview and system monitoring</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 card-hover slide-in-up stagger-${index + 1}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className={`text-sm mt-1 ${
                    stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stat.change} from last month
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.color}`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        activity.type === 'approval' ? 'bg-green-500' :
                        activity.type === 'moderation' ? 'bg-red-500' :
                        activity.type === 'system' ? 'bg-blue-500' : 'bg-purple-500'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                      <p className="text-sm text-gray-500">{activity.details}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">System Health</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {systemHealth.map((system) => (
                  <div key={system.service} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{system.service}</p>
                      <p className="text-xs text-gray-500">Uptime: {system.uptime}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(system.status)}`}>
                      {system.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 mt-6 card-hover slide-in-right">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 hover-lift ripple">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-sm font-medium">Approve Facilities</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 hover-lift ripple">
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">Manage Users</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 hover-lift ripple">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="text-sm font-medium">Review Reports</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}