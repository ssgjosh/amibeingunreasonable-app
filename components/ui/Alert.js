import React from 'react';

const Alert = ({ type = 'error', title, message }) => {
    // Use theme colors defined in tailwind.config.js
    const colors = {
        error: 'bg-danger/10 border-danger text-foreground', // Use danger color with subtle background
        warning: 'bg-warning/10 border-warning text-foreground', // Use warning color with subtle background
        info: 'bg-primary/10 border-primary text-foreground', // Use primary color for info with subtle background
        success: 'bg-success/10 border-success text-foreground', // Added success style
    };
    const displayMessage = typeof message === 'string' && message.trim() !== '' ? message : "An unspecified error occurred or no details were provided.";
    return (
        // Apply theme colors and maintain border-l style
        <div className={`border-l-4 p-4 rounded-lg shadow-sm ${colors[type] || colors.info}`} role="alert">
            {/* Use foreground color for title */}
            {title && <p className="font-bold mb-1 text-foreground">{title}</p>}
            {/* Use secondary foreground for message for slightly less emphasis */}
            <p className="text-secondary-foreground">{displayMessage}</p>
        </div>
    );
};

export default Alert;