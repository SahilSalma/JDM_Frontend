'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useVehicleData } from '@/hooks/useVehicleData';

interface UseVehicleSelectorReturn {
  makes: string[];
  models: string[];
  years: number[];
  selectedMake: string;
  selectedModel: string;
  selectedYear: number | null;
  setMake: (make: string) => void;
  setModel: (model: string) => void;
  setYear: (year: number | null) => void;
  resetSelection: () => void;
  isLoadingModels: boolean;
}

export function useVehicleSelector(): UseVehicleSelectorReturn {
  const { makes, yearRangeForMake } = useVehicleData();
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Fetch models when make changes
  useEffect(() => {
    if (!selectedMake) {
      setModels([]);
      setSelectedModel('');
      setYears([]);
      setSelectedYear(null);
      return;
    }

    let cancelled = false;
    setIsLoadingModels(true);
    setSelectedModel('');
    setYears([]);
    setSelectedYear(null);

    api
      .get<{ success: boolean; data: string[] }>(`/products/models/${selectedMake}`)
      .then((res) => {
        if (!cancelled) setModels(res.data ?? []);
      })
      .catch(() => {
        if (!cancelled) setModels([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingModels(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMake]);

  // Generate years from configured year range when make/model are selected
  useEffect(() => {
    if (!selectedMake || !selectedModel) {
      setYears([]);
      setSelectedYear(null);
      return;
    }

    const range = yearRangeForMake(selectedMake);
    const yearList: number[] = [];
    for (let y = range.min; y <= range.max; y++) {
      yearList.push(y);
    }
    yearList.reverse();
    setYears(yearList);
  }, [selectedMake, selectedModel, yearRangeForMake]);

  const setMake = useCallback((make: string) => {
    setSelectedMake(make);
  }, []);

  const setModel = useCallback((model: string) => {
    setSelectedModel(model);
  }, []);

  const setYear = useCallback((year: number | null) => {
    setSelectedYear(year);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedMake('');
    setSelectedModel('');
    setSelectedYear(null);
    setModels([]);
    setYears([]);
  }, []);

  return {
    makes,
    models,
    years,
    selectedMake,
    selectedModel,
    selectedYear,
    setMake,
    setModel,
    setYear,
    resetSelection,
    isLoadingModels,
  };
}
