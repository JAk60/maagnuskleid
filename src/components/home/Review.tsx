import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react';

const testimonials = [
  {
    quote:
      "Magnus Kleid totally upgraded my wardrobe. The oversized shirts fit perfectly and the fabric quality is unbelievable. I finally found a brand that matches my vibe.",
    name: "Rohan Mehta",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2"
  },
  {
    quote:
      "Comfort and style in one place! The sweatpants feel premium, and I could wear them all day. Magnus Kleid made online shopping a super smooth experience.",
    name: "Aarav Singh",
    src: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5"
  },
  {
    quote:
      "The quality is fantastic and the customer support is very responsive. They genuinely care about making customers happy. Magnus Kleid has earned a loyal customer.",
    name: "Ishika Kapoor",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2"
  },
  {
    quote:
      "Love how often they drop new collections and designs. Magnus Kleid is clearly listening to what the youth want in streetwear. Every drop feels fresher than the last.",
    name: "Kabir Nair",
    src: "https://images.unsplash.com/photo-1599566150163-29194dcaad36"
  },
  {
    quote:
      "Totally worth the price! My jeans fit perfectly and the stitching and finish are way better than many big brands. Magnus Kleid helped me level up my daily wear instantly.",
    name: "Zoya Rahman",
    src: "https://images.unsplash.com/photo-1557053910-d9eadeed1c58"
  },
];

// Fixed rotation values to avoid hydration mismatch
const rotations = [-7, 3, -2, 5, -4];

const AnimatedTestimonials = ({autoplay = true }) => {
  const [active, setActive] = useState(0);

  const handleNext = React.useCallback(() => {
    setActive((prev) => (prev + 1) % testimonials.length);
  }, []);

  const handlePrev = () => {
    setActive((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (!autoplay) return;
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, [autoplay, handleNext]);

  const isActive = (index: number) => index === active;

  return (
    <div className="mx-auto max-w-sm px-4 py-20 font-sans antialiased md:max-w-4xl md:px-8 lg:px-12">
      <div className="relative grid grid-cols-1 gap-y-12 md:grid-cols-2 md:gap-x-20">
        <div className="flex items-center justify-center">
          <div className="relative h-80 w-full max-w-xs">
            <AnimatePresence>
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.src}
                  initial={{ opacity: 0, scale: 0.9, y: 50, rotate: rotations[index] }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.5,
                    scale: isActive(index) ? 1 : 0.9,
                    y: isActive(index) ? 0 : 20,
                    zIndex: isActive(index) ? testimonials.length : testimonials.length - Math.abs(index - active),
                    rotate: isActive(index) ? 0 : rotations[index],
                  }}
                  exit={{ opacity: 0, scale: 0.9, y: -50 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="absolute inset-0 origin-bottom"
                  style={{ perspective: '1000px' }}
                >
                  <Image
                    src={testimonial.src}
                    alt={testimonial.name}
                    width={500}
                    height={500}
                    draggable={false}
                    className="h-full w-full rounded-3xl object-cover shadow-2xl"
                    onError={(e) => {
                      e.currentTarget.src = `https://placehold.co/500x500/e2e8f0/64748b?text=${testimonial.name.charAt(0)}`;
                      e.currentTarget.onerror = null;
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col justify-center py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col justify-between"
            >
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                  {testimonials[active].name}
                </h3>
                <motion.p className="mt-8 text-lg text-slate-700 dark:text-slate-300">
                  {testimonials[active].quote}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex gap-4 pt-12">
            <button
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-slate-800 dark:hover:bg-slate-700 dark:focus:ring-slate-500"
            >
              <ArrowLeft className="h-5 w-5 text-slate-800 transition-transform duration-300 group-hover:-translate-x-1 dark:text-slate-300" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next testimonial"
              className="group flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 transition-colors hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 dark:bg-slate-800 dark:hover:bg-slate-700 dark:focus:ring-slate-500"
            >
              <ArrowRight className="h-5 w-5 text-slate-800 transition-transform duration-300 group-hover:translate-x-1 dark:text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedTestimonials;