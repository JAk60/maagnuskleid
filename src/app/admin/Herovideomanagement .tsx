'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {
  Upload, Video, Image as ImageIcon, CheckCircle,
  RefreshCw, ExternalLink, GripVertical, X,
} from 'lucide-react';

interface HeroVideo {
  id: string;
  gender: 'Male' | 'Female';
  video_url: string;
  poster_url: string;
  carousel_images: string[];
  mode: 'video' | 'carousel';
  version: number;
  updated_at: string;
}

type UploadType = 'video' | 'poster';

export default function HeroVideoManagement() {
  const [videos, setVideos] = useState<HeroVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeUploadRef = useRef<{
    gender: 'Male' | 'Female';
    type: UploadType | 'carousel';
    slotIndex?: number;
  } | null>(null);

  // Drag state for carousel reorder
  const dragItem = useRef<{ gender: 'Male' | 'Female'; index: number } | null>(null);
  const dragOver = useRef<number | null>(null);

  useEffect(() => { fetchVideos(); }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/hero-videos');
      const data = await res.json() as { success: boolean; data: HeroVideo[] };
      if (data.success) setVideos(data.data);
    } catch {
      toast.error('Failed to load hero videos');
    } finally {
      setLoading(false);
    }
  };

  const getVideo = (gender: 'Male' | 'Female') =>
    videos.find((v) => v.gender === gender);

  const setUploadingKey = (key: string, val: boolean) =>
    setUploading((p) => ({ ...p, [key]: val }));

  const isUploadingKey = (key: string) => uploading[key] ?? false;

  // ── Mode toggle ──────────────────────────────────────────────
  const toggleMode = async (gender: 'Male' | 'Female', mode: 'video' | 'carousel') => {
    try {
      const res = await fetch('/api/admin/hero-videos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender, mode }),
      });
      const data = await res.json() as { success: boolean; error?: string };
      if (!data.success) throw new Error(data.error);
      setVideos((prev) =>
        prev.map((v) => (v.gender === gender ? { ...v, mode } : v))
      );
      toast.success(`${gender} hero switched to ${mode} mode`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to switch mode');
    }
  };

  // ── File upload trigger ──────────────────────────────────────
  const triggerUpload = (
    gender: 'Male' | 'Female',
    type: UploadType | 'carousel',
    slotIndex?: number
  ) => {
    activeUploadRef.current = { gender, type, slotIndex };
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.accept =
        type === 'video'
          ? 'video/mp4,video/webm,video/ogg'
          : 'image/jpeg,image/jpg,image/png,image/webp';
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadRef.current) return;
    const { gender, type, slotIndex } = activeUploadRef.current;

    const uploadKey = type === 'carousel' ? `${gender}-carousel-${slotIndex}` : `${gender}-${type}`;
    setUploadingKey(uploadKey, true);

    try {
      const isVideo = type === 'video';
      const ext = file.name.split('.').pop() || 'jpg';
      const key = isVideo
        ? `hero-videos/${gender.toLowerCase()}.mp4`
        : type === 'poster'
          ? `hero-videos/${gender.toLowerCase()}-poster.webp`
          : `hero-videos/${gender.toLowerCase()}-carousel-${slotIndex}.${ext}`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', key);

      const uploadRes = await fetch('/api/r2/upload', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json() as { success: boolean; url?: string; error?: string };
      if (!uploadData.success || !uploadData.url) throw new Error(uploadData.error || 'Upload failed');

      if (type === 'carousel') {
        // Splice into carousel_images array
        const current = getVideo(gender)?.carousel_images ?? [];
        const updated = [...current];
        updated[slotIndex!] = uploadData.url;
        await saveCarouselImages(gender, updated);
      } else {
        // video or poster
        const saveRes = await fetch('/api/admin/hero-videos', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gender, type, url: uploadData.url }),
        });
        const saveData = await saveRes.json() as { success: boolean; error?: string };
        if (!saveData.success) throw new Error(saveData.error);
        toast.success(
          type === 'video' ? `${gender}'s hero video updated!` : `${gender}'s poster updated!`
        );
        await fetchVideos();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingKey(uploadKey, false);
      activeUploadRef.current = null;
    }
  };

  const saveCarouselImages = async (gender: 'Male' | 'Female', images: string[]) => {
    const res = await fetch('/api/admin/hero-videos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gender, carousel_images: images }),
    });
    const data = await res.json() as { success: boolean; error?: string };
    if (!data.success) throw new Error(data.error);
    toast.success(`${gender}'s carousel updated!`);
    await fetchVideos();
  };

  // ── Drag-to-reorder carousel ─────────────────────────────────
  const handleDragStart = (gender: 'Male' | 'Female', index: number) => {
    dragItem.current = { gender, index };
  };

  const handleDragEnter = (index: number) => {
    dragOver.current = index;
  };

  const handleDrop = async (gender: 'Male' | 'Female') => {
    if (!dragItem.current || dragOver.current === null) return;
    if (dragItem.current.gender !== gender) return;

    const from = dragItem.current.index;
    const to = dragOver.current;
    if (from === to) return;

    const current = [...(getVideo(gender)?.carousel_images ?? [])];
    const [moved] = current.splice(from, 1);
    current.splice(to, 0, moved);

    dragItem.current = null;
    dragOver.current = null;

    try {
      await saveCarouselImages(gender, current);
    } catch (err) {
      toast.error('Failed to reorder');
    }
  };

  const removeCarouselImage = async (gender: 'Male' | 'Female', index: number) => {
    const current = [...(getVideo(gender)?.carousel_images ?? [])];
    current.splice(index, 1);
    try {
      await saveCarouselImages(gender, current);
    } catch {
      toast.error('Failed to remove image');
    }
  };

  // ── Render ───────────────────────────────────────────────────
  const genders: Array<{ key: 'Male' | 'Female'; label: string; emoji: string; color: string }> = [
    { key: 'Male', label: "Men's", emoji: '👔', color: 'blue' },
    { key: 'Female', label: "Women's", emoji: '👗', color: 'pink' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading hero videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hero Media Management</h1>
          <p className="text-gray-600 mt-1">Manage homepage hero videos or image carousels</p>
        </div>
        <button
          onClick={fetchVideos}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
        >
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {genders.map(({ key, label, emoji, color }) => {
          const video = getVideo(key);
          const isCarousel = video?.mode === 'carousel';
          const carouselImages = video?.carousel_images ?? [];

          return (
            <div key={key} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              {/* Card Header */}
              <div className={`px-6 py-4 border-b border-gray-200 ${color === 'blue' ? 'bg-blue-50' : 'bg-pink-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{label} Hero</h2>
                      {video?.updated_at && (
                        <p className="text-xs text-gray-500">
                          Last updated:{' '}
                          {new Date(video.updated_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  {video && (
                    <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full font-semibold">
                      <CheckCircle className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>

                {/* Mode Toggle */}
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-600">Mode:</span>
                  <div className="flex rounded-lg overflow-hidden border border-gray-300 text-xs font-semibold">
                    <button
                      onClick={() => !isCarousel || toggleMode(key, 'video')}
                      className={`px-3 py-1.5 flex items-center gap-1 transition ${!isCarousel
                        ? 'bg-gray-800 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      <Video className="w-3 h-3" /> Video
                    </button>
                    <button
                      onClick={() => isCarousel || toggleMode(key, 'carousel')}
                      className={`px-3 py-1.5 flex items-center gap-1 transition ${isCarousel
                        ? 'bg-gray-800 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                      <ImageIcon className="w-3 h-3" /> Carousel
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* ── VIDEO MODE ── */}
                {!isCarousel && (
                  <>
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Video className="w-4 h-4" /> Current Video
                      </p>
                      {video?.video_url ? (
                        <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                          <video
                            src={`${video.video_url}?v=${video.version}`}
                            poster={video.poster_url ? `${video.poster_url}?v=${video.version}` : undefined}
                            className="w-full h-full object-cover"
                            controls muted preload="metadata"
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg bg-gray-100 aspect-video flex items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-center text-gray-400">
                            <Video className="w-10 h-10 mx-auto mb-2" />
                            <p className="text-sm">No video uploaded yet</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4" /> Poster Image
                      </p>
                      {video?.poster_url ? (
                        <div className="rounded-lg overflow-hidden bg-gray-100 h-32 relative">
                          <Image
                            src={`${video.poster_url}?v=${video.version}`}
                            alt={`${label} poster`}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg bg-gray-100 h-32 flex items-center justify-center border-2 border-dashed border-gray-300">
                          <div className="text-center text-gray-400">
                            <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                            <p className="text-xs">No poster uploaded yet</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {(['video', 'poster'] as UploadType[]).map((t) => {
                        const uk = `${key}-${t}`;
                        const busy = isUploadingKey(uk);
                        return (
                          <button
                            key={t}
                            onClick={() => triggerUpload(key, t)}
                            disabled={busy}
                            className={`flex flex-col items-center gap-2 px-4 py-4 rounded-xl border-2 border-dashed transition font-medium text-sm disabled:opacity-60
                              ${busy ? 'border-blue-300 bg-blue-50 text-blue-400 cursor-wait' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 cursor-pointer'}`}
                          >
                            {busy ? (
                              <><div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /><span>Uploading...</span></>
                            ) : t === 'video' ? (
                              <><Upload className="w-6 h-6 text-gray-400" /><span className="text-gray-600">Upload Video</span><span className="text-xs text-gray-400 font-normal">MP4, WebM, OGG</span></>
                            ) : (
                              <><ImageIcon className="w-6 h-6 text-gray-400" /><span className="text-gray-600">Upload Poster</span><span className="text-xs text-gray-400 font-normal">JPG, PNG, WebP</span></>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* ── CAROUSEL MODE ── */}
                {isCarousel && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">
                        Carousel Images
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          ({carouselImages.length}/5) — drag to reorder
                        </span>
                      </p>
                    </div>

                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => {
                        const imgUrl = carouselImages[i];
                        const uk = `${key}-carousel-${i}`;
                        const busy = isUploadingKey(uk);
                        const filled = !!imgUrl;

                        return (
                          <div
                            key={i}
                            draggable={filled}
                            onDragStart={() => filled && handleDragStart(key, i)}
                            onDragEnter={() => handleDragEnter(i)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => handleDrop(key)}
                            className={`flex items-center gap-3 rounded-xl border-2 p-3 transition
                              ${filled ? 'border-gray-200 bg-gray-50 cursor-grab active:cursor-grabbing' : 'border-dashed border-gray-300 bg-white'}`}
                          >
                            {/* Drag handle */}
                            {filled && (
                              <GripVertical className="w-4 h-4 text-gray-400 shrink-0" />
                            )}

                            {/* Slot number */}
                            <span className="text-xs font-bold text-gray-400 w-4 shrink-0">{i + 1}</span>

                            {/* Preview or empty */}
                            {filled ? (
                              <div className="w-16 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0 relative">
                                <Image src={imgUrl} alt={`Slide ${i + 1}`} fill className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-16 h-10 rounded-lg bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                                <ImageIcon className="w-4 h-4 text-gray-300" />
                              </div>
                            )}

                            {/* Label */}
                            <span className="text-xs text-gray-500 flex-1">
                              {filled ? `Slide ${i + 1}` : `Empty slot ${i + 1}`}
                            </span>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => triggerUpload(key, 'carousel', i)}
                                disabled={busy}
                                className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition disabled:opacity-50"
                              >
                                {busy ? (
                                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                                ) : filled ? 'Replace' : 'Upload'}
                              </button>

                              {filled && (
                                <button
                                  onClick={() => removeCarouselImage(key, i)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {carouselImages.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-2">
                        Upload at least one image to activate the carousel
                      </p>
                    )}
                  </div>
                )}

                {/* View live */}
                {(video?.video_url || carouselImages.length > 0) && (
                  <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-xs text-gray-500 hover:text-gray-700 transition"
                  >
                    <ExternalLink className="w-3 h-3" /> Preview on homepage
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cache info */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-500 space-y-1">
        <p className="font-semibold text-gray-700">Cache busting</p>
        <p>
          Each upload increments a version number appended to the URL (e.g.{' '}
          <code className="bg-gray-100 px-1 rounded">male.mp4?v=3</code>).
          This forces browsers and CDN to load the latest file even if the filename is the same.
        </p>
      </div>
    </div>
  );
}