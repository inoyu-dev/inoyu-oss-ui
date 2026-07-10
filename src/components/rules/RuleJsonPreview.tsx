/**
 * RuleJsonPreview — Read-only JSON preview of the generated rule with Copy button.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Copy } from 'lucide-react';

export interface RuleJsonPreviewProps {
  /** JSON string to display (e.g. generated rule) */
  jsonString: string;
  /** Optional placeholder when empty */
  emptyPlaceholder?: string;
}

export function RuleJsonPreview({
  jsonString,
  emptyPlaceholder = '// No rule defined yet',
}: RuleJsonPreviewProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString || emptyPlaceholder);
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <span>Unomi JSON Rule</span>
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
