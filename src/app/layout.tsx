// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patrol System – Mahkota Group",
  description: "Platform pelaporan pemantauan patrol Security & EHS&FS",
  icons: {
    icon: "/favicon.ico",
  },
};

// Inline script to prevent screenshot and screen recording detection
const screenshotPreventionScript = `
(function() {
  // Disable right-click context menu
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });

  // Block common screenshot keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // PrintScreen key
    if (e.key === 'PrintScreen' || e.keyCode === 44) {
      e.preventDefault();
      // Clear clipboard to make PrintScreen capture black/empty
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('').catch(function() {});
      }
      return false;
    }
    // Windows: Win+Shift+S (Snip & Sketch), Win+PrintScreen
    if (e.key === 'PrintScreen' && (e.metaKey || e.shiftKey)) {
      e.preventDefault();
      return false;
    }
    // Mac: Cmd+Shift+3, Cmd+Shift+4, Cmd+Shift+5 (screenshot tools)
    if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5' || e.key === '6')) {
      e.preventDefault();
      return false;
    }
    // Ctrl+P (print) - blocks print-to-PDF screenshot method
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
      e.preventDefault();
      return false;
    }
    // F12 DevTools — optional deterrent
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }
    // Ctrl+Shift+I (DevTools)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
      e.preventDefault();
      return false;
    }
    // Ctrl+U (view source)
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      return false;
    }
  });

  // Detect visibility change (possible screen recording detection)
  document.addEventListener('visibilitychange', function() {
    // Page is visible again — could apply blur or warning if needed
  });

  // Disable drag-start on all elements 
  document.addEventListener('dragstart', function(e) {
    e.preventDefault();
    return false;
  });

  // Disable selection on touch devices  
  document.addEventListener('selectstart', function(e) {
    var target = e.target;
    if (target && (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    )) {
      return true; // allow in form fields
    }
    e.preventDefault();
    return false;
  });
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        {/* Screenshot prevention: runs before page renders */}
        <script
          dangerouslySetInnerHTML={{ __html: screenshotPreventionScript }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
