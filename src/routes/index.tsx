import { createFileRoute } from "@tanstack/react-router";
import { PigeonExperience } from "@/components/pigeon/PigeonExperience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PIGEON — Temporary, No-Login File Transfer" },
      {
        name: "description",
        content:
          "Temporary, no-login file handoff between phones and laptops. Drop a file, share a 5-character code, and download on any browser.",
      },
      { property: "og:site_name", content: "PIGEON" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://usepigeon.vercel.app/" },
      {
        property: "og:title",
        content: "PIGEON — Temporary, No-Login File Transfer",
      },
      {
        property: "og:description",
        content:
          "Temporary, no-login file handoff between phones and laptops. Drop a file, share a 5-character code, and download on any browser.",
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
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "627" },
      {
        property: "og:image:alt",
        content: "PIGEON — Temporary, no-login file transfer preview",
      },
      { property: "og:locale", content: "en_US" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "twitter:title",
        content: "PIGEON — Temporary, No-Login File Transfer",
      },
      {
        name: "twitter:description",
        content:
          "Temporary, no-login file handoff between phones and laptops. Drop a file, share a 5-character code, and download on any browser.",
      },
      {
        name: "twitter:image",
        content: "https://usepigeon.vercel.app/og-image.png",
      },
      {
        name: "twitter:image:alt",
        content: "PIGEON — Temporary, no-login file transfer preview",
      },
    ],
    links: [{ rel: "canonical", href: "https://usepigeon.vercel.app/" }],
  }),
  component: Index,
});

function Index() {
  return <PigeonExperience />;
}
