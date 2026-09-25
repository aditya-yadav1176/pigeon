import { createFileRoute } from "@tanstack/react-router";
import { PigeonExperience } from "@/components/pigeon/PigeonExperience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PIGEON — Get it off your phone" },
      {
        name: "description",
        content:
          "Drop it. Get a short code. Pick it up on your laptop or board. Fast temporary file handoff.",
      },
      { property: "og:site_name", content: "PIGEON" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://usepigeon.vercel.app/" },
      { property: "og:title", content: "PIGEON — Get it off your phone" },
      {
        property: "og:description",
        content:
          "Drop it. Get a short code. Pick it up on your laptop or board. Fast temporary file handoff.",
      },
      {
        property: "og:image",
        content: "https://usepigeon.vercel.app/og-image.png",
      },
      {
        property: "og:image:secure_url",
        content: "https://usepigeon.vercel.app/og-image.png",
      },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1471" },
      { property: "og:image:height", content: "862" },
      {
        property: "og:image:alt",
        content: "PIGEON — Get it off your phone",
      },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "PIGEON — Get it off your phone" },
      {
        name: "twitter:description",
        content:
          "Drop it. Get a short code. Pick it up on your laptop or board. Fast temporary file handoff.",
      },
      {
        name: "twitter:image",
        content: "https://usepigeon.vercel.app/og-image.png",
      },
      {
        name: "twitter:image:alt",
        content: "PIGEON — Get it off your phone",
      },
    ],
    links: [{ rel: "canonical", href: "https://usepigeon.vercel.app/" }],
  }),
  component: Index,
});

function Index() {
  return <PigeonExperience />;
}
