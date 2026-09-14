"use client";

import { useState } from "react";
import { publicEnv } from "@/lib/publicEnv";

const ID = publicEnv.NEXT_PUBLIC_STORY_VIDEO_ID;

/**
 * The full "how it's made" film. If NEXT_PUBLIC_STORY_VIDEO_ID (a YouTube id) is
 * set, shows a lightweight click-to-play facade (no YouTube JS until clicked, so
 * page speed isn't hurt). Otherwise falls back to the self-hosted craftsmanship
 * loop so the section always has something to show.
 */
export default function StoryVideo() {
  const [play, setPlay] = useState(false);

  return (
    <div className="mt-16 max-w-4xl mx-auto">
      <div className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl bg-navy">
        {ID ? (
          play ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${ID}?autoplay=1&rel=0&modestbranding=1`}
              title="How Liberty Footwear boots are made"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <button type="button" onClick={() => setPlay(true)} className="group absolute inset-0 w-full h-full" aria-label="Play the film">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/video/hero-poster.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
              <span className="absolute inset-0 bg-navy/40 group-hover:bg-navy/25 transition" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex items-center justify-center w-20 h-20 rounded-full bg-red text-white shadow-xl group-hover:scale-110 transition">
                  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </span>
              </span>
            </button>
          )
        ) : (
          <video
            className="absolute inset-0 w-full h-full object-cover"
            controls
            playsInline
            preload="none"
            poster="/video/hero-poster.jpg"
          >
            <source src="/video/hero-loop.mp4" type="video/mp4" />
          </video>
        )}
      </div>
      <p className="text-center text-sm text-gray-500 mt-4">Watch how every pair is built by hand in Grand Rapids, Michigan.</p>
    </div>
  );
}
