import Link from "next/link";
import {
  ArrowRight,
  Bot,
  MapPin,
  Route,
  TrafficCone,
} from "lucide-react";

const features = [
  {
    title: "Journey Planner",
    description:
      "Explore journey options, maps, transport modes and route details across Lagos.",
    href: "/journeys",
    icon: Route,
    status: "Available",
  },
  {
    title: "Traffic Reports",
    description:
      "Explore reported road incidents and traffic conditions.",
    href: "/reports",
    icon: TrafficCone,
    status: "Coming next",
  },
  {
    title: "AI Travel Assistant",
    description:
      "Ask questions about routes, transport and journey planning.",
    href: "/assistant",
    icon: Bot,
    status: "Coming next",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen km-background">
      

      <div className="mx-auto max-w-7xl px-5 py-16">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-800 bg-emerald-950/50 px-4 py-2 text-sm text-emerald-300">
            <MapPin size={16} />
            Built for moving around Lagos
          </div>

          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Move smarter.
            <span className="block text-emerald-400">
              Explore Lagos.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 km-muted">
            KILOMETER brings journey planning, public transport
            options and road information together in one place.
            Explore our MVP journey planner and discover the
            routes around you.
          </p>

          <Link
            href="/journeys"
            className="mt-8 inline-flex items-center gap-3 rounded-xl bg-emerald-500 px-6 py-4 font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Plan a journey
            <ArrowRight size={20} />
          </Link>
        </div>

        <section className="mt-20">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              Everything for your journey
            </h2>
            <p className="mt-2 km-muted">
              A simpler way to explore transport across Lagos.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-emerald-950 km-surface p-6"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="rounded-xl bg-emerald-950 p-3 text-emerald-400">
                      <Icon size={24} />
                    </div>
                    <span className="text-xs text-emerald-300">
                      {feature.status}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-semibold">
                    {feature.title}
                  </h3>

                  <p className="mt-3 min-h-20 text-sm leading-6 km-muted">
                    {feature.description}
                  </p>

                  {feature.status === "Available" ? (
                    <Link
                      href={feature.href}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      Explore feature
                      <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <span className="mt-5 inline-block text-sm km-muted">
                      Feature in development
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
