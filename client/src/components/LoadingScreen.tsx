import { useState, useEffect } from "react";

interface LoadingScreenProps {
  /** Whether the loading screen should be visible */
  isLoading: boolean;
  /** Optional loading text to display beneath the loader */
  text?: string;
}

const loadingMessages = [
  "Loading KawaiCrafts...",
  "Preparing your collection...",
  "Loading your anime marketplace...",
];

/**
 * Full-screen branded loading overlay using the KawaiCrafts CSS loader.
 *
 * Displays during initial app load, session restoration, and initial product
 * catalog loading. Uses smooth fade-in / fade-out transitions and respects
 * the user's `prefers-reduced-motion` setting.
 */
export default function LoadingScreen({ isLoading, text }: LoadingScreenProps) {
  const [visible, setVisible] = useState(isLoading);
  const [fadeOut, setFadeOut] = useState(false);
  const [message] = useState(
    () => text || loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
  );

  useEffect(() => {
    if (isLoading) {
      // Show immediately when loading starts
      setVisible(true);
      setFadeOut(false);
    } else {
      // Begin fade-out, then remove from DOM
      setFadeOut(true);
      const timer = setTimeout(() => {
        setVisible(false);
      }, 500); // matches the CSS fade-out duration
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!visible) return null;

  return (
    <div
      className={`loading-screen ${fadeOut ? "loading-screen--fade-out" : ""}`}
      role="status"
      aria-live="polite"
      aria-label="Application is loading"
      id="global-loading-screen"
    >
      <div className="loading-screen__content">
        {/* The exact CSS loader from the spec */}
        <div className="kawai-loader" aria-hidden="true" />
        <p className="loading-screen__text">{message}</p>
      </div>
    </div>
  );
}
