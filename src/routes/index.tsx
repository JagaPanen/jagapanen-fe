import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/marketing/LandingHome";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JagaPanen — Spoilage-Aware Agri-Logistics" },
      {
        name: "description",
        content:
          "Decision-support spoilage-aware untuk koperasi. Coba demo gratis atau buat akun organisasi.",
      },
    ],
  }),
  component: LandingPage,
});
