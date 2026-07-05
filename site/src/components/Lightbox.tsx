import { useCallback, useEffect, useRef, useState } from 'react';

export interface LightboxPhoto {
  src: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  caption: string;
  gear: string;
}

interface LightboxProps {
  photos: LightboxPhoto[];
}

export default function Lightbox({ photos }: LightboxProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setActiveIndex(null);
    openerRef.current?.focus();
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i + 1) % photos.length));
  }, [photos.length]);

  const showPrev = useCallback(() => {
    setActiveIndex((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }, [photos.length]);

  // Listen for clicks on server-rendered thumbnail buttons and open at that index.
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const trigger = (event.target as HTMLElement)?.closest<HTMLElement>('[data-photo-index]');
      if (!trigger) return;
      const index = Number(trigger.dataset.photoIndex);
      if (Number.isNaN(index)) return;
      openerRef.current = trigger;
      setActiveIndex(index);
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    if (activeIndex === null) return;

    closeButtonRef.current?.focus();

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        showNext();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showPrev();
      } else if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = '';
    };
  }, [activeIndex, close, showNext, showPrev]);

  if (activeIndex === null) return null;

  const photo = photos[activeIndex];

  return (
    <div className="lightbox-backdrop" role="presentation">
      <div
        className="lightbox-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={photo.title}
        ref={dialogRef}
      >
        <button
          type="button"
          className="lightbox-close"
          onClick={close}
          ref={closeButtonRef}
          aria-label="Close"
        >
          &times;
        </button>

        <button
          type="button"
          className="lightbox-nav lightbox-prev"
          onClick={showPrev}
          aria-label="Previous photo"
        >
          &#8592;
        </button>

        <figure className="lightbox-figure">
          <img src={photo.src} width={photo.width} height={photo.height} alt={photo.alt} />
          <figcaption>
            <span className="lightbox-caption">{photo.caption}</span>
            {photo.gear && <span className="lightbox-gear">{photo.gear}</span>}
          </figcaption>
        </figure>

        <button
          type="button"
          className="lightbox-nav lightbox-next"
          onClick={showNext}
          aria-label="Next photo"
        >
          &#8594;
        </button>
      </div>

      <style>{`
        .lightbox-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(26, 27, 35, 0.95);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lightbox-dialog {
          position: relative;
          display: flex;
          align-items: center;
          gap: 16px;
          max-width: 92vw;
          max-height: 92vh;
        }
        .lightbox-figure {
          margin: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          max-width: 80vw;
        }
        .lightbox-figure img {
          max-width: 80vw;
          max-height: 75vh;
          width: auto;
          height: auto;
          border: 2px solid var(--paper, #fbf7ef);
          border-radius: 12px;
          object-fit: contain;
        }
        .lightbox-figure figcaption {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-family: 'Space Mono', monospace;
          color: var(--paper, #fbf7ef);
          text-align: center;
        }
        .lightbox-caption {
          font-size: 0.9rem;
        }
        .lightbox-gear {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--butter, #ffd23f);
        }
        .lightbox-close {
          position: absolute;
          top: -48px;
          right: 0;
          background: none;
          border: 2px solid var(--paper, #fbf7ef);
          color: var(--paper, #fbf7ef);
          width: 40px;
          height: 40px;
          border-radius: 999px;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
        }
        .lightbox-nav {
          background: none;
          border: 2px solid var(--paper, #fbf7ef);
          color: var(--paper, #fbf7ef);
          width: 48px;
          height: 48px;
          border-radius: 999px;
          font-size: 1.5rem;
          cursor: pointer;
          flex-shrink: 0;
        }
        .lightbox-close:focus-visible,
        .lightbox-nav:focus-visible {
          outline: 2px solid var(--tangerine, #ff5c00);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
