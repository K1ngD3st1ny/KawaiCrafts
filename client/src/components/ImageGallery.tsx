import { useState, useRef, useEffect, MouseEvent as ReactMouseEvent } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { Button } from "./ui/button";

interface ImageGalleryProps {
  images: string[];
  productName: string;
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Desktop Zoom State
  const [isZooming, setIsZooming] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({ display: "none", backgroundPosition: "0% 0%" });
  const imgRef = useRef<HTMLImageElement>(null);

  // Touch Swipe State
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  // Only thumbnail exists, no additional gallery images
  if (images.length === 0) return null;

  // --- Desktop Zoom Handlers ---
  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (window.innerWidth < 768) return; // Disable zoom on mobile
    if (!imgRef.current) return;
    
    setIsZooming(true);
    
    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    
    setZoomStyle({
      display: "block",
      backgroundPosition: `${x}% ${y}%`,
    });
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
    setZoomStyle({ display: "none", backgroundPosition: "0% 0%" });
  };

  // --- Mobile Touch Handlers ---
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && selectedIndex < images.length - 1) {
      setSelectedIndex((prev) => prev + 1);
    }
    if (isRightSwipe && selectedIndex > 0) {
      setSelectedIndex((prev) => prev - 1);
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  const mainImage = images[selectedIndex];

  // Prevent scrolling when fullscreen is open
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isFullscreen]);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image Container */}
      <div 
        className="relative w-full aspect-square md:aspect-[4/5] bg-muted rounded-xl overflow-hidden shadow-md cursor-zoom-in md:cursor-crosshair group"
        onClick={() => {
          if (window.innerWidth < 768) setIsFullscreen(true);
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img
          ref={imgRef}
          src={mainImage}
          alt={`${productName} view ${selectedIndex + 1}`}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
        
        {/* Desktop Zoom Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-200 z-10"
          style={{
            ...zoomStyle,
            opacity: isZooming ? 1 : 0,
            backgroundImage: `url(${mainImage})`,
            backgroundSize: "300%",
            backgroundRepeat: "no-repeat",
            backgroundColor: "hsl(var(--background))"
          }}
        />

        {/* Mobile Fullscreen Hint */}
        <div className="md:hidden absolute bottom-3 right-3 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm shadow-sm pointer-events-none">
          <ZoomIn className="w-4 h-4" />
        </div>
      </div>

      {/* Thumbnails Strip */}
      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-md overflow-hidden snap-start transition-all duration-200 border-2 ${
                selectedIndex === idx ? "border-primary scale-95 opacity-100" : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img 
                src={img} 
                alt={`Thumbnail ${idx + 1}`} 
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Mobile Fullscreen Viewer */}
      {isFullscreen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 text-white">
            <span className="font-medium text-sm">
              {selectedIndex + 1} / {images.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20 rounded-full"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          
          <div 
            className="flex-1 relative flex items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Prev Button (shows on tap) */}
            {selectedIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 z-10 text-white hover:bg-white/20 rounded-full w-10 h-10"
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(prev => prev - 1); }}
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}

            <img
              src={mainImage}
              alt={`${productName} fullscreen`}
              className="w-full max-h-full object-contain pointer-events-none"
            />

            {/* Next Button (shows on tap) */}
            {selectedIndex < images.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 z-10 text-white hover:bg-white/20 rounded-full w-10 h-10"
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(prev => prev + 1); }}
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}
          </div>
          
          {/* Mobile Thumbnails Strip in Fullscreen */}
          <div className="p-4 flex gap-2 overflow-x-auto bg-black/50 backdrop-blur-md">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`w-14 h-14 flex-shrink-0 rounded overflow-hidden transition-all duration-200 border ${
                  selectedIndex === idx ? "border-primary opacity-100" : "border-transparent opacity-50"
                }`}
              >
                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
