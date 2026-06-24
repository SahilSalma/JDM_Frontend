'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save, Loader2, GripVertical, AlertCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useSiteSettings } from '@/components/providers/SiteSettingsProvider';

interface Make {
  id: string;
  name: string;
  year_range_min: number;
  year_range_max: number;
  sort_order: number;
}

interface Model {
  id: string;
  name: string;
  make_id: string;
}

export default function VehicleSettingsPage() {
  const router = useRouter();
  const { refreshSettings } = useSiteSettings();
  const [makes, setMakes] = useState<Make[]>([]);
  const [modelsByMake, setModelsByMake] = useState<Record<string, Model[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newMakeName, setNewMakeName] = useState('');
  const [newModelNames, setNewModelNames] = useState<Record<string, string>>({});

  const loadData = useCallback(async () => {
    try {
      const [makesRes, modelsRes] = await Promise.all([
        adminApi.get<{ success: boolean; data: Make[] }>('/admin/makes'),
        adminApi.get<{ success: boolean; data: Model[] }>('/admin/models'),
      ]);
      const makesData = makesRes.data || [];
      const modelsData = modelsRes.data || [];

      setMakes(makesData);
      const grouped: Record<string, Model[]> = {};
      for (const m of modelsData) {
        if (!grouped[m.make_id]) grouped[m.make_id] = [];
        grouped[m.make_id].push(m);
      }
      setModelsByMake(grouped);
    } catch {
      toast.error('Failed to load vehicle data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addMake = async () => {
    const trimmed = newMakeName.trim();
    if (!trimmed) return;
    if (makes.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning('This make already exists');
      return;
    }
    try {
      const res = await adminApi.post<{ success: boolean; data: Make }>('/admin/makes', { name: trimmed });
      if (res.data) {
        setMakes((prev) => [res.data, ...prev]);
        toast.success(`Make "${trimmed}" added`);
      }
      setNewMakeName('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add make');
    }
  };

  const removeMake = async (id: string, name: string) => {
    try {
      await adminApi.delete(`/admin/makes/${id}`);
      setMakes((prev) => prev.filter((m) => m.id !== id));
      setModelsByMake((prev) => { const next = { ...prev }; delete next[id]; return next; });
      toast.success(`Make "${name}" deleted`);
    } catch (err: any) {
      toast.error(err?.message || `Cannot delete "${name}"`);
    }
  };

  const updateMake = async (id: string, field: string, value: any) => {
    setMakes((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
    try {
      await adminApi.patch(`/admin/makes/${id}`, { [field]: value });
    } catch {
      toast.error('Failed to update make');
      loadData();
    }
  };

  const addModel = async (makeId: string) => {
    const trimmed = (newModelNames[makeId] || '').trim();
    if (!trimmed) return;
    try {
      const res = await adminApi.post<{ success: boolean; data: Model }>('/admin/models', { name: trimmed, make_id: makeId });
      if (res.data) {
        setModelsByMake((prev) => ({
          ...prev,
          [makeId]: [...(prev[makeId] || []), res.data],
        }));
        toast.success(`Model "${trimmed}" added`);
      }
      setNewModelNames((prev) => ({ ...prev, [makeId]: '' }));
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add model');
    }
  };

  const removeModel = async (id: string, name: string) => {
    try {
      await adminApi.delete(`/admin/models/${id}`);
      setModelsByMake((prev) => {
        const next = { ...prev };
        for (const makeId of Object.keys(next)) {
          next[makeId] = next[makeId].filter((m) => m.id !== id);
        }
        return next;
      });
      toast.success(`Model "${name}" deleted`);
    } catch (err: any) {
      toast.error(err?.message || `Cannot delete model "${name}"`);
    }
  };

  const moveMake = async (index: number, direction: 'up' | 'down') => {
    const next = [...makes];
    if (direction === 'up' && index > 0) {
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
    } else if (direction === 'down' && index < next.length - 1) {
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
    } else {
      return;
    }
    setMakes(next);
    // Persist new sort orders
    for (let i = 0; i < next.length; i++) {
      const m = next[i];
      if (m.sort_order !== i) {
        m.sort_order = i;
        try {
          await adminApi.patch(`/admin/makes/${m.id}`, { sort_order: i });
        } catch {
          // ignore error on sort
        }
      }
    }
  };

  const inputClass = 'bg-muted border-border text-foreground placeholder:text-muted-foreground/60 text-sm h-9';
  const labelClass = 'text-xs text-muted-foreground font-semibold';

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#DC2626]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => router.push('/admin/settings')}
          className="border-border text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-3xl font-extrabold text-foreground tracking-tight">
            Vehicle Data
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure the makes, models, and year ranges. Makes with existing products cannot be deleted.
          </p>
        </div>
      </div>

      {/* Add new make */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold text-foreground">Add Make</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-end gap-3">
            <div className="flex-1 space-y-1">
              <Label className={labelClass}>Make Name</Label>
              <Input
                value={newMakeName}
                onChange={(e) => setNewMakeName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addMake(); }}
                placeholder="e.g. Honda, Toyota, Nissan"
                className={inputClass}
              />
            </div>
            <Button
              onClick={addMake}
              variant="outline"
              className="border-border text-foreground hover:bg-muted h-9"
            >
              <Plus className="mr-1.5 size-4" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Makes list */}
      <div className="space-y-4">
        {makes.length === 0 && (
          <Card className="bg-card border-border shadow-md">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No makes configured yet. Add your first make above.</p>
            </CardContent>
          </Card>
        )}
        {makes.map((make, makeIndex) => (
          <Card key={make.id} className="bg-card border-border shadow-md">
            <CardHeader className="border-b border-border/40 pb-4">
              <div className="flex items-center gap-3">
                <GripVertical className="size-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <Input
                    value={make.name}
                    onChange={(e) => updateMake(make.id, 'name', e.target.value)}
                    className="font-heading text-lg font-bold bg-transparent border-border text-foreground h-9"
                    placeholder="Make name"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveMake(makeIndex, 'up')}
                    disabled={makeIndex === 0}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Move up"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => moveMake(makeIndex, 'down')}
                    disabled={makeIndex === makes.length - 1}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Move down"
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeMake(make.id, make.name)}
                    className="text-[#DC2626] hover:text-[#ef4444] hover:bg-[#DC2626]/10"
                    aria-label="Remove make"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {/* Year range */}
              <div className="flex items-end gap-3">
                <div className="space-y-1">
                  <Label className={labelClass}>Min Year</Label>
                  <Input
                    type="number"
                    value={make.year_range_min}
                    onChange={(e) => updateMake(make.id, 'year_range_min', parseInt(e.target.value, 10) || 1980)}
                    className={`${inputClass} w-24`}
                    min={1900}
                    max={2030}
                  />
                </div>
                <div className="space-y-1">
                  <Label className={labelClass}>Max Year</Label>
                  <Input
                    type="number"
                    value={make.year_range_max}
                    onChange={(e) => updateMake(make.id, 'year_range_max', parseInt(e.target.value, 10) || 2025)}
                    className={`${inputClass} w-24`}
                    min={1900}
                    max={2030}
                  />
                </div>
              </div>

              <Separator className="bg-border/40" />

              {/* Models */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className={labelClass}>Models</Label>
                </div>
                {(modelsByMake[make.id] || []).length === 0 && (
                  <p className="text-xs text-muted-foreground mb-2">No models configured.</p>
                )}
                <div className="space-y-2 mb-3">
                  {(modelsByMake[make.id] || []).map((model) => (
                    <div key={model.id} className="flex items-center gap-2">
                      <span className="text-sm flex-1 px-3 py-1.5 bg-muted border border-border rounded-md">
                        {model.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeModel(model.id, model.name)}
                        className="text-muted-foreground hover:text-[#DC2626] shrink-0"
                        aria-label="Remove model"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    value={newModelNames[make.id] || ''}
                    onChange={(e) => setNewModelNames((prev) => ({ ...prev, [make.id]: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') addModel(make.id); }}
                    placeholder="e.g. Civic, Accord"
                    className={`${inputClass} flex-1`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addModel(make.id)}
                    className="text-xs text-[#DC2626] hover:text-[#ef4444] hover:bg-[#DC2626]/10 h-8"
                  >
                    <Plus className="mr-1 size-3" />
                    Add
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
