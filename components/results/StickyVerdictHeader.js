"use client";
import React from 'react';
import { extractVerdictParts } from '@/lib/analysisUtils';

/**
 * StickyVerdictHeader component
 * 
 * A fixed header that stays at the top of the screen while scrolling.
 * Shows a condensed version of the verdict: query paraphrase, verdict badge, and 1-line rationale.
 * 
 * @param {Object} props
 * @param {string} props.query - The original query asked by the user
 * @param {string} props.summary - The verdict summary text
 */
export default function StickyVerdictHeader({ query, summary }) {
  const verdictParts = summary ? extractVerdictParts(summary) : null;
  
  // Extract verdict (Yes/No/Partially) from first sentence
  const getVerdictBadge = () => {
    if (!verdictParts?.firstSentence) return null;
    
    const firstSentence = verdictParts.firstSentence.toLowerCase();
    if (firstSentence.includes('yes')) return 'Yes';
    if (firstSentence.includes('no')) return 'No';
    return 'Partially';
  };

  const verdictBadge = getVerdictBadge();
  
  // Get badge color based on verdict (color-blind safe)
  const getBadgeClasses = () => {
    switch (verdictBadge) {
      case 'Yes':
        return 'bg-emerald-600 text-white'; // Green that works for most color vision deficiencies
      case 'No':
        return 'bg-blue-600 text-white'; // Blue instead of red for deuteranopia/protanopia
      case 'Partially':
        return 'bg-amber-500 text-black'; // Amber that's distinguishable from both green and blue
      default:
        return 'bg-secondary text-foreground';
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40 p-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center gap-4">
        <div className="flex-shrink-0 mr-3">
          <span className={`px-3 py-1 rounded-full font-medium text-sm ${getBadgeClasses()}`}>
            {verdictBadge || "Unknown"}
          </span>
        </div>
        
        <div className="flex-1 min-w-0 flex items-center">
          <p className="text-sm text-secondary-foreground mr-2 whitespace-nowrap">You asked:</p>
          <p className="text-sm font-medium truncate">{query || "No question recorded"}</p>
        </div>
        
        {verdictParts?.firstSentence && (
          <div className="flex-1 min-w-0 hidden md:block">
            <p className="text-sm font-medium truncate">{verdictParts.firstSentence}</p>
          </div>
        )}
      </div>
    </header>
  );
}