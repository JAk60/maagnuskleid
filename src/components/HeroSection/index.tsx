'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroVideoData {
  gender: 'Male' | 'Female';
  video_url: string;
  poster_url: string;
  carousel_images?: string[] | null;
  mode: 'video' | 'carousel';
  version: number;
}

interface HeroVideoApiResponse {
  success: boolean;
  data: HeroVideoData[];
}

const FALLBACK = {
  Male: { video: '/videos/L1.mp4', poster: '/videos/L1-poster.webp' },
  Female: { video: '/videos/L2.mp4', poster: '/videos/L2-poster.webp' },
};

const AUTOPLAY_INTERVAL = 3000;
const RESUME_DELAY = 5000;

// ── Video hero ─────────────────────────────────────────────────
function VideoHero({
  gender,
  videoSrc,
  posterSrc,
}: {
  gender: "Men's" | "Women's";
  videoSrc: string;
  posterSrc: string;
}) {
  return (
    <div className="relative w-full h-[90vh] overflow-hidden bg-black">
      <video
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        poster={posterSrc}
        key={videoSrc}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      <div className="relative z-10 h-full flex items-end justify-start md:justify-end px-6 md:px-12 pb-12">
        <ShopButton gender={gender} />
      </div>
    </div>
  );
}

// ── Image carousel ─────────────────────────────────────────────
function ImageCarousel({
  gender,
  images,
}: {
  gender: "Men's" | "Women's";
  images?: string[] | null;
}) {
  // 🔥 SAFETY FIX
  const safeImages = Array.isArray(images) ? images : [];
  const count = safeImages.length;

  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Swipe refs
  const startX = useRef(0);
  const endX = useRef(0);

  const go = useCallback(
    (dir: 1 | -1) => {
      setCurrent((c) => (c + dir + count) % count);
      setProgressKey((k) => k + 1);
    },
    [count]
  );

  const pauseTemporarily = () => {
    setPaused(true);
    setTimeout(() => setPaused(false), RESUME_DELAY);
  };

  // ✅ Stable autoplay
  useEffect(() => {
    if (paused || count <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % count);
      setProgressKey((k) => k + 1);
    }, AUTOPLAY_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, count]);

  // 🔥 Preload next image
  useEffect(() => {
    if (count > 1) {
      const next = (current + 1) % count;
      const img = new window.Image();
      img.src = safeImages[next];
    }
  }, [current, count, safeImages]);

  // 📱 Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    endX.current = e.touches[0].clientX;
  };

  const onTouchEnd = () => {
    const diff = startX.current - endX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) go(1);
      else go(-1);
      pauseTemporarily();
    }
  };

  if (count === 0) return null;

  return (
    <div
      className="relative w-full h-[90vh] overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {safeImages.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        >
          <Image
            src={src}
            alt={`${gender} hero slide ${i + 1}`}
            fill
            className="object-cover"
            sizes="100vw"
            priority={i === 0}
          />
        </div>
      ))}

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

      {/* Arrows */}
      {count > 1 && (
        <>
          <button
            onClick={() => {
              go(-1);
              pauseTemporarily();
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white backdrop-blur-sm transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              go(1);
              pauseTemporarily();
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white backdrop-blur-sm transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {safeImages.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrent(i);
                setProgressKey((k) => k + 1);
                pauseTemporarily();
              }}
              className={`rounded-full transition-all ${
                i === current
                  ? 'w-6 h-2 bg-white'
                  : 'w-2 h-2 bg-white/50 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      {/* 🔥 Progress bar */}
      {!paused && count > 1 && (
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/20">
          <div key={progressKey} className="h-full bg-white animate-progress" />
        </div>
      )}

      {/* CTA */}
      <div className="relative z-10 h-full flex items-end justify-start md:justify-end px-6 md:px-12 pb-12">
        <ShopButton gender={gender} />
      </div>

      {/* Progress animation */}
      <style jsx>{`
        .animate-progress {
          width: 100%;
          animation: progress ${AUTOPLAY_INTERVAL}ms linear;
        }

        @keyframes progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// ── CTA ────────────────────────────────────────────────────────
function ShopButton({ gender }: { gender: "Men's" | "Women's" }) {
  return (
    <Link
      href={
        gender === "Men's"
          ? '/products/gender/Male'
          : '/products/gender/Female'
      }
    >
      <button className="px-8 py-3 bg-[#E3D9C6] text-black font-semibold text-base rounded-full hover:bg-white transition-all shadow-md">
        Shop {gender}
      </button>
    </Link>
  );
}

// ── Main export ────────────────────────────────────────────────
export default function HeroCarousel() {
  const [heroData, setHeroData] = useState<HeroVideoData[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/admin/hero-videos')
      .then((r) => r.json())
      .then((res) => {
        const data = res as HeroVideoApiResponse;
        if (data.success && data.data.length > 0) {
          setHeroData(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const getRow = (gender: 'Male' | 'Female') =>
    heroData.find((v) => v.gender === gender);

  const getVideoUrl = (
    gender: 'Male' | 'Female',
    type: 'video' | 'poster'
  ) => {
    const row = getRow(gender);
    if (row) {
      const base =
        type === 'video' ? row.video_url : row.poster_url;

      return base
        ? `${base}?v=${row.version}`
        : FALLBACK[gender][type === 'video' ? 'video' : 'poster'];
    }

    return FALLBACK[gender][
      type === 'video' ? 'video' : 'poster'
    ];
  };

  if (!loaded) {
    return (
      <div className="w-full bg-black">
        <div className="w-full h-[90vh] bg-black" />
        <div className="w-full h-[90vh] bg-black" />
      </div>
    );
  }

  return (
    <div className="w-full bg-black">
      {(['Male', 'Female'] as const).map((g) => {
        const row = getRow(g);
        const genderLabel = g === 'Male' ? "Men's" : "Women's";

        if (
          row?.mode === 'carousel' &&
          (row.carousel_images?.length ?? 0) > 0
        ) {
          return (
            <ImageCarousel
              key={g}
              gender={genderLabel}
              images={row.carousel_images ?? []} // ✅ FIXED
            />
          );
        }

        return (
          <VideoHero
            key={g}
            gender={genderLabel}
            videoSrc={getVideoUrl(g, 'video')}
            posterSrc={getVideoUrl(g, 'poster')}
          />
        );
      })}
    </div>
  );
}