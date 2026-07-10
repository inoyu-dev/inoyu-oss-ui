import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download } from 'lucide-react';
import type { PropertyType } from '@/services/client/UnomiClientService';

interface PropertyTypeDetailDialogProps {
  propertyType: PropertyType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCopy: (propertyType: PropertyType) => void;
  onDownload: (propertyType: PropertyType) => void;
}

const PropertyTypeDetailDialog: React.FC<PropertyTypeDetailDialogProps> = ({
  propertyType,
  open,
  onOpenChange,
  onCopy,
  onDownload,
}) => {
  if (!propertyType) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{propertyType.metadata?.name || propertyType.metadata?.id}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="ranges">Ranges</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>ID:</strong> {propertyType.metadata.id}
                  </div>
                  <div>
                    <strong>Name:</strong> {propertyType.metadata.name}
                  </div>
                  {propertyType.metadata.description && (
                    <div>
                      <strong>Description:</strong> {propertyType.metadata.description}
                    </div>
                  )}
                  {propertyType.metadata.scope && (
                    <div>
                      <strong>Scope:</strong> {propertyType.metadata.scope}
                    </div>
                  )}
                  <div>
                    <strong>Enabled:</strong> {propertyType.metadata.enabled ? 'Yes' : 'No'}
                  </div>
                  {propertyType.metadata.hidden && (
                    <div>
                      <strong>Hidden:</strong> Yes
                    </div>
                  )}
                  {propertyType.metadata.readOnly && (
                    <div>
                      <strong>Read Only:</strong> Yes
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Property Type</h3>
                <div className="space-y-2 text-sm">
                  {propertyType.target && (
                    <div>
                      <strong>Target:</strong> {propertyType.target}
                    </div>
                  )}
                  {propertyType.type && (
                    <div>
                      <strong>Type:</strong> {propertyType.type}
                    </div>
                  )}
                  {propertyType.defaultValue !== undefined && (
                    <div>
                      <strong>Default Value:</strong> {String(propertyType.defaultValue)}
                    </div>
                  )}
                  <div>
                    <strong>Multi-valued:</strong> {propertyType.multivalued ? 'Yes' : 'No'}
                  </div>
                  <div>
                    <strong>Protected:</strong>{' '}
                    {propertyType.protected || propertyType.protekted ? 'Yes' : 'No'}
                  </div>
                  {propertyType.rank !== undefined && (
                    <div>
                      <strong>Rank:</strong> {propertyType.rank}
                    </div>
                  )}
                  {propertyType.mergeStrategy && (
                    <div>
                      <strong>Merge Strategy:</strong> {propertyType.mergeStrategy}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {propertyType.metadata.tags && propertyType.metadata.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {propertyType.metadata.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {propertyType.metadata.systemTags && propertyType.metadata.systemTags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">System Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {propertyType.metadata.systemTags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="json" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">Property Type JSON</h3>
              <div className="flex items-center space-x-2">
                <Button size="sm" variant="outline" onClick={() => onCopy(propertyType)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDownload(propertyType)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
              {JSON.stringify(propertyType, null, 2)}
            </pre>
          </TabsContent>

          <TabsContent value="ranges" className="space-y-4">
            {propertyType.numericRanges && propertyType.numericRanges.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Numeric Ranges</h3>
                <div className="space-y-2">
                  {propertyType.numericRanges.map((range, index) => (
                    <div key={index} className="bg-muted p-3 rounded-md text-sm">
                      <div>
                        <strong>Key:</strong> {range.key}
                      </div>
                      {range.from !== undefined && (
                        <div>
                          <strong>From:</strong> {range.from}
                        </div>
                      )}
                      {range.to !== undefined && (
                        <div>
                          <strong>To:</strong> {range.to}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {propertyType.dateRanges && propertyType.dateRanges.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Date Ranges</h3>
                <div className="space-y-2">
                  {propertyType.dateRanges.map((range, index) => (
                    <div key={index} className="bg-muted p-3 rounded-md text-sm">
                      <div>
                        <strong>Key:</strong> {range.key}
                      </div>
                      {range.from && (
                        <div>
                          <strong>From:</strong> {range.from}
                        </div>
                      )}
                      {range.to && (
                        <div>
                          <strong>To:</strong> {range.to}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {propertyType.ipRanges && propertyType.ipRanges.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">IP Ranges</h3>
                <div className="space-y-2">
                  {propertyType.ipRanges.map((range, index) => (
                    <div key={index} className="bg-muted p-3 rounded-md text-sm">
                      <div>
                        <strong>Key:</strong> {range.key}
                      </div>
                      {range.from && (
                        <div>
                          <strong>From:</strong> {range.from}
                        </div>
                      )}
                      {range.to && (
                        <div>
                          <strong>To:</strong> {range.to}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(!propertyType.numericRanges || propertyType.numericRanges.length === 0) &&
              (!propertyType.dateRanges || propertyType.dateRanges.length === 0) &&
              (!propertyType.ipRanges || propertyType.ipRanges.length === 0) && (
                <p className="text-sm text-muted-foreground">No ranges defined</p>
              )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyTypeDetailDialog;
