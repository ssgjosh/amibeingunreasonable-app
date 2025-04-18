"use client";
import React from 'react';
import Link from 'next/link';

/**
 * FooterActionBar component
 * 
 * A sticky footer with action buttons for sharing results and generating a new analysis.
 * 
 * @param {Object} props
 * @param {Function} props.handleShareClick - Function to handle share button click
 * @param {string} props.shareStatus - Status message for share action
 */
export default function FooterActionBar({ 
  handleShareClick, 
  shareStatus
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border/40 p-3 z-40">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex-1 flex justify-center space-x-4">
          {/* Share Button */}
          <button
            onClick={handleShareClick}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-md shadow-sm hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
            Share
            {shareStatus && <span className="ml-2 text-xs">{shareStatus}</span>}
          </button>
          
          {/* Generate Another Analysis Button */}
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent rounded-md shadow-sm hover:bg-accent/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Analyse Another
          </Link>
        </div>
      </div>
    </div>
  );
}