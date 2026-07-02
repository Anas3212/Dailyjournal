import { useState, useEffect, useMemo, useCallback } from 'react';

/**
 * Enhanced custom hook for advanced pagination functionality
 * @param {Array} data - The array of data to paginate
 * @param {number} initialItemsPerPage - Initial number of items per page
 * @param {Array} dependencies - Dependencies that should reset pagination to page 1
 * @param {Object} options - Additional options for pagination behavior
 * @returns {Object} Pagination state and handlers
 */
export const usePagination = (data = [], initialItemsPerPage = 12, dependencies = [], options = {}) => {
  const {
    persistPageSize = true,
    storageKey = 'pagination-settings',
    enableKeyboardNavigation = true,
    autoScrollToTop = true,
    loadingDelay = 300
  } = options;

  // Load persisted settings
  const getPersistedSettings = () => {
    if (!persistPageSize) return { itemsPerPage: initialItemsPerPage };
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : { itemsPerPage: initialItemsPerPage };
    } catch {
      return { itemsPerPage: initialItemsPerPage };
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(() => getPersistedSettings().itemsPerPage);
  const [isLoading, setIsLoading] = useState(false);
  const [jumpToPageValue, setJumpToPageValue] = useState('');

  // Calculate pagination values
  const paginationData = useMemo(() => {
    const totalItems = data.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);

    return {
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      paginatedData,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
      isFirstPage: currentPage === 1,
      isLastPage: currentPage === totalPages,
    };
  }, [data, currentPage, itemsPerPage]);

  // Reset to first page when dependencies change
  useEffect(() => {
    setCurrentPage(1);
  }, dependencies);

  // Persist settings to localStorage
  useEffect(() => {
    if (persistPageSize) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ itemsPerPage }));
      } catch (error) {
        console.warn('Failed to persist pagination settings:', error);
      }
    }
  }, [itemsPerPage, persistPageSize, storageKey]);

  // Reset to first page if current page exceeds total pages
  useEffect(() => {
    if (currentPage > paginationData.totalPages && paginationData.totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, paginationData.totalPages]);

  // Keyboard navigation
  useEffect(() => {
    if (!enableKeyboardNavigation) return;

    const handleKeyPress = (event) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextPage();
          break;
        case 'Home':
          event.preventDefault();
          goToFirstPage();
          break;
        case 'End':
          event.preventDefault();
          goToLastPage();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [enableKeyboardNavigation, paginationData.hasNextPage, paginationData.hasPreviousPage, paginationData.totalPages]);

  // Enhanced handlers with loading states
  const handlePageChange = useCallback((event, newPage) => {
    if (newPage === currentPage) return;
    
    setIsLoading(true);
    setCurrentPage(newPage);
    
    if (autoScrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    
    // Simulate loading delay for better UX
    setTimeout(() => setIsLoading(false), loadingDelay);
  }, [currentPage, autoScrollToTop, loadingDelay]);

  const handleItemsPerPageChange = useCallback((event) => {
    const newItemsPerPage = parseInt(event.target.value, 10);
    setIsLoading(true);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    
    setTimeout(() => setIsLoading(false), loadingDelay);
  }, [loadingDelay]);

  const goToFirstPage = useCallback(() => {
    if (currentPage !== 1) {
      handlePageChange(null, 1);
    }
  }, [currentPage, handlePageChange]);

  const goToLastPage = useCallback(() => {
    if (currentPage !== paginationData.totalPages) {
      handlePageChange(null, paginationData.totalPages);
    }
  }, [currentPage, paginationData.totalPages, handlePageChange]);

  const goToNextPage = useCallback(() => {
    if (paginationData.hasNextPage) {
      handlePageChange(null, currentPage + 1);
    }
  }, [paginationData.hasNextPage, currentPage, handlePageChange]);

  const goToPreviousPage = useCallback(() => {
    if (paginationData.hasPreviousPage) {
      handlePageChange(null, currentPage - 1);
    }
  }, [paginationData.hasPreviousPage, currentPage, handlePageChange]);

  // Jump to specific page
  const handleJumpToPage = useCallback((pageNumber) => {
    const page = parseInt(pageNumber, 10);
    if (page >= 1 && page <= paginationData.totalPages) {
      handlePageChange(null, page);
      setJumpToPageValue('');
      return true;
    }
    return false;
  }, [paginationData.totalPages, handlePageChange]);

  // Get page range for display
  const getPageRange = useCallback((delta = 2) => {
    const totalPages = paginationData.totalPages;
    const current = currentPage;
    const range = [];
    
    const rangeStart = Math.max(2, current - delta);
    const rangeEnd = Math.min(totalPages - 1, current + delta);
    
    if (rangeStart > 2) {
      range.push(1, '...');
    } else {
      range.push(1);
    }
    
    for (let i = rangeStart; i <= rangeEnd; i++) {
      range.push(i);
    }
    
    if (rangeEnd < totalPages - 1) {
      range.push('...', totalPages);
    } else if (totalPages > 1) {
      range.push(totalPages);
    }
    
    return range.filter((item, index, arr) => arr.indexOf(item) === index);
  }, [currentPage, paginationData.totalPages]);

  return {
    // State
    currentPage,
    itemsPerPage,
    isLoading,
    jumpToPageValue,
    
    // Computed values
    ...paginationData,
    
    // Handlers
    handlePageChange,
    handleItemsPerPageChange,
    goToFirstPage,
    goToLastPage,
    goToNextPage,
    goToPreviousPage,
    handleJumpToPage,
    
    // Utilities
    setCurrentPage,
    setItemsPerPage,
    setJumpToPageValue,
    getPageRange,
    
    // Statistics
    getStatistics: () => ({
      totalItems: paginationData.totalItems,
      totalPages: paginationData.totalPages,
      currentPage,
      itemsPerPage,
      startIndex: paginationData.startIndex,
      endIndex: paginationData.endIndex,
      itemsOnCurrentPage: paginationData.paginatedData.length,
      percentageComplete: paginationData.totalPages > 0 ? Math.round((currentPage / paginationData.totalPages) * 100) : 0
    })
  };
};

export default usePagination;
