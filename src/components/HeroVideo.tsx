/**
 * Hero background loop. iOS Safari decides whether to autoplay while it parses the
 * page, and it ONLY autoplays a video whose `muted` + `playsinline` attributes are
 * present in that initial HTML. React strips the `muted` attribute from its output
 * (a long-standing quirk), which is exactly why autoplay failed on iPhone — so we
 * emit the element as literal markup to guarantee the attributes are there at parse
 * time. Static, trusted content (no user input) → dangerouslySetInnerHTML is safe.
 * If autoplay is still blocked (iOS Low Power Mode), the poster image shows.
 */
export default function HeroVideo() {
  return (
    <div
      className="absolute inset-0"
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html:
          '<video class="absolute inset-0 w-full h-full object-cover" autoplay muted loop playsinline webkit-playsinline disablepictureinpicture preload="auto" poster="/video/hero-poster.jpg">' +
          '<source src="/video/hero-loop.mp4" type="video/mp4" />' +
          "</video>",
      }}
    />
  );
}
