import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
  showInfo?: boolean;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage = 10,
  showInfo = true,
  className = "",
}) => {
  // Generate page numbers to display
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 4) {
        // Show first few pages
        for (let i = 2; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        // Show last few pages
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show middle pages
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const getItemRange = () => {
    if (!totalItems) return null;
    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);
    return { start, end };
  };

  const itemRange = getItemRange();

  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}
    >
      {/* Info */}
      {showInfo && totalItems && itemRange && (
        <div className="text-sm text-gray-600">
          Hiển thị{" "}
          <span className="font-medium text-gray-900">{itemRange.start}</span>{" "}
          đến <span className="font-medium text-gray-900">{itemRange.end}</span>{" "}
          trong <span className="font-medium text-gray-900">{totalItems}</span>{" "}
          kết quả
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${
              currentPage === 1
                ? "text-gray-400 cursor-not-allowed bg-gray-50"
                : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 bg-white border border-gray-300 hover:border-blue-300"
            }
          `}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Trước</span>
        </button>

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page, index) => (
            <React.Fragment key={index}>
              {page === "..." ? (
                <div className="flex items-center justify-center w-10 h-10">
                  <MoreHorizontal className="w-4 h-4 text-gray-400" />
                </div>
              ) : (
                <button
                  onClick={() => handlePageClick(page as number)}
                  className={`
                    w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200
                    ${
                      currentPage === page
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                        : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 bg-white border border-gray-300 hover:border-blue-300"
                    }
                  `}
                >
                  {page}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Next Button */}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
            ${
              currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed bg-gray-50"
                : "text-gray-700 hover:text-blue-600 hover:bg-blue-50 bg-white border border-gray-300 hover:border-blue-300"
            }
          `}
        >
          <span className="hidden sm:inline">Sau</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
