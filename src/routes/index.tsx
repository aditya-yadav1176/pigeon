import { createFileRoute } from "@tanstack/react-router";
import { PigeonExperience } from "@/components/pigeon/PigeonExperience";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PIGEON — Get it off your phone" },
      {
        name: "description",
        content:
          "Move a file from your phone to your laptop with one drop and one scan. No login or install.",
      },
      { property: "og:title", content: "PIGEON — Get it off your phone" },
      {
        property: "og:description",
        content: "Drop it. Scan it. Done. A fast temporary handoff between your phone and laptop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <PigeonExperience />;
}
