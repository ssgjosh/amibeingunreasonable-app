"use client";
import { useRef, useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';

// Import CSS for animations
import '../../../components/results/animations.css';

// Import Shared Hooks
import { useSharedResults } from '../../../hooks/useSharedResults';
import { useFollowUpChat } from '../../../hooks/useFollowUpChat';

// Import Shared UI Components
import LoadingSpinner from '../../../components/ui/LoadingSpinner';
import Alert from '../../../components/ui/Alert';

// Import 2025 Layout Components
import PersonaWorkspace from '../../../components/results/PersonaWorkspace';
import ReferenceDrawer from '../../../components/results/ReferenceDrawer';
import FooterActionBar from '../../../components/results/FooterActionBar';

// Import Shared Utilities
import { extractVerdictParts } from '../../../lib/analysisUtils';

// Helper function to process text with bold markers
const processBoldText = (text) => {
  if (!text || typeof text !== 'string') return null;
  
  return text.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={j}>{part.slice(2, -2)}</strong>;
    }
    return <span key={j}>{part}</span>;
  });
};

// --- Shared Result Page Component ---
export default function SharedResultPage() {
  const params = useParams();
  const id = params.id;
  const detailViewRef = useRef(null);
  const [shareStatus, setShareStatus] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  // Single source of truth for follow-up history
  const [followUpHistory, setFollowUpHistory] = useState([]);
  
  // Hook for fetching results and handling persona selection
  const {
    resultsData,
    loading,
    error: resultsError,
    selectedPersona,
    isSwitchingPersona,
    handleSelectPersona
  } = useSharedResults(id, detailViewRef);

  // Hook for handling the follow-up chat functionality
  const {
    followUpPersonaId,
    followUpQuestion,
    followUpConversation,
    isFollowUpLoading,
    followUpError,
    setFollowUpQuestion,
    followUpEndRef,
    handleStartFollowUp,
    handleSendFollowUp,
    resetFollowUpChatState,
    setFollowUpConversation
  } = useFollowUpChat({
    originalContextId: id,
    context: resultsData?.context,
    query: resultsData?.query
  });

  // Effect to update follow-up history when conversation changes
  useEffect(() => {
    if (followUpConversation.length > 0 && followUpPersonaId) {
      // Get the latest conversation item
      const latestItem = followUpConversation[followUpConversation.length - 1];
      
      // Create a unique key for this Q&A pair
      const qaKey = `${latestItem.question}:${latestItem.answer.substring(0, 20)}`;
      
      // Check if this Q&A pair already exists in the history
      const exists = followUpHistory.some(item => 
        `${item.question}:${item.answer.substring(0, 20)}` === qaKey
      );
      
      // Only add if it doesn't exist
      if (!exists) {
        setFollowUpHistory(prev => [
          ...prev,
          {
            ...latestItem,
            persona: followUpPersonaId
          }
        ]);
      }
    }
  }, [followUpConversation, followUpPersonaId]);

  // Extract verdict parts for rendering
  const verdictParts = resultsData?.summary ? extractVerdictParts(resultsData.summary) : null;

  // Process responses to use persona names and handle missing properties
  const processedResponses = resultsData?.responses?.map((response, index) => {
    if (!response) return { 
      name: `Response ${index + 1}`, 
      displayName: `Response ${index + 1}`,
      index 
    };
    
    // Use persona property for display name if available, otherwise use name or a default
    const displayName = response.persona || response.name || `Response ${index + 1}`;
    
    // Use short name for button (extract from persona if possible)
    let shortName = displayName;
    if (response.persona && response.persona.includes('(')) {
      shortName = response.persona.split('(')[0].trim();
    }
    
    return { 
      ...response, 
      displayName,
      shortName,
      // If name is missing, use shortName
      name: response.name || shortName,
      index 
    };
  }) || [];

  // Get the selected response
  const selectedResponse = selectedPersona 
    ? processedResponses.find(p => p?.name === selectedPersona || p?.shortName === selectedPersona)
    : null;

  // Show toast notification
  const showToastNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Web Share API / Clipboard Fallback Logic
  const handleShareClick = useCallback(async () => {
    const shareData = {
      title: 'AI Reasonableness Analysis Result',
      text: `Check out the AI analysis for this situation:`,
      url: window.location.href,
    };
    setShareStatus('');

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('Successfully shared using Web Share API');
        setShareStatus('Shared!');
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        console.log('Link copied to clipboard');
        setShareStatus('Link Copied!');
        showToastNotification('Link copied to clipboard!');
      } else {
        console.log('Web Share and Clipboard API not supported');
        setShareStatus('Copy link manually.');
      }
    } catch (err) {
      console.error('Error sharing:', err);
      if (err.name !== 'AbortError') {
        setShareStatus('Could not share.');
        showToastNotification('Failed to share. Please try again.');
      }
    } finally {
      setTimeout(() => setShareStatus(''), 3000);
    }
  }, []);

  // Custom follow-up send handler
  const handleSendFollowUpWithUpdate = useCallback(async (e) => {
    // Call the original handler
    await handleSendFollowUp(e);
  }, [handleSendFollowUp]);

  // Prepare follow-up chat props for PersonaWorkspace
  const followUpChatProps = {
    followUpPersonaId,
    followUpQuestion,
    followUpConversation,
    isFollowUpLoading,
    followUpError,
    setFollowUpQuestion,
    followUpEndRef,
    handleStartFollowUp,
    handleSendFollowUp: handleSendFollowUpWithUpdate
  };

  // Handle loading and error states
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 py-12 px-4 font-sans antialiased text-foreground">
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner className="h-12 w-12 text-primary" />
          <p className="ml-4 text-xl text-secondary-foreground">Loading analysis results...</p>
        </div>
      </main>
    );
  }

  if (resultsError) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 py-12 px-4 font-sans antialiased text-foreground">
        <div className="my-10 max-w-3xl mx-auto">
          <Alert type="error" title="Error Loading Results" message={resultsError} />
        </div>
      </main>
    );
  }

  if (!resultsData) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 py-12 px-4 font-sans antialiased text-foreground">
        <div className="my-10 max-w-3xl mx-auto">
          <Alert type="warning" title="Not Found" message="The requested results could not be found. The link may be invalid or the results may have expired." />
        </div>
      </main>
    );
  }

  // Get verdict badge text
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
    <main className="min-h-screen bg-gradient-to-br from-background to-secondary/10 font-sans antialiased text-foreground pb-20">
      {/* Main Content Area */}
      <div className="pt-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Title and Timestamp */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary tracking-tight">
            AI Reasonableness Analysis
          </h1>
          {resultsData.timestamp && (
            <p className="text-xs text-secondary-foreground mt-2">
              Analysis generated on: {new Date(resultsData.timestamp).toLocaleString()}
            </p>
          )}
        </div>

        {/* Quick Verdict Section - Full width */}
        {resultsData.summary && (
          <div className="mb-8 max-w-full">
            <h2 className="text-2xl font-bold text-white mb-4 text-center">
              The Quick Verdict
            </h2>
            <div className="bg-secondary text-foreground rounded-xl p-6 shadow-lg border border-border/50">
              {verdictParts ? (
                <>
                  <div className={`p-3 rounded-lg mb-4 shadow-md ${getBadgeClasses()}`}>
                    <p className="font-semibold">{verdictParts.firstSentence}</p>
                  </div>
                  {(verdictParts.restOfHeadline || verdictParts.after) && (
                    <div className="mt-4">
                      {verdictParts.restOfHeadline && (
                        <p className="mb-3">{processBoldText(verdictParts.restOfHeadline)}</p>
                      )}
                      {verdictParts.after && (
                        <div className="prose-sm text-foreground">
                          {verdictParts.after.split('\n\n').map((paragraph, i) => (
                            <p key={i} className="mb-3">
                              {processBoldText(paragraph)}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="prose-sm text-foreground">
                  {resultsData.summary.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-3">{processBoldText(paragraph)}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Split-panel Body */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel: Persona Workspace (60%) */}
          <div className="lg:col-span-3">
            <PersonaWorkspace 
              responses={processedResponses} 
              selectedPersona={selectedPersona}
              handleSelectPersona={handleSelectPersona}
              followUpChat={followUpChatProps}
            />
          </div>
          
          {/* Right Panel: Reference Drawer (40%) - Memoized to prevent re-rendering */}
          <div className="lg:col-span-2">
            {/* Using a stable reference to prevent re-renders */}
            <ReferenceDrawer 
              context={resultsData.context}
              snippets={resultsData.snippets || []}
              followUpResponses={followUpHistory}
            />
          </div>
        </div>
      </div>
      
      {/* Footer Action Bar */}
      <FooterActionBar 
        handleShareClick={handleShareClick} 
        shareStatus={shareStatus}
      />
      
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-secondary text-foreground px-4 py-2 rounded-md shadow-lg toast-enter">
          {toastMessage}
        </div>
      )}
      
      {/* Copyright Footer */}
      <footer className="text-center mt-16 mb-20 text-secondary-foreground text-sm px-4">
        © {new Date().getFullYear()} Am I Being Unreasonable?™ | AI Analysis Tool | For informational purposes only. Use results critically.
      </footer>
    </main>
  );
}