import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Globe, 
  Eye, 
  Trash2, 
  RefreshCw, 
  Search,
  Plus,
  Settings
} from 'lucide-react';
import { 
  getAllScopes, 
  getScope,
  createScope,
  deleteScope,
  UnomiScope
} from '@/services/client/UnomiClientService';
import { useTranslation } from 'react-i18next';

const ScopeList: React.FC = () => {
  const [scopes, setScopes] = useState<UnomiScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedScope, setSelectedScope] = useState<UnomiScope | null>(null);
  const [expandedScopes, setExpandedScopes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newScopeId, setNewScopeId] = useState('');
  const [newScopeName, setNewScopeName] = useState('');
  const [newScopeDescription, setNewScopeDescription] = useState('');
  const [newScopeTags, setNewScopeTags] = useState<string[]>([]);
  const [newScopeTagInput, setNewScopeTagInput] = useState('');
  const [newScopeEnabled, setNewScopeEnabled] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t: _t } = useTranslation();

  const fetchScopes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const scopesData = await getAllScopes();
      console.log('Fetched scopes:', scopesData);
      setScopes(scopesData);
    } catch (err) {
      console.error('Error fetching scopes - full error:', err);
      let errorMessage = 'Failed to fetch scopes';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const axiosError = err as { response?: { data?: { error?: string; message?: string } }; message?: string };
        if (axiosError.response?.data?.error) {
          errorMessage = axiosError.response.data.error;
        } else if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScopeDetails = async (scopeId: string) => {
    try {
      const scopeDef = await getScope(scopeId);
      setSelectedScope(scopeDef);
    } catch (err) {
      console.error('Error fetching scope details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch scope details');
    }
  };

  const handleDeleteScope = async (scopeId: string) => {
    if (!confirm(`Are you sure you want to delete scope "${scopeId}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteScope(scopeId);
      await fetchScopes(); // Refresh the list
    } catch (err) {
      console.error('Error deleting scope:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete scope');
    }
  };

  const handleAddTag = () => {
    if (newScopeTagInput.trim() && !newScopeTags.includes(newScopeTagInput.trim())) {
      setNewScopeTags([...newScopeTags, newScopeTagInput.trim()]);
      setNewScopeTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setNewScopeTags(newScopeTags.filter(tag => tag !== tagToRemove));
  };

  const handleCreateScope = async () => {
    if (!newScopeId.trim()) {
      setError('Scope ID is required');
      return;
    }

    try {
      const metadata: {
        name?: string;
        description?: string;
        tags?: string[];
        enabled?: boolean;
      } = {};

      if (newScopeName.trim()) {
        metadata.name = newScopeName.trim();
      }
      if (newScopeDescription.trim()) {
        metadata.description = newScopeDescription.trim();
      }
      if (newScopeTags.length > 0) {
        metadata.tags = newScopeTags;
      }
      metadata.enabled = newScopeEnabled;

      await createScope({
        itemId: newScopeId.trim(),
        itemType: 'scope',
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined
      });
      
      // Reset form
      setNewScopeId('');
      setNewScopeName('');
      setNewScopeDescription('');
      setNewScopeTags([]);
      setNewScopeTagInput('');
      setNewScopeEnabled(true);
      setShowCreateDialog(false);
      await fetchScopes(); // Refresh the list
    } catch (err) {
      console.error('Error creating scope:', err);
      setError(err instanceof Error ? err.message : 'Failed to create scope');
    }
  };


  const toggleScopeExpansion = (scopeId: string) => {
    const newExpanded = new Set(expandedScopes);
    if (newExpanded.has(scopeId)) {
      newExpanded.delete(scopeId);
    } else {
      newExpanded.add(scopeId);
    }
    setExpandedScopes(newExpanded);
  };

  const filteredScopes = scopes.filter(scope => {
    const matchesSearch = scope.itemId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scope.scope?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scope.itemType?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  useEffect(() => {
    fetchScopes();
  }, [fetchScopes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading scopes...</span>
      </div>
    );
  }

  if (error && !scopes.length) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchScopes} className="mt-2">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Scopes</h1>
          <p className="text-muted-foreground">
            Manage Apache Unomi scopes for organizing and isolating data
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            onClick={() => {
              setNewScopeId('');
              setNewScopeName('');
              setNewScopeDescription('');
              setNewScopeTags([]);
              setNewScopeTagInput('');
              setNewScopeEnabled(true);
              setShowCreateDialog(true);
            }}
            className="bg-info hover:bg-info-dark"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Scope
          </Button>
          <Button onClick={fetchScopes} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <details className="mt-2">
              <summary className="cursor-pointer text-sm">Technical details</summary>
              <pre className="mt-2 text-xs overflow-auto">{JSON.stringify(error, null, 2)}</pre>
            </details>
          </AlertDescription>
        </Alert>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search scopes by ID, scope, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scopes List */}
      <div className="space-y-4">
        {filteredScopes.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No scopes found</p>
                {searchTerm && (
                  <p className="text-sm">Try adjusting your search criteria</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredScopes.map((scope) => (
            <Card key={scope.itemId} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleScopeExpansion(scope.itemId)}
                      className="p-1"
                    >
                      {expandedScopes.has(scope.itemId) ? (
                        <Settings className="h-4 w-4 rotate-90" />
                      ) : (
                        <Settings className="h-4 w-4" />
                      )}
                    </Button>
                    <div>
                      <CardTitle className="text-lg">
                        {scope.metadata?.name || scope.itemId}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant={scope.metadata?.enabled !== false ? "default" : "secondary"}>
                          {scope.metadata?.enabled !== false ? "Enabled" : "Disabled"}
                        </Badge>
                        <Badge variant="outline">
                          <Globe className="h-3 w-3 mr-1" />
                          {scope.scope || scope.itemId}
                        </Badge>
                        {scope.metadata?.tags && scope.metadata.tags.length > 0 && (
                          <Badge variant="outline">
                            {scope.metadata.tags.length} tag{scope.metadata.tags.length !== 1 ? 's' : ''}
                          </Badge>
                        )}
                        {scope.version !== undefined && (
                          <Badge variant="outline">
                            v{scope.version}
                          </Badge>
                        )}
                      </div>
                      {scope.metadata?.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {scope.metadata.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fetchScopeDetails(scope.itemId)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Scope Details: {scope.itemId}</DialogTitle>
                        </DialogHeader>
                        {selectedScope && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h3 className="font-semibold mb-2">Basic Information</h3>
                                <div className="space-y-2 text-sm">
                                  <div><strong>ID:</strong> {selectedScope.itemId}</div>
                                  <div><strong>Type:</strong> {selectedScope.itemType}</div>
                                  <div><strong>Scope:</strong> {selectedScope.scope || selectedScope.itemId}</div>
                                  {selectedScope.version !== undefined && (
                                    <div><strong>Version:</strong> {selectedScope.version}</div>
                                  )}
                                </div>
                              </div>
                              {selectedScope.metadata && (
                                <div>
                                  <h3 className="font-semibold mb-2">Metadata</h3>
                                  <div className="space-y-2 text-sm">
                                    {selectedScope.metadata.name && (
                                      <div><strong>Name:</strong> {selectedScope.metadata.name}</div>
                                    )}
                                    {selectedScope.metadata.description && (
                                      <div><strong>Description:</strong> {selectedScope.metadata.description}</div>
                                    )}
                                    <div><strong>Enabled:</strong> {selectedScope.metadata.enabled !== false ? 'Yes' : 'No'}</div>
                                    {selectedScope.metadata.tags && selectedScope.metadata.tags.length > 0 && (
                                      <div>
                                        <strong>Tags:</strong>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {selectedScope.metadata.tags.map((tag, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {selectedScope.metadata.systemTags && selectedScope.metadata.systemTags.length > 0 && (
                                      <div>
                                        <strong>System Tags:</strong>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {selectedScope.metadata.systemTags.map((tag, index) => (
                                            <Badge key={index} variant="outline" className="text-xs">
                                              {tag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold mb-2">Full JSON</h3>
                              <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                {JSON.stringify(selectedScope, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDeleteScope(scope.itemId)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedScopes.has(scope.itemId) && (
                <CardContent className="pt-0">
                  <div className="ml-8 space-y-2 text-sm">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span>ID: {scope.itemId}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span>Scope: {scope.scope || scope.itemId}</span>
                      </div>
                      {scope.version !== undefined && (
                        <div className="flex items-center space-x-1">
                          <span>Version: {scope.version}</span>
                        </div>
                      )}
                      {scope.metadata?.enabled !== undefined && (
                        <Badge variant={scope.metadata.enabled !== false ? "default" : "secondary"}>
                          {scope.metadata.enabled !== false ? "Enabled" : "Disabled"}
                        </Badge>
                      )}
                    </div>
                    {scope.metadata && (
                      <div className="space-y-1">
                        {scope.metadata.name && (
                          <div><strong>Name:</strong> {scope.metadata.name}</div>
                        )}
                        {scope.metadata.description && (
                          <div><strong>Description:</strong> {scope.metadata.description}</div>
                        )}
                        {scope.metadata.tags && scope.metadata.tags.length > 0 && (
                          <div>
                            <strong>Tags:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {scope.metadata.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Create Scope Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Scope</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="scopeId">Scope ID *</Label>
              <Input
                id="scopeId"
                value={newScopeId}
                onChange={(e) => setNewScopeId(e.target.value)}
                placeholder="e.g., web, mobile, systemscope"
                className="mt-1"
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                Unique identifier for the scope (alphanumeric, hyphens, underscores, dots, @)
              </p>
            </div>
            
            <div>
              <Label htmlFor="scopeName">Name</Label>
              <Input
                id="scopeName"
                value={newScopeName}
                onChange={(e) => setNewScopeName(e.target.value)}
                placeholder="Human-readable name for the scope"
                className="mt-1"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Display name for the scope (optional)
              </p>
            </div>

            <div>
              <Label htmlFor="scopeDescription">Description</Label>
              <Textarea
                id="scopeDescription"
                value={newScopeDescription}
                onChange={(e) => setNewScopeDescription(e.target.value)}
                placeholder="Describe the purpose of this scope"
                className="mt-1"
                rows={3}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Detailed description of what this scope is used for (optional)
              </p>
            </div>

            <div>
              <Label htmlFor="scopeTags">Tags</Label>
              <div className="flex space-x-2 mt-1">
                <Input
                  id="scopeTags"
                  value={newScopeTagInput}
                  onChange={(e) => setNewScopeTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!newScopeTagInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {newScopeTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newScopeTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                Tags for categorizing and organizing scopes (optional)
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="scopeEnabled"
                checked={newScopeEnabled}
                onCheckedChange={setNewScopeEnabled}
              />
              <Label htmlFor="scopeEnabled" className="cursor-pointer">
                Enabled
              </Label>
              <p className="text-sm text-muted-foreground ml-2">
                Whether this scope is active and available for use
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateScope}>
                Create Scope
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ScopeList;
