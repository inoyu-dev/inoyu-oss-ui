import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Activity, Users, TrendingUp, Globe } from 'lucide-react';
import { getProfileEvents } from '@/services/client/UnomiClientService';
import { chartColors, getChartColor } from '@/lib/chartColors';

// Types for our real-time data
interface RealtimeMetrics {
  totalProfiles: number;
  activeSessions: number;
  eventsLastHour: number;
  topEventTypes: Array<{ name: string; value: number; color: string }>;
  hourlyEvents: Array<{ hour: string; events: number; profiles: number }>;
  eventTypes: Array<{ type: string; count: number; percentage: number }>;
  geographicData: Array<{ country: string; users: number; events: number }>;
  deviceTypes: Array<{ device: string; count: number; percentage: number }>;
}

interface RealtimeDataProps {
  refreshInterval?: number; // in milliseconds
}

// Use design system chart colors
const COLORS = chartColors;

const RealtimeData: React.FC<RealtimeDataProps> = ({ refreshInterval = 30000 }) => {
  const [metrics, setMetrics] = useState<RealtimeMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchRealtimeData = async () => {
    try {
      setError(null);
      
      // Fetch profiles using the same approach as ProfileList
      const profilesResponse = await fetch('/api/cxs/profiles/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          condition: {
            type: 'matchAllCondition'
          },
          offset: 0,
          limit: 1000, // Get more profiles for better statistics
          sortby: 'systemProperties.lastUpdated:desc',
        }),
      });

      if (!profilesResponse.ok) {
        throw new Error(`HTTP error! status: ${profilesResponse.status}`);
      }
      const profilesData = await profilesResponse.json();
      const totalProfiles = profilesData.totalSize || profilesData.list?.length || 0;
      
      console.log('Profiles data:', { totalSize: profilesData.totalSize, listLength: profilesData.list?.length });

      // Fetch recent events for analysis
      const recentEvents = await getProfileEvents({
        type: 'matchAllCondition',
        parameterValues: {}
      }, 100);
      
      console.log('Recent events:', recentEvents.length, 'events found');

      // Calculate events from last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const eventsLastHour = recentEvents.filter(event => 
        new Date(event.timeStamp) > oneHourAgo
      ).length;

      // Calculate active sessions (profiles with events in last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const activeProfileIds = new Set(
        recentEvents
          .filter(event => new Date(event.timeStamp) > thirtyMinutesAgo)
          .map(event => event.properties?.profileId || event.itemId || event.source?.itemId)
          .filter(Boolean)
      );
      const activeSessions = activeProfileIds.size;

      // Process the data
      const eventTypeCounts: Record<string, number> = {};
      const hourlyData: Record<string, { events: number; profiles: Set<string> }> = {};
      const deviceCounts: Record<string, number> = {};
      const geoCounts: Record<string, { users: Set<string>; events: number }> = {};

      recentEvents.forEach(event => {
        // Count event types
        const eventType = event.eventType || 'unknown';
        eventTypeCounts[eventType] = (eventTypeCounts[eventType] || 0) + 1;

        // Group by hour
        const eventHour = new Date(event.timeStamp).getHours();
        const hourKey = `${eventHour}:00`;
        if (!hourlyData[hourKey]) {
          hourlyData[hourKey] = { events: 0, profiles: new Set() };
        }
        hourlyData[hourKey].events++;
        // Try different possible locations for profileId
        const profileId = event.properties?.profileId || event.itemId || event.source?.itemId;
        if (profileId) {
          hourlyData[hourKey].profiles.add(profileId as string);
        }

        // Count device types
        const deviceType = (typeof event.properties?.deviceType === 'string' 
          ? event.properties.deviceType 
          : 'unknown') as string;
        deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;

        // Count geographic data
        const country = (event.properties && typeof event.properties.country === 'string'
          ? event.properties.country
          : event.properties && typeof (event.properties.location as Record<string, unknown> | undefined)?.country === 'string'
          ? (event.properties.location as Record<string, unknown>).country
          : 'unknown') as string;
        if (!geoCounts[country]) {
          geoCounts[country] = { users: new Set(), events: 0 };
        }
        geoCounts[country].events++;
        if (profileId) {
          geoCounts[country].users.add(profileId as string);
        }
      });

      // Transform data for charts
      const topEventTypes = Object.entries(eventTypeCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length]
        }));

      const hourlyEvents = Object.entries(hourlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([hour, data]) => ({
          hour,
          events: data.events,
          profiles: data.profiles.size
        }));

      const eventTypes = Object.entries(eventTypeCounts)
        .map(([type, count]) => ({
          type,
          count,
          percentage: (count / recentEvents.length) * 100
        }))
        .sort((a, b) => b.count - a.count);

      const geographicData = Object.entries(geoCounts)
        .map(([country, data]) => ({
          country,
          users: data.users.size,
          events: data.events
        }))
        .sort((a, b) => b.users - a.users)
        .slice(0, 10);

      const deviceTypes = Object.entries(deviceCounts)
        .map(([device, count]) => ({
          device,
          count,
          percentage: (count / recentEvents.length) * 100
        }))
        .sort((a, b) => b.count - a.count);

      const realMetrics: RealtimeMetrics = {
        totalProfiles,
        activeSessions,
        eventsLastHour,
        topEventTypes,
        hourlyEvents,
        eventTypes,
        geographicData,
        deviceTypes
      };

      setMetrics(realMetrics);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError('Failed to fetch real-time data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRealtimeData();
    
    const interval = setInterval(fetchRealtimeData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading && !metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-info"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">
            <p>{error}</p>
            <button 
              onClick={fetchRealtimeData}
              className="mt-2 px-4 py-2 bg-info text-info-foreground rounded hover:bg-info-dark"
            >
              Retry
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-time Analytics
          </div>
          <Badge variant="outline" className="text-xs">
            Updated: {lastUpdated.toLocaleTimeString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-3 mb-4 flex-shrink-0">
          <div className="text-center p-3 bg-info-lighter rounded-lg">
            <Users className="h-4 w-4 mx-auto mb-1 text-info" />
            <div className="text-lg font-bold text-info">{metrics?.totalProfiles}</div>
            <div className="text-xs text-muted-foreground">Profiles</div>
          </div>
          <div className="text-center p-3 bg-success-lighter rounded-lg">
            <Activity className="h-4 w-4 mx-auto mb-1 text-success" />
            <div className="text-lg font-bold text-success">{metrics?.activeSessions}</div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          <div className="text-center p-3 bg-secondary-light rounded-lg">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-secondary" />
            <div className="text-lg font-bold text-secondary">{metrics?.eventsLastHour}</div>
            <div className="text-xs text-muted-foreground">Events (1h)</div>
          </div>
          <div className="text-center p-3 bg-warning-lighter rounded-lg">
            <Globe className="h-4 w-4 mx-auto mb-1 text-warning" />
            <div className="text-lg font-bold text-warning">{metrics?.geographicData.length}</div>
            <div className="text-xs text-muted-foreground">Countries</div>
          </div>
        </div>

        {/* Charts */}
        <Tabs defaultValue="events" className="w-full flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="geography">Geography</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="types">Event Types</TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="mt-4 flex-1 min-h-0">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics?.hourlyEvents}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="events" 
                    stackId="1" 
                    stroke={getChartColor(0)} 
                    fill={getChartColor(0)} 
                    name="Events"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profiles" 
                    stackId="2" 
                    stroke={getChartColor(1)} 
                    fill={getChartColor(1)} 
                    name="Active Profiles"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="geography" className="mt-4 flex-1 min-h-0">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.geographicData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="country" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="users" fill={getChartColor(0)} name="Users" />
                  <Bar dataKey="events" fill={getChartColor(1)} name="Events" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="devices" className="mt-4 flex-1 min-h-0">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics?.deviceTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ device, percentage }) => `${device} (${percentage.toFixed(1)}%)`}
                    outerRadius={80}
                    fill={getChartColor(0)}
                    dataKey="count"
                  >
                    {metrics?.deviceTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="types" className="mt-4 flex-1 min-h-0">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metrics?.eventTypes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke={getChartColor(0)} 
                    strokeWidth={2}
                    name="Event Count"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default RealtimeData;
