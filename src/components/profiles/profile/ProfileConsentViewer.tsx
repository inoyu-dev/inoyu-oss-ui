import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Shield, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface ConsentData {
  [consentType: string]: {
    status: 'granted' | 'denied' | 'pending' | 'withdrawn';
    lastUpdate: string;
    expiration?: string;
    purpose?: string;
    legalBasis?: string;
    [key: string]: unknown;
  };
}

interface ProfileConsentViewerProps {
  consent: ConsentData;
}

export function ProfileConsentViewer({ consent }: ProfileConsentViewerProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [expandedConsents, setExpandedConsents] = React.useState<string[]>([]);

  // Debug logging
  React.useEffect(() => {
    console.log('ProfileConsentViewer received consent:', consent);
    console.log('Consent type:', typeof consent);
    console.log('Consent keys:', consent ? Object.keys(consent) : 'No consent data');
  }, [consent]);

  const toggleConsent = (consentType: string) => {
    setExpandedConsents(prev => 
      prev.includes(consentType) 
        ? prev.filter(c => c !== consentType)
        : [...prev, consentType]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'granted':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'denied':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'withdrawn':
        return <AlertCircle className="h-4 w-4 text-warning" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      granted: 'default' as const,
      denied: 'destructive' as const,
      pending: 'secondary' as const,
      withdrawn: 'outline' as const,
    };
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const formatValue = (value: unknown): string => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return JSON.stringify(value, null, 2);
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  // Safety check for consent data
  if (!consent || typeof consent !== 'object') {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Consent Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>No consent data available for this profile.</p>
            <p className="text-sm mt-2">Consent data: {JSON.stringify(consent)}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const consentEntries = Object.entries(consent);
  const filteredConsents = consentEntries.filter(([consentType, consentData]) => {
    const searchLower = searchTerm.toLowerCase();
    return consentType.toLowerCase().includes(searchLower) ||
      consentData.status.toLowerCase().includes(searchLower) ||
      (consentData.purpose && consentData.purpose.toLowerCase().includes(searchLower)) ||
      (consentData.legalBasis && consentData.legalBasis.toLowerCase().includes(searchLower));
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Consent Management
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search consents..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          {filteredConsents.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>No consents found matching your search.</p>
              {consentEntries.length === 0 && (
                <p className="text-sm mt-2">No consent data available for this profile.</p>
              )}
            </div>
          ) : (
            filteredConsents.map(([consentType, consentData]) => (
              <div key={consentType} className="mb-4">
                <button
                  onClick={() => toggleConsent(consentType)}
                  className="flex items-center gap-3 w-full text-left p-3 hover:bg-accent rounded-md border"
                >
                  <span className="transform transition-transform duration-200">
                    {expandedConsents.includes(consentType) ? '▼' : '▶'}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(consentData.status)}
                      <h3 className="text-lg font-semibold capitalize">{consentType}</h3>
                      {getStatusBadge(consentData.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Last updated: {formatDate(consentData.lastUpdate)}
                    </p>
                  </div>
                </button>
                
                {expandedConsents.includes(consentType) && (
                  <div className="mt-2 pl-6">
                    <div className="space-y-3 p-4 bg-muted rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Status</label>
                          <div className="flex items-center gap-2 mt-1">
                            {getStatusIcon(consentData.status)}
                            <span className="capitalize">{consentData.status}</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Last Update</label>
                          <p className="text-sm mt-1">{formatDate(consentData.lastUpdate)}</p>
                        </div>
                        
                        {consentData.expiration && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Expiration</label>
                            <p className="text-sm mt-1">{formatDate(consentData.expiration)}</p>
                          </div>
                        )}
                        
                        {consentData.purpose && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                            <p className="text-sm mt-1">{consentData.purpose}</p>
                          </div>
                        )}
                        
                        {consentData.legalBasis && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Legal Basis</label>
                            <p className="text-sm mt-1">{consentData.legalBasis}</p>
                          </div>
                        )}
                      </div>
                      
                      {/* Additional properties */}
                      {Object.entries(consentData).some(([key, value]) => 
                        !['status', 'lastUpdate', 'expiration', 'purpose', 'legalBasis'].includes(key) && 
                        value !== undefined && value !== null
                      ) && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Additional Properties</label>
                          <div className="mt-2 space-y-2">
                            {Object.entries(consentData).map(([key, value]) => 
                              !['status', 'lastUpdate', 'expiration', 'purpose', 'legalBasis'].includes(key) && 
                              value !== undefined && value !== null && (
                                <div key={key} className="py-2 px-3 bg-background rounded-md">
                                  <div className="font-medium text-sm">{key}</div>
                                  <pre className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                                    {formatValue(value)}
                                  </pre>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
