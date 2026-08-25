import React from "react";
import Link from "next/link";
import {
  Layers,
  Volume2,
  Grid,
  Brush,
  Wrench,
  ShieldAlert,
  Building2,
  SquareStack,
  ArrowRight,
} from "lucide-react";

const CATEGORIES = [
  {
    name: "Drywall & Ceiling Boards",
    slug: "drywall-systems",
    icon: Layers,
    description:
      "Acoustic, fire, and moisture-resistant gypsum & cement boards.",
  },
  {
    name: "Insulation & Acoustics",
    slug: "insulation-acoustics",
    icon: Volume2,
    description: "Mineral wool, wood fiber, and certified acoustic batts.",
  },
  {
    name: "Metal Framing & Profiles",
    slug: "metal-framing",
    icon: Grid,
    description:
      "Galvanized steel studs, resilient channels, and ceiling tracks.",
  },
  {
    name: "Plasters & Joint Compounds",
    slug: "plasters-compounds",
    icon: Brush,
    description:
      "Ready-mix fillers, setting compounds, and reinforcement tapes.",
  },
  {
    name: "Fasteners & Fixings",
    slug: "fasteners-accessories",
    icon: Wrench,
    description:
      "Fine/tek drywall screws, concrete anchors, and acoustic hangers.",
  },
  {
    name: "Firestop & Safety Barriers",
    slug: "firestop-seals",
    icon: ShieldAlert,
    description: "Intumescent sealants, wraps, and certified fire collars.",
  },
  {
    name: "Exterior Facades & Sheathing",
    slug: "facade-weatherproofing",
    icon: Building2,
    description: "Cementitious boards, vapor membranes, and claddings.",
  },
  {
    name: "Acoustic Flooring & Underlays",
    slug: "flooring-underlay",
    icon: SquareStack,
    description: "Impact sound membranes and floating floor assemblies.",
  },
];

export function CategoryTicker() {
  return (
    <section
      id="categories-section"
      className="py-20 border-t border-zinc-200/80 bg-zinc-50/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950 mt-1">
              Core Material Categories
            </h2>
            <p className="text-sm text-zinc-500 mt-1.5 max-w-xl">
              Explore verified building assemblies and certified technical
              specifications across 8 distinct categories.
            </p>
          </div>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-white hover:bg-zinc-100 text-zinc-900 border border-zinc-200 shadow-2xs hover:border-zinc-300 transition-all group"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="h-4 w-4 text-zinc-500 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* 8-Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.slug}
                href={`/catalog?category=${cat.slug}`}
                className="group relative p-5 rounded-xl bg-white border border-zinc-200/90 shadow-2xs hover:shadow-md hover:border-amber-500/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-10 w-10 rounded-lg bg-zinc-100/90 border border-zinc-200/60 flex items-center justify-center text-zinc-700 group-hover:bg-amber-500 group-hover:text-white group-hover:border-amber-500 transition-all mb-3.5">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-amber-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-zinc-100 flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-zinc-900 transition-colors">
                  <span>View materials</span>
                  <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
