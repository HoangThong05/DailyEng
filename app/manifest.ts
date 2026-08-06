import type { MetadataRoute } from "next";

// Next tự phục vụ file này tại /manifest.webmanifest và chèn <link rel="manifest">.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DailyEng — Học tiếng Anh mỗi ngày",
    short_name: "DailyEng",
    description:
      "Học tiếng Anh mỗi ngày với flashcard từ vựng, quiz trắc nghiệm và luyện phát âm.",
    lang: "vi",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f7fb",
    theme_color: "#2563eb",
    categories: ["education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Học từ vựng", url: "/hoc" },
      { name: "Làm quiz", url: "/quiz" },
    ],
  };
}
