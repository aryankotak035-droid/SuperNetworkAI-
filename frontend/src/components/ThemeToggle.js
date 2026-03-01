import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Theme persistence key
const THEME_KEY = 'supernetwork-theme';

// Get system preference
const getSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'dark';
};

// Get initial theme from storage or system
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'system') {
    return getSystemTheme();
  }
  return saved || 'dark';
};

// Get stored preference (might be 'system')
const getStoredPreference = () => {
  if (typeof window === 'undefined') return 'dark';
  return localStorage.getItem(THEME_KEY) || 'dark';
};

export const ThemeToggle = ({ showSystemOption = false }) => {
  const [preference, setPreference] = useState(getStoredPreference);
  const [actualTheme, setActualTheme] = useState(getInitialTheme);

  // Apply theme to document
  const applyTheme = useCallback((theme) => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    setActualTheme(theme);
    
    // Also update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
    }
  }, []);

  // Initialize theme on mount
  useEffect(() => {
    const savedPref = getStoredPreference();
    setPreference(savedPref);
    
    if (savedPref === 'system') {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(savedPref);
    }
  }, [applyTheme]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      if (preference === 'system') {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preference, applyTheme]);

  // Simple toggle between light and dark
  const toggleTheme = () => {
    const newTheme = actualTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(THEME_KEY, newTheme);
    setPreference(newTheme);
    applyTheme(newTheme);
  };

  // Cycle through: dark -> light -> system (if enabled)
  const cycleTheme = () => {
    let newPref;
    if (preference === 'dark') {
      newPref = 'light';
    } else if (preference === 'light') {
      newPref = showSystemOption ? 'system' : 'dark';
    } else {
      newPref = 'dark';
    }
    
    localStorage.setItem(THEME_KEY, newPref);
    setPreference(newPref);
    
    if (newPref === 'system') {
      applyTheme(getSystemTheme());
    } else {
      applyTheme(newPref);
    }
  };

  const handleClick = showSystemOption ? cycleTheme : toggleTheme;

  const getIcon = () => {
    if (preference === 'system') {
      return <Monitor className="w-5 h-5" />;
    }
    return actualTheme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />;
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="rounded-full relative overflow-hidden"
      data-testid="theme-toggle"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={`${preference}-${actualTheme}`}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          exit={{ rotate: 90, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {getIcon()}
        </motion.div>
      </AnimatePresence>
    </Button>
  );
};

// Export a hook for components that need to check the current theme
export const useTheme = () => {
  const [theme, setTheme] = useState(getInitialTheme);
  
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = document.documentElement.classList.contains('dark');
          setTheme(isDark ? 'dark' : 'light');
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);
  
  return theme;
};
