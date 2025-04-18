"use client";
import React, { useState, useCallback, useEffect } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';

/**
 * PersonaWorkspace component
 * 
 * Displays a tabbed interface for the different personas (Therapist, Analyst, Coach).
 * Each tab shows the persona's key points, rationale with citations, and a follow-up box.
 * 
 * @param {Object} props
 * @param {Array} props.responses - Array of persona responses
 * @param {string} props.selectedPersona - Currently selected persona name
 * @param {Function} props.handleSelectPersona - Function to handle persona selection
 * @param {Object} props.followUpChat - Props for follow-up chat functionality
 * @param {Function} props.onFollowUpSent - Callback when a follow-up is sent and answered
 */
export default function PersonaWorkspace({ 
  responses = [], 
  selectedPersona, 
  handleSelectPersona,
  followUpChat = {},
  onFollowUpSent
}) {
  // Find the currently selected response
  const selectedResponse = responses.find(r => r?.name === selectedPersona);
  
  // State for soft loading animation
  const [isLoading, setIsLoading] = useState(false);
  const [prevPersona, setPrevPersona] = useState(null);
  
  // Effect to handle persona switching animation
  useEffect(() => {
    if (selectedPersona !== prevPersona) {
      setIsLoading(true);
      
      // Short timeout for animation effect
      const timer = setTimeout(() => {
        setIsLoading(false);
        setPrevPersona(selectedPersona);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [selectedPersona, prevPersona]);
  
  // Destructure follow-up chat props
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
  } = followUpChat;

  // Process citation markers in text (e.g., [1], [2], etc.)
  const processCitations = (text) => {
    // Check if text is a string before trying to split it
    if (!text || typeof text !== 'string') {
      return text || null;
    }
    
    // Regular expression to match citation patterns like [1], [2], etc.
    return text.split(/(\[\d+\])/).map((part, index) => {
      if (/\[\d+\]/.test(part)) {
        const citationNumber = part.replace(/[\[\]]/g, '');
        return (
          <span 
            key={index}
            className="text-primary cursor-pointer hover:underline citation-hover"
            onClick={() => handleCitationClick(citationNumber)}
            aria-label={`Citation ${citationNumber}`}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
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

  // Safely process text with both citations and bold formatting
  const processText = (text) => {
    if (!text || typeof text !== 'string') {
      return null;
    }
    
    // First process bold text, then citations
    try {
      const boldProcessed = processBoldText(text);
      // If boldProcessed is a string (no bold formatting found), process citations
      if (typeof boldProcessed === 'string') {
        return processCitations(boldProcessed);
      }
      // If boldProcessed is already an array of elements, return as is
      return boldProcessed;
    } catch (error) {
      console.error("Error processing text:", error);
      return text; // Return original text if processing fails
    }
  };

  // Handle citation click - will be implemented to scroll to the relevant snippet
  const handleCitationClick = (citationNumber) => {
    // Find the corresponding snippet element
    const snippetElement = document.getElementById(`snippet-${citationNumber - 1}`);
    if (snippetElement) {
      // Scroll the snippet into view
      snippetElement.scrollIntoView({ behavior: 'smooth' });
      // Highlight the snippet temporarily
      snippetElement.classList.add('highlight-snippet');
      setTimeout(() => {
        snippetElement.classList.remove('highlight-snippet');
      }, 2000);
    }
  };

  // Custom follow-up send handler that also updates the parent component
  const handleSendFollowUpWithUpdate = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }
    
    // Store the current question before it gets cleared
    const currentQuestion = followUpQuestion;
    
    // Call the original handler
    await handleSendFollowUp(e);
    
    // After a short delay to allow the response to be processed
    setTimeout(() => {
      // Get the latest conversation item
      if (followUpConversation && followUpConversation.length > 0) {
        const latestItem = followUpConversation[followUpConversation.length - 1];
        
        // Call the callback with the latest Q&A pair
        if (onFollowUpSent && typeof onFollowUpSent === 'function') {
          onFollowUpSent(latestItem.question, latestItem.answer, selectedPersona);
        }
      }
    }, 300);
  }, [followUpQuestion, handleSendFollowUp, followUpConversation, onFollowUpSent, selectedPersona]);

  // Handle persona selection with animation
  const handlePersonaClick = (personaName) => {
    if (personaName === selectedPersona) return;
    
    setIsLoading(true);
    handleSelectPersona(personaName);
  };

  return (
    <div className="bg-secondary/40 backdrop-blur-lg shadow-xl rounded-xl p-6 border border-white/10">
      {/* Section Heading */}
      <h2 className="text-lg font-semibold mb-4 text-white">Expert Perspectives</h2>
      
      {/* Tab Bar */}
      <div 
        role="tablist" 
        className="flex border-b border-border/40 mb-6"
        aria-label="Persona perspectives"
      >
        {responses.map((response, index) => (
          <button
            key={response?.name || `response-${index}`}
            role="tab"
            aria-selected={selectedPersona === response?.name}
            aria-controls={`panel-${response?.name}`}
            id={`tab-${response?.name}`}
            onClick={() => handlePersonaClick(response?.name)}
            className={`px-4 py-2 font-medium transition-colors ${
              selectedPersona === response?.name 
                ? 'text-primary border-b-2 border-primary' 
                : 'text-secondary-foreground hover:text-foreground'
            }`}
          >
            {response?.shortName || response?.name || `Response ${index + 1}`}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 animate-fadeIn">
          <LoadingSpinner className="h-8 w-8 text-primary" />
          <p className="mt-4 text-secondary-foreground">Loading perspective...</p>
        </div>
      ) : selectedResponse ? (
        <div
          role="tabpanel"
          id={`panel-${selectedResponse.name}`}
          aria-labelledby={`tab-${selectedResponse.name}`}
          className="space-y-6 animate-fadeIn"
        >
          <h3 className="text-lg font-semibold">Analysis</h3>
          
          {/* Key Points */}
          {selectedResponse.key_points && Array.isArray(selectedResponse.key_points) && selectedResponse.key_points.length > 0 && (
            <div>
              <h4 className="text-base font-semibold mb-3">Key Points</h4>
              <ul className="list-disc list-inside space-y-2 pl-2">
                {selectedResponse.key_points.map((point, index) => (
                  <li key={index} className="text-foreground">{processText(point)}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Rationale with Citations */}
          <div>
            <h4 className="text-base font-semibold mb-3">
              Detailed Perspective from the {selectedResponse.shortName || selectedResponse.name}
            </h4>
            <div className="prose prose-sm text-foreground max-w-none">
              {selectedResponse.rationale ? (
                typeof selectedResponse.rationale === 'string' ? (
                  selectedResponse.rationale.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-4">{processText(paragraph)}</p>
                  ))
                ) : (
                  <p className="italic text-secondary-foreground">Invalid rationale format.</p>
                )
              ) : selectedResponse.response ? (
                typeof selectedResponse.response === 'string' ? (
                  selectedResponse.response.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-4">{processText(paragraph)}</p>
                  ))
                ) : (
                  <p className="italic text-secondary-foreground">Invalid response format.</p>
                )
              ) : (
                <p className="italic text-secondary-foreground">No detailed analysis available.</p>
              )}
            </div>
          </div>
          
          {/* Verdict */}
          {selectedResponse.verdict && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <h4 className="text-base font-semibold mb-2">Verdict</h4>
              <p className="font-medium text-foreground">{selectedResponse.verdict}</p>
            </div>
          )}
          
          {/* Follow-up Box */}
          <div className="mt-6 pt-4 border-t border-border/40">
            {followUpPersonaId === selectedResponse.name ? (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">
                  Continue conversation with {selectedResponse.shortName || selectedResponse.name}
                </h3>
                
                {/* Conversation History */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2 bg-secondary/50 p-4 rounded-lg border border-border/50">
                  {followUpConversation.map((item, index) => (
                    <div key={index} className="text-sm">
                      <p className="font-semibold text-secondary-foreground mb-1">You:</p>
                      <p className="mb-3 text-foreground whitespace-pre-wrap">{item.question}</p>
                      <p className="font-semibold text-primary mb-1">{followUpPersonaId}:</p>
                      <div className="text-foreground">
                        {typeof item.answer === 'string' ? (
                          item.answer.split('\n\n').map((paragraph, i) => (
                            <p key={i} className="mb-3">{processText(paragraph)}</p>
                          ))
                        ) : (
                          <p className="italic">Invalid answer format.</p>
                        )}
                      </div>
                      {index < followUpConversation.length - 1 && <hr className="my-4 border-border/50" />}
                    </div>
                  ))}
                  
                  {isFollowUpLoading && (
                    <div className="flex items-center justify-center p-3 text-secondary-foreground">
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-primary border-t-transparent rounded-full"></div>
                      <span>Getting response...</span>
                    </div>
                  )}
                  
                  {followUpError && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-500">
                      <p className="font-semibold">Error:</p>
                      <p>{followUpError}</p>
                    </div>
                  )}
                  
                  <div ref={followUpEndRef} />
                </div>
                
                {/* Input Form */}
                <form onSubmit={handleSendFollowUpWithUpdate} className="flex items-start space-x-3">
                  <textarea
                    value={followUpQuestion}
                    onChange={(e) => setFollowUpQuestion(e.target.value)}
                    placeholder={`Ask ${followUpPersonaId} another question...`}
                    rows="3"
                    className="flex-1 block w-full rounded-md border-border/70 bg-secondary/50 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2 resize-none disabled:opacity-50 disabled:bg-secondary/30 text-foreground"
                    disabled={isFollowUpLoading}
                    required
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center px-4 py-2 h-[calc(3*1.5rem+1rem)] border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isFollowUpLoading || !followUpQuestion?.trim()}
                  >
                    {isFollowUpLoading ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    )}
                    <span className="sr-only">Send</span>
                  </button>
                </form>
              </div>
            ) : (
              <button
                onClick={() => handleStartFollowUp(selectedResponse.name)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-primary to-accent border border-transparent rounded-md shadow-sm hover:from-primary-hover hover:to-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                Ask follow-up with {selectedResponse.shortName || selectedResponse.name}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center text-secondary-foreground italic mt-4">
          Select a perspective above to view details.
        </div>
      )}
    </div>
  );
}