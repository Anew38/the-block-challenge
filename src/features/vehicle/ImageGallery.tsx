import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import clsx from 'clsx';

interface ImageGalleryProps {
  images: string[];
  /** Alt-text base, e.g. "2025 Mazda CX-5 Turbo"; the photo number is appended. */
  title: string;
}

/**
 * Image gallery with a hero image and a thumbnail strip. Prev/next controls and
 * thumbnail clicks select the active photo; arrow keys navigate when the gallery
 * is focused. Falls back to a placeholder when the lot has no images.
 */
export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [index, setIndex] = useState(0);

  // Reset to the first photo if the underlying lot (and its images) changes.
  useEffect(() => {
    setIndex(0);
  }, [images]);

  if (images.length === 0) {
    return (
      <div className="grid aspect-[4/3] w-full place-items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-600 light:border-slate-200 light:bg-white light:text-slate-400">
        <ImageOff className="h-8 w-8" />
        <span className="text-sm">No photos available</span>
      </div>
    );
  }

  const count = images.length;
  const go = (next: number) => setIndex((next + count) % count);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 light:border-slate-200 light:bg-white"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${title} photos`}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            go(index - 1);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            go(index + 1);
          }
        }}
      >
        <img
          src={images[index]}
          alt={`${title} — photo ${index + 1} of ${count}`}
          className="h-full w-full object-cover"
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-slate-950/70 text-slate-200 opacity-0 backdrop-blur transition hover:bg-slate-950/90 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 group-hover:opacity-100 light:bg-white/85 light:text-slate-700 light:hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-slate-950/70 text-slate-200 opacity-0 backdrop-blur transition hover:bg-slate-950/90 focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 group-hover:opacity-100 light:bg-white/85 light:text-slate-700 light:hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>

            <span className="absolute bottom-3 right-3 rounded-full bg-slate-950/70 px-2.5 py-1 font-mono text-xs text-slate-300 backdrop-blur light:bg-white/85 light:text-slate-700">
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`View photo ${i + 1}`}
                aria-current={i === index}
                className={clsx(
                  'aspect-[4/3] w-full overflow-hidden rounded-lg border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                  i === index
                    ? 'border-indigo-500 ring-1 ring-indigo-500'
                    : 'border-slate-800 hover:border-slate-600 light:border-slate-200 light:hover:border-slate-400'
                )}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  className={clsx(
                    'h-full w-full object-cover transition',
                    i !== index && 'opacity-70 hover:opacity-100'
                  )}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
