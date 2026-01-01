'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, Users, CheckCircle, Clock, Plus, Activity } from 'lucide-react';

// Types
interface Notification {
  id: number;
  tenant_id: number;
  event_type: string;
  message: string;
  status: string;
  created_at: string;
}

interface Tenant {
  id: number;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

interface DashboardData {
  tenant: Tenant;
  notifications: Notification[];
  total_notifications: number;
  pending_notifications: number;
  delivered_notifications: number;
}

export default function Dashboard() {
  const [tenantId, setTenantId] = useState<string>('1');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showRegisterForm, setShowRegisterForm] = useState<boolean>(false);
  const [newTenant, setNewTenant] = useState({ name: '', email: '', phone: '' });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Fetch dashboard data
  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/v1/28hub/${tenantId}/dashboard`);
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Register new tenant
  const registerTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/api/v1/28hub/register`, newTenant);
      setTenantId(response.data.id.toString());
      setShowRegisterForm(false);
      setNewTenant({ name: '', email: '', phone: '' });
      fetchDashboard();
    } catch (error) {
      console.error('Error registering tenant:', error);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [tenantId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">28hub-connect</h1>
            </div>
            <button
              onClick={() => setShowRegisterForm(!showRegisterForm)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>New Tenant</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Register Tenant Form */}
        {showRegisterForm && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Register New Tenant</h2>
            <form onSubmit={registerTenant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={newTenant.name}
                  onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newTenant.email}
                  onChange={(e) => setNewTenant({ ...newTenant, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={newTenant.phone}
                  onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegisterForm(false)}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : dashboardData ? (
          <>
            {/* Tenant Selector */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-8">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Tenant</label>
              <input
                type="number"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardData.total_notifications}</p>
                  </div>
                  <Activity className="h-12 w-12 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{dashboardData.pending_notifications}</p>
                  </div>
                  <Clock className="h-12 w-12 text-yellow-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Delivered</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{dashboardData.delivered_notifications}</p>
                  </div>
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tenant ID</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardData.tenant.id}</p>
                  </div>
                  <Users className="h-12 w-12 text-purple-600" />
                </div>
              </div>
            </div>

            {/* Tenant Info */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tenant Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Name</p>
                  <p className="text-lg text-gray-900">{dashboardData.tenant.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Email</p>
                  <p className="text-lg text-gray-900">{dashboardData.tenant.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Phone</p>
                  <p className="text-lg text-gray-900">{dashboardData.tenant.phone}</p>
                </div>
              </div>
            </div>

            {/* Notifications List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Recent Notifications</h2>
                <button
                  onClick={fetchDashboard}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Refresh
                </button>
              </div>

              {dashboardData.notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {notification.event_type}
                            </span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                notification.status === 'delivered'
                                  ? 'bg-green-100 text-green-800'
                                  : notification.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {notification.status}
                            </span>
                          </div>
                          <p className="text-gray-900">{notification.message}</p>
                          <p className="text-sm text-gray-500 mt-2">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p>No data available. Please register a tenant or select a valid tenant ID.</p>
          </div>
        )}
      </main>
    </div>
  );
}
