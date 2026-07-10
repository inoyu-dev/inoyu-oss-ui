import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Moon, Sun, Monitor, Palette, Settings as SettingsIcon } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';

const SettingsPage: React.FC = () => {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <ProtectedRoute>
      <Layout>
        <div className="max-w-4xl mx-auto py-6 space-y-6" data-testid="settings-page">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-8 w-8" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Customize your application preferences
          </p>
        </div>

        {/* Appearance Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>
              Choose your preferred color scheme and theme
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme Selection */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Theme</Label>
              <RadioGroup value={theme} onValueChange={(value) => setTheme(value as 'light' | 'dark' | 'system')} data-testid="theme-selector">
                <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex-1 flex items-center gap-3 cursor-pointer">
                    <Sun className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Light</div>
                      <div className="text-sm text-muted-foreground">Use light theme</div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex-1 flex items-center gap-3 cursor-pointer">
                    <Moon className="h-5 w-5" />
                    <div>
                      <div className="font-medium">Dark</div>
                      <div className="text-sm text-muted-foreground">Use dark theme</div>
                    </div>
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex-1 flex items-center gap-3 cursor-pointer">
                    <Monitor className="h-5 w-5" />
                    <div>
                      <div className="font-medium">System</div>
                      <div className="text-sm text-muted-foreground">
                        Match your device theme
                        {theme === 'system' && (
                          <span className="ml-2 text-xs">(Currently: {resolvedTheme})</span>
                        )}
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* Current Theme Preview */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Preview</Label>
              <div className="p-4 rounded-lg border bg-card">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Theme:</span>
                    <span className="font-medium capitalize">{resolvedTheme}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Theme Preference:</span>
                    <span className="font-medium capitalize">{theme}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings Section */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>
              Additional application preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">Notifications</Label>
                <div className="text-sm text-muted-foreground">
                  Enable browser notifications
                </div>
              </div>
              <Switch id="notifications" />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="animations">Animations</Label>
                <div className="text-sm text-muted-foreground">
                  Enable smooth animations and transitions
                </div>
              </div>
              <Switch id="animations" defaultChecked />
            </div>
          </CardContent>
        </Card>
        </div>
      </Layout>
    </ProtectedRoute>
  );
};

export default SettingsPage;
