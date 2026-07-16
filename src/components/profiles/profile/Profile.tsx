import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { LineChart, Line, PieChart, Pie, Scatter, ScatterChart, XAxis, YAxis, ZAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Map, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { getUnomiProfile, UnomiEvent, queryAggregate, deleteProfile } from '@/services/client/UnomiClientService';
import { EventList } from '@/components/events/EventList';
import { AggregationQueryBuilder } from '@/services/shared/AggregationQueryBuilder';
import { ConditionTarget } from '@/services/shared/types';
import { ProfilePropertiesViewer } from './ProfilePropertiesViewer';
import { getChartColor } from '@/lib/chartColors';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useRouter } from 'next/router';
// Define types for our data structures
interface TimelineData {
  date: string;
  events: number;
  interactions: number;
}

interface SegmentData {
  name: string;
  value: number;
}

interface ChannelData {
  channel: string;
  interactions: number;
}

interface UnomiProfile {
  itemId: string;
  properties: {
    firstName: string;
    lastName: string;
    email: string;
    city?: string;
    firstVisit?: string;
    engagementScore?: number;
    lastActivityDate?: string;
    lifetimeValue?: number;
    [key: string]: unknown;
  };
  segments: string[];
  consent?: {
    [consentType: string]: {
      status: 'granted' | 'denied' | 'pending' | 'withdrawn';
      lastUpdate: string;
      expiration?: string;
      purpose?: string;
      legalBasis?: string;
      [key: string]: unknown;
    };
  };
}

// Mock data generators
const generateTimelineData = (): TimelineData[] => [...Array(10)].map((_, i) => ({
  date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
  events: Math.floor(Math.random() * 10) + 1,
  interactions: Math.floor(Math.random() * 20) + 5,
}));

const generateSegmentData = (): SegmentData[] => [
  { name: 'High Value', value: 400 },
  { name: 'Medium Value', value: 300 },
  { name: 'Low Value', value: 200 },
  { name: 'At Risk', value: 100 },
];

const generateChannelData = (): ChannelData[] => [...Array(5)].map((_, i) => ({
  channel: ['Email', 'Social', 'Web', 'Mobile', 'In-store'][i],
  interactions: Math.floor(Math.random() * 1000) + 100,
}));

interface UnomiProfileDashboardProps {
  profileId: string;
}

const UnomiProfileDashboard: React.FC<UnomiProfileDashboardProps> = ({ profileId }) => {
  const { t } = useTranslation('common');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UnomiProfile | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [segmentData, setSegmentData] = useState<SegmentData[]>([]);
  const [channelData, setChannelData] = useState<ChannelData[]>([]);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();

  // Profile fetch effect
  useEffect(() => {
    if (!profileId) {
      return;
    }

    async function fetchProfile() {
      try {
        setLoading(true);
        const profileData = await getUnomiProfile(profileId);

        if (!profileData) {
          setError(t('Profile not found'));
          return;
        }
        
        // Add mock consent data for testing if not present
        if (!profileData.consent) {
          profileData.consent = {
            analytics: {
              status: 'granted',
              lastUpdate: new Date().toISOString(),
              purpose: 'Website analytics and performance monitoring',
              legalBasis: 'Legitimate interest'
            },
            marketing: {
              status: 'granted',
              lastUpdate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              expiration: new Date(Date.now() + 365 * 86400000).toISOString(), // 1 year from now
              purpose: 'Email marketing and promotional communications',
              legalBasis: 'Consent'
            },
            cookies: {
              status: 'granted',
              lastUpdate: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
              purpose: 'Essential and functional cookies',
              legalBasis: 'Legitimate interest'
            }
          };
        }
        
        setProfile(profileData);
        setError(null);

        // Only set the visualization data after we have the profile
        setTimelineData(generateTimelineData());
        setSegmentData(generateSegmentData());
        setChannelData(generateChannelData());
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        setError(err instanceof Error ? err.message : t('Failed to load profile'));
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    }

    fetchProfile();
  }, [profileId]);

  // Add new effect for timeline data
  useEffect(() => {
    if (!profileId) return;

    async function fetchTimelineData() {

      // Example 1: Date histogram of sessions by newcomers
      const sessionsByNewcomers = new AggregationQueryBuilder('date', ConditionTarget.SESSION, 'timeStamp')
        .withDateHistogram('1d', 'yyyy-MM-dd')
        .withAndCondition([
          {
            type: 'sessionPropertyCondition',
            parameterValues: {
              propertyName: 'scope',
              comparisonOperator: 'equals',
              propertyValue: 'acme'
            }
          },
          {
            type: 'sessionPropertyCondition',
            parameterValues: {
              propertyName: 'profile.properties.nbOfVisits',
              comparisonOperator: 'equals',
              propertyValueInteger: 1
            }
          }
        ])
        .build();

      // Example 2: Profile birth date ranges
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const profilesByAge = new AggregationQueryBuilder('date', ConditionTarget.PROFILE, 'properties.birthDate')
        .withDateRanges([
          {
            key: 'After 2009',
            from: 'now-10y/y',
            to: undefined
          },
          {
            key: 'Between 1999 and 2009',
            from: 'now-20y/y',
            to: 'now-10y/y'
          }
        ])
        .build();

      // Example 3: Profile visits numeric ranges
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const profilesByVisits = new AggregationQueryBuilder('numeric', ConditionTarget.PROFILE, 'properties.nbOfVisits')
        .withNumericRanges([
          {
            key: 'Less than 5',
            from: undefined,
            to: 5
          },
          {
            key: 'Between 5 and 10',
            from: 5,
            to: 10
          }
        ])
        .build();

      // Using with the queryAggregate function
      const result = await queryAggregate(sessionsByNewcomers);
      delete result._all;
      delete result._filtered
      console.log('sessionByNewcomers aggregation result: ', result);

      try {
        // Fetch events count
        const eventsData = await queryAggregate(
          new AggregationQueryBuilder('date', ConditionTarget.EVENT, 'timeStamp')
            .withDateHistogram('1d', 'yyyy-MM-dd')
            .withAndCondition([{
              type: 'eventPropertyCondition',
              parameterValues: {
                propertyName: 'profileId',
                comparisonOperator: 'equals',
                propertyValue: profileId
              }
            }])
            .build()
        );

        delete eventsData._all;
        delete eventsData._filtered;

        // Fetch sessions count
        const sessionsData = await queryAggregate(
          new AggregationQueryBuilder('date', ConditionTarget.SESSION, 'timeStamp')
            .withDateHistogram('1d', 'yyyy-MM-dd')
            .withAndCondition([{
              type: 'sessionPropertyCondition',
              parameterValues: {
                propertyName: 'profileId',
                comparisonOperator: 'equals',
                propertyValue: profileId
              }
            }])
            .build()
        );

        delete sessionsData._all;
        delete sessionsData._filtered;

        // Combine the data
        const combinedData = Object.entries(eventsData).map(([key, value]) => ({
          date: key,
          events: value,
          interactions: sessionsData[key] || 0
        }));

        setTimelineData(combinedData);
      } catch (err) {
        console.error('Error fetching timeline data:', err);
      }
    }

    fetchTimelineData();
  }, [profileId]);

  console.log('Current state:', { loading, error, profile });

  if (loading) {
    console.log('Rendering loading state');
    return (
      <div className="p-4">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-destructive">
              <h2 className="text-lg font-semibold mb-2">{t('Error')}</h2>
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show not found state
  if (!profile) {
    console.log('Rendering not found state');
    return (
      <div className="p-4">
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">{t('Profile Not Found')}</h2>
              <p>{t('Could not find profile with ID', { id: profileId })}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('Rendering full dashboard with profile:', profile);

  const profileInfo = {
    name: `${profile.properties.firstName} ${profile.properties.lastName}`,
    location: profile.properties.city || t('Unknown'),
    customerSince: profile.properties.firstVisit
      ? new Date(profile.properties.firstVisit).toLocaleDateString()
      : t('Unknown')
  };

  const handleDeleteProfile = async () => {
    try {
      await deleteProfile(profileId); // Call the delete function
      // Optionally, redirect or update the UI after deletion
      router.push('/profiles'); // Adjust the path as necessary
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  return (
    <div className="p-4 space-y-4" data-testid="profile-detail">
      <h1 className="text-2xl font-bold mb-4">{t('Profile Dashboard')}</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{t('Profile Overview')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <User size={24} />
              <span>{profileInfo.name}</span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Map size={24} />
              <span>{profileInfo.location}</span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Calendar size={24} />
              <span>{t('Customer since')}: {profileInfo.customerSince}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Engagement Score')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center">87</div>
            <p className="text-center text-success">{t('High Engagement')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Lifetime Value')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-center">$3,250</div>
            <p className="text-center text-info">{t('Top 10% of customers')}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">{t('Timeline')}</TabsTrigger>
          <TabsTrigger value="segments">{t('Segments')}</TabsTrigger>
          <TabsTrigger value="channels">{t('Channel Performance')}</TabsTrigger>
          <TabsTrigger value="properties">{t('Properties')}</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>{t('Interaction Timeline')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="events" stroke={getChartColor(0)} name="Events" />
                  <Line yAxisId="right" type="monotone" dataKey="interactions" stroke={getChartColor(1)} name="Interactions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="segments">
          <Card>
            <CardHeader>
              <CardTitle>{t('Customer Segmentation')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie dataKey="value" data={segmentData} fill={getChartColor(0)} label />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="channels">
          <Card>
            <CardHeader>
              <CardTitle>{t('Channel Performance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <XAxis dataKey="channel" name="Channel" />
                  <YAxis dataKey="interactions" name="Interactions" />
                  <ZAxis range={[100, 1000]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter name="Channel Performance" data={channelData} fill={getChartColor(0)} />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="properties">
          <ProfilePropertiesViewer properties={profile.properties} />
        </TabsContent>
      </Tabs>

      <EventList
        condition={{
          type: 'eventPropertyCondition',
          parameterValues: {
            propertyName: 'profileId',
            comparisonOperator: 'equals',
            propertyValue: profileId
          }
        }}
        limit={5}
        defaultRefreshInterval={30000}
        onEventsLoaded={(events: UnomiEvent[]) => {
          console.log('Events loaded:', events);
        }}
      />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive">{t('Delete Profile')}</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Confirm Deletion')}</DialogTitle>
          </DialogHeader>
          <p>{t('Are you sure you want to delete this profile?')}</p>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>{t('Cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteProfile}>{t('Delete')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnomiProfileDashboard;
