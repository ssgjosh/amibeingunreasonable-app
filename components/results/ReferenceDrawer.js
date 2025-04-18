"use client";
import React, { useState, useEffect, memo } from 'react';

/**
 * ReferenceDrawer component
 * 
 * Displays reference information in accordion sections:
 * - Original context
 * - Follow-up Q&A history
 * - Sources (external references if available)
 * 
 * @param {Object} props
 * @param {string} props.context - The original context/situation
 * @param {Array} props.snippets - Array of source snippets (if any)
 * @param {Array} props.followUpResponses - Array of follow-up Q&A pairs
 */
const ReferenceDrawer = memo(function ReferenceDrawer({
  context,
  snippets = [],
  initialClarifications = [], // Add new prop for initial clarifying Q&A
  followUpResponses = [] // This prop now holds the interactive persona chat history
}) {
  const [openAccordion, setOpenAccordion] = useState(null); // All sections closed by default
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // Initial check
    checkIsMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Auto-open follow-up history if there are responses
  useEffect(() => {
    if (followUpResponses && followUpResponses.length > 0) {
      setOpenAccordion('followup');
    }
  }, [followUpResponses]);

  // Mobile drawer toggle
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  // Toggle accordion
  const toggleAccordion = (section) => {
    setOpenAccordion(openAccordion === section ? null : section);
  };

  // Process bold text markers (e.g., **bold text**)
  const processBoldText = (text) => {
    // Check if text is a string before trying to split it
    if (!text || typeof text !== 'string') {
      return text || null;
    }
    
    return text.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
  };

  // Render drawer content
  const DrawerContent = () => (
    <div className="bg-secondary/40 backdrop-blur-lg shadow-xl rounded-xl border border-white/10 overflow-hidden h-full">
      <h2 className="text-lg font-semibold p-4 border-b border-border/40 text-white">Reference Information</h2>
      
      {/* Original Context Accordion */}
      <div className="border-b border-border/40">
        <button 
          className="flex justify-between items-center w-full p-4 cursor-pointer hover:bg-secondary/60 text-left"
          onClick={() => toggleAccordion('context')}
          aria-expanded={openAccordion === 'context'}
        >
          <h3 className="font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Original Context
          </h3>
          <span className={`transform transition-transform duration-200 ${openAccordion === 'context' ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {openAccordion === 'context' && (
          <div className="p-4 animate-fadeIn space-y-3">
            {/* Display Original Context */}
            {context ? (
              <p className="text-sm whitespace-pre-wrap">{context}</p>
            ) : (
              <p className="text-sm text-secondary-foreground italic">No original context available.</p>
            )}

            {/* Display Initial Clarifying Q&A if available */}
            {initialClarifications && initialClarifications.length > 0 && (
              <div className="pt-3 mt-3 border-t border-border/40">
                <h4 className="text-sm font-semibold mb-2 text-secondary-foreground">Clarifying Questions:</h4>
                <div className="space-y-3">
                  {initialClarifications.map((item, index) => (
                    <div key={`clarification-${index}`}>
                      <p className="font-medium text-sm">Q: {item.question}</p>
                      <p className="text-sm mt-1 ml-2">{item.answer || <span className="italic text-secondary-foreground/70">No answer provided</span>}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Follow-up Q&A History Accordion */}
      <div className="border-b border-border/40">
        <button 
          className="flex justify-between items-center w-full p-4 cursor-pointer hover:bg-secondary/60 text-left"
          onClick={() => toggleAccordion('followup')}
          aria-expanded={openAccordion === 'followup'}
        >
          <h3 className="font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Interactive Chat History {/* Rename section title */}
            {followUpResponses && followUpResponses.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                {Math.ceil(followUpResponses.length / 2)} {/* Count pairs */}
              </span>
            )}
          </h3>
          <span className={`transform transition-transform duration-200 ${openAccordion === 'followup' ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {openAccordion === 'followup' && (
          <div className="p-4 space-y-3 animate-fadeIn">
            {followUpResponses && followUpResponses.length > 0 ? (
              followUpResponses.map((item, index) => (
                <div key={index} className="border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <p className="font-medium text-sm">Q: {item.question}</p>
                  <div className="mt-1">
                    <p className="text-xs text-primary mb-1">
                      {item.persona || "Expert"}:
                    </p>
                    <div className="text-sm">{processBoldText(item.answer)}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-secondary-foreground italic">No interactive chat history yet.</p>
            )}
          </div>
        )}
      </div>
      
      {/* Sources Dropdown */}
      <div className="border-b border-border/40">
        <button 
          className="flex justify-between items-center w-full p-4 cursor-pointer hover:bg-secondary/60 text-left"
          onClick={() => toggleAccordion('sources')}
          aria-expanded={openAccordion === 'sources'}
        >
          <h3 className="font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Sources
            {snippets && snippets.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                {snippets.length}
              </span>
            )}
          </h3>
          <span className={`transform transition-transform duration-200 ${openAccordion === 'sources' ? 'rotate-180' : ''}`}>▼</span>
        </button>
        {openAccordion === 'sources' && (
          <div className="p-4 animate-fadeIn">
            {snippets && snippets.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {snippets.map((snippet, index) => (
                  <div 
                    key={index} 
                    id={`snippet-${index}`} 
                    className="p-3 border border-border/40 rounded-md transition-colors duration-200"
                  >
                    <p className="text-sm">
                      {snippet.text || "No text available"}
                    </p>
                    {snippet.url && (
                      <a 
                        href={snippet.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline mt-2 inline-flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        Source Link
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-secondary-foreground">
                <p className="mb-2">External sources would appear here when the AI uses information from websites, articles, or other references to support its analysis.</p>
                <p>For this analysis, no external sources were used.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Mobile bottom sheet
  if (isMobile) {
    return (
      <>
        <button 
          onClick={toggleDrawer}
          className="fixed bottom-16 right-4 z-30 p-3 bg-primary text-white rounded-full shadow-lg"
          aria-label="Toggle reference drawer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        
        {isDrawerOpen && (
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm backdrop-enter" onClick={toggleDrawer}>
            <div 
              className="absolute bottom-0 left-0 right-0 max-h-[80vh] bg-background rounded-t-xl overflow-hidden bottom-sheet-enter"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center p-2 border-b border-border/40">
                <div className="w-10 h-1 bg-secondary-foreground/30 rounded-full"></div>
              </div>
              <div className="overflow-y-auto max-h-[calc(80vh-2rem)]">
                <DrawerContent />
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Desktop drawer
  return <DrawerContent />;
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent re-renders when typing in follow-up box
  return (
    prevProps.context === nextProps.context &&
    JSON.stringify(prevProps.snippets) === JSON.stringify(nextProps.snippets) &&
    JSON.stringify(prevProps.initialClarifications) === JSON.stringify(nextProps.initialClarifications) && // Add comparison for new prop
    JSON.stringify(prevProps.followUpResponses) === JSON.stringify(nextProps.followUpResponses)
  );
});

// Add display name for debugging
ReferenceDrawer.displayName = 'ReferenceDrawer';

export default ReferenceDrawer;