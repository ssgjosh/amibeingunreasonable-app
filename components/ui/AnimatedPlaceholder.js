import React, { useState, useEffect, useRef, useCallback } from 'react';

// Define static phrases outside the component
const examplePhrases = [
    "My flatmate never does the washing up...",
    "My partner spent our savings without telling me...",
    "I refused to attend my cousin's destination wedding...",
    "I told my friend her new haircut doesn't suit her...",
    "My neighbor keeps parking in my designated spot..."
];

const AnimatedPlaceholder = ({ isActive }) => {
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const animationRef = useRef(null);

    const resetAnimation = useCallback(() => {
        if (animationRef.current) {
            clearTimeout(animationRef.current);
        }
        setDisplayText('');
        setCurrentCharIndex(0);
        setIsTyping(true);
    }, []);

    // Handle typing animation
    useEffect(() => {
        if (!isActive) {
            resetAnimation();
            return;
        }

        // Access the phrases array defined outside
        const currentPhrase = examplePhrases[currentPhraseIndex];

        if (isTyping) {
            // Typing forward
            if (currentCharIndex < currentPhrase.length) {
                animationRef.current = setTimeout(() => {
                    setDisplayText(currentPhrase.substring(0, currentCharIndex + 1));
                    setCurrentCharIndex(prev => prev + 1);
                }, 80); // Typing speed
            } else {
                // Pause at the end of typing before starting to delete
                animationRef.current = setTimeout(() => {
                    setIsTyping(false);
                }, 2000); // Pause duration
            }
        } else {
            // Deleting
            if (currentCharIndex > 0) {
                animationRef.current = setTimeout(() => {
                    setDisplayText(currentPhrase.substring(0, currentCharIndex - 1));
                    setCurrentCharIndex(prev => prev - 1);
                }, 50); // Deleting speed (faster than typing)
            } else {
                // Move to next phrase
                const nextPhraseIndex = (currentPhraseIndex + 1) % examplePhrases.length;
                setCurrentPhraseIndex(nextPhraseIndex);
                setIsTyping(true);
            }
        }

        return () => {
            if (animationRef.current) {
                clearTimeout(animationRef.current);
            }
        };
        // Removed examplePhrases from dependency array
    }, [isActive, currentCharIndex, currentPhraseIndex, isTyping, resetAnimation]);

    if (!isActive) return null;

    return (
        <div className="absolute inset-0 pointer-events-none flex items-start p-4">
            {/* Use secondary foreground for placeholder text and cursor */}
            <div className="text-secondary-foreground text-xl font-light animate-pulse-slow">
                {displayText}
                <span className="inline-block w-0.5 h-5 bg-secondary-foreground ml-0.5 animate-blink"></span>
            </div>
        </div>
    );
};

export default AnimatedPlaceholder;