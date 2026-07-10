import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Copy } from 'lucide-react';

export interface SegmentJsonPreviewProps {
  /** JSON string to display (read-only) */
  jsonString: string;
  /** Placeholder when jsonString is empty */
  emptyPlaceholder?: string;
}

export function SegmentJsonPreview({
  jsonString,
  emptyPlaceholder = '// No conditions defined yet',
}: SegmentJsonPreviewProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <span>Unomi JSON Condition</span>
          </CardTitle>
          <Button
            onClick={handleCopy}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <pre className="bg-muted-dark text-success p-4 rounded-lg overflow-auto text-sm font-mono">
          {jsonString || emptyPlaceholder}
        </pre>
      </CardContent>
    </Card>
  );
}
