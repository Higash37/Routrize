"use client";

import dynamic from "next/dynamic";

const RouteBuilder = dynamic(
  () =>
    import("@/components/route-builder/route-builder").then((mod) => ({
      default: mod.RouteBuilder,
    })),
  { ssr: false },
);

export default function GuestRouteBuilderPage() {
  return <RouteBuilder />;
}
