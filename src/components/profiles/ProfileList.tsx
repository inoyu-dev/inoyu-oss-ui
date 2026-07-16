import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useTranslation } from 'next-i18next/pages'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface Profile {
  itemId: string;
  properties: {
    firstName: string;
    lastName: string;
    email: string;
    engagementScore?: number;
    lastActivityDate?: string;
    lifetimeValue?: number;
    [key: string]: string | number | undefined;
  };
  systemProperties: {
    lastUpdated: string;  // or Date, depending on your data type
  };
  segments: string[];
}

interface ProfileResponse {
  list: Profile[];
  totalSize: number;
  offset: number;
  pageSize: number;
}

interface Condition {
  field: string;
  operator: string;
  value: string;
}

const operators = ["equals", "contains", "startsWith", "endsWith", "greaterThan", "lessThan"];

export const ProfileList: React.FC = () => {
  const { t } = useTranslation('common')
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchConditions, setSearchConditions] = useState<Condition[]>([])
  const [availableFields, setAvailableFields] = useState<string[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/cxs/profiles/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({       // Match all profiles
            condition: {
              type: 'matchAllCondition'
            },
            // Pagination
            offset: 0,
            limit: 50,
            // Sort by last visit date
            // sortby: 'properties.lastVisit:desc',
            sortby: 'systemProperties.lastUpdated:desc',
       }),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: ProfileResponse = await response.json();
        setProfiles(data.list);
        
        // Extract all unique fields from profiles
        const fields = new Set<string>();
        data.list.forEach(profile => {
          Object.keys(profile.properties).forEach(key => fields.add(key));
        });
        setAvailableFields(Array.from(fields));

        setLoading(false);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        setError(t('Failed to fetch profiles'));
        setLoading(false);
      }
    };

    fetchProfiles();
  }, []);

  const handleSearch = () => {
    // Implement the search logic here
    // This should ideally be a backend call with the searchConditions
    const filteredProfiles = profiles.filter(profile => {
      return searchConditions.every(condition => {
        const value = profile.properties[condition.field];
        switch (condition.operator) {
          case "equals":
            return value === condition.value;
          case "contains":
            return String(value).includes(condition.value);
          case "startsWith":
            return String(value).startsWith(condition.value);
          case "endsWith":
            return String(value).endsWith(condition.value);
          case "greaterThan":
            return Number(value) > Number(condition.value);
          case "lessThan":
            return Number(value) < Number(condition.value);
          default:
            return true;
        }
      });
    });
    setProfiles(filteredProfiles);
  };

  const addCondition = () => {
    setSearchConditions([...searchConditions, { field: "", operator: "equals", value: "" }]);
  };

  const updateCondition = (index: number, field: keyof Condition, value: string) => {
    const newConditions = [...searchConditions];
    newConditions[index][field] = value;
    setSearchConditions(newConditions);
  };

  const removeCondition = (index: number) => {
    const newConditions = searchConditions.filter((_, i) => i !== index);
    setSearchConditions(newConditions);
  };

  const navigateToProfile = (itemId: string) => {
    router.push(`/profiles/${itemId}`);
  };

  if (loading) return <div>{t('Loading profiles...')}</div>
  if (error) return <div>{t('Error')}: {error}</div>

  return (
    <Card className="w-full" data-testid="profiles-list">
      <CardHeader>
        <CardTitle>{t('Profiles')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" data-testid="search-profiles-button">{t('Search Profiles')}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('Search Profiles')}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {searchConditions.map((condition, index) => (
                  <div key={index} className="grid grid-cols-4 items-center gap-4">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className="w-[200px] justify-between"
                        >
                          {condition.field || t("Select field")}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] p-0">
                        <Command>
                          <CommandInput placeholder={t("Search field...")} />
                          <CommandEmpty>{t('No field found.')}</CommandEmpty>
                          <CommandGroup>
                            {availableFields.map((field) => (
                              <CommandItem
                                key={field}
                                onSelect={() => updateCondition(index, "field", field)}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    condition.field === field ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {field}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <Select onValueChange={(value) => updateCondition(index, "operator", value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder={t('Operator')} />
                      </SelectTrigger>
                      <SelectContent>
                        {operators.map(op => (
                          <SelectItem key={op} value={op}>{op}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={t('Value')}
                      value={condition.value}
                      onChange={(e) => updateCondition(index, "value", e.target.value)}
                    />
                    <Button onClick={() => removeCondition(index)} variant="destructive">{t('Remove')}</Button>
                  </div>
                ))}
                <Button onClick={addCondition}>{t('Add Condition')}</Button>
              </div>
              <Button onClick={handleSearch}>{t('Search')}</Button>
            </DialogContent>
          </Dialog>
        </div>
        {profiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground" data-testid="profiles-empty-state">
            <p>{t('No profiles found')}</p>
          </div>
        ) : (
          <Table data-testid="profiles-table">
            <TableHeader>
              <TableRow>
                <TableHead>{t('Name')}</TableHead>
                <TableHead>{t('Email')}</TableHead>
                <TableHead>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">
                        {t('Engagement Score')} <Info className="inline-block w-4 h-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('Engagement score tooltip')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead>{t('Last Updated')}</TableHead>
                <TableHead>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger className="cursor-help">
                        {t('LTV')} <Info className="inline-block w-4 h-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('Lifetime Value in USD')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableHead>
                <TableHead>{t('Segments')}</TableHead>
                <TableHead>{t('Action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map(profile => (
                <TableRow key={profile.itemId} data-testid={`profile-item-${profile.itemId}`}>
                  <TableCell>{`${profile.properties.firstName} ${profile.properties.lastName}`}</TableCell>
                  <TableCell>{profile.properties.email}</TableCell>
                  <TableCell>
                    {profile.properties.engagementScore !== undefined ? (
                      <span className={`font-bold ${getEngagementScoreColor(profile.properties.engagementScore)}`}>
                        {profile.properties.engagementScore}
                      </span>
                    ) : 'N/A'}
                  </TableCell>
                  <TableCell>{profile.systemProperties.lastUpdated || 'N/A'}</TableCell>
                  <TableCell>
                    {profile.properties.lifetimeValue !== undefined ? 
                      `$${profile.properties.lifetimeValue.toFixed(2)}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {profile.segments.slice(0, 2).map((segment, index) => (
                        <Badge key={index} variant="secondary">{segment}</Badge>
                      ))}
                      {profile.segments.length > 2 && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="secondary">+{profile.segments.length - 2}</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{profile.segments.slice(2).join(', ')}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => navigateToProfile(profile.itemId)} data-testid={`view-profile-${profile.itemId}`}>{t('View Profile')}</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

function getEngagementScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-destructive';
}

export default ProfileList;