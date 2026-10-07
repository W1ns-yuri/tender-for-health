import { useState, useEffect, useCallback, useMemo } from 'react';
import API from '../../services/api';

/**
 * Custom hook to manage state, data fetching and business calculations
 * for OfferDetailsPage.
 * 
 * @param {string} id - The ID of the offer.
 * @returns {object} Offer state, grouped lots, download helpers, and formatting utilities.
 */
export function useOfferDetailsState(id) {
  const [offer, setOffer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOffer = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const res = await API.get(`/offers/${id}`);
      setOffer(res.data);
    } catch (err) {
      console.error('Failed to fetch offer details:', err);
      setError(err?.response?.data?.message || 'Failed to load offer details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOffer();
  }, [fetchOffer]);

  const formatDate = useCallback((dateVal) => {
    if (!dateVal) return '-';
    try {
      const d = new Date(dateVal);
      return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('ru-RU');
    } catch {
      return '-';
    }
  }, []);

  const getFileDownloadUrl = useCallback((doc) => {
    if (!doc) return '#';
    const actualFileName = doc.filePath
      ? doc.filePath.split(/[\\/]/).pop()
      : (doc.fileName || doc.name);
    if (!actualFileName) return '#';
    return `/uploads/${encodeURIComponent(actualFileName)}`;
  }, []);

  const handleDownload = useCallback((doc) => {
    if (!doc) return;
    const fileUrl = getFileDownloadUrl(doc);
    if (fileUrl && fileUrl !== '#') {
      window.open(fileUrl, '_blank');
    }
  }, [getFileDownloadUrl]);

  // Computed data
  const currencyCode = offer?.baseCurrency?.code || 'TMT';
  const supplierName = offer?.supplier?.name || offer?.supplier?.user?.username || '-';
  const tenderNumber = offer?.tender?.tenderNumber || '-';
  const tenderTitle = offer?.tender?.title || '-';
  const rawSpecs = useMemo(() => offer?.specs || [], [offer?.specs]);

  const { lotGroups, unassignedSpecs } = useMemo(() => {
    const lotsMap = {};
    const unassigned = [];

    rawSpecs.forEach((spec) => {
      const lot = spec.tenderSpec?.lot;
      if (lot && lot.id) {
        if (!lotsMap[lot.id]) {
          lotsMap[lot.id] = {
            lot,
            specs: []
          };
        }
        lotsMap[lot.id].specs.push(spec);
      } else {
        unassigned.push(spec);
      }
    });

    return {
      lotGroups: Object.values(lotsMap),
      unassignedSpecs: unassigned
    };
  }, [rawSpecs]);

  return {
    offer,
    loading,
    error,
    currencyCode,
    supplierName,
    tenderNumber,
    tenderTitle,
    rawSpecs,
    lotGroups,
    unassignedSpecs,
    formatDate,
    handleDownload,
    getFileDownloadUrl,
    refetch: fetchOffer
  };
}
