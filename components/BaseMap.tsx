"use client";
import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, Point } from "geojson";

//kotak manggarai
const POLYGON = {
  type: "Polygon",
  coordinates: [
    [
      [106.845, -6.2144],
      [106.855, -6.2144],
      [106.855, -6.2044],
      [106.845, -6.2044],
      [106.845, -6.2144],
    ],
  ],
};

const SOURCE_ID = "activities";
const LAYER_ID = "activities-circle";

type Activity = {
  _id?: string;
  title?: string;
  description?: string;
  geometry: Point;
  medias?: string[];
  total_comment?: number;
  created_at?: string;
  likes?: unknown[];
  user_name?: string;
  community_name?: string;
  community_description?: string;
};

const esc = (v: unknown) =>
  String(v ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!
  );

export default function BaseMap() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style:
        "https://v2.basemap.mapid.io/styles/street-v2.0/style.json?key=6a3255374eed59093aba9c32",
      center: [106.85, -6.2094],
      zoom: 15,
    });

    let dataPromise: Promise<FeatureCollection<Point>> | null = null;
    let added = false;
    let cancelled = false; 

    const loadData = () => {
      if (!dataPromise) {
        dataPromise = fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feature: POLYGON }),
        })
          .then((res) => res.json())
          .then((json) => {
            const activities: Activity[] = json?.data?.activities ?? [];

            const features: Feature<Point>[] = activities.map((a) => ({
              type: "Feature",
              geometry: a.geometry,
              properties: {
                _id: a._id ?? "",
                title: a.title ?? "",
                description: a.description ?? "",
                user_name: a.user_name ?? "",
                community_name: a.community_name ?? "",
                community_description: a.community_description ?? "",
                created_at: a.created_at ?? "",
                total_comment: a.total_comment ?? 0,
                likes_count: a.likes?.length ?? 0,
                medias: JSON.stringify(a.medias ?? []),
              },
            }));

            return {
              type: "FeatureCollection",
              features,
            } as FeatureCollection<Point>;
          });
      }
      return dataPromise;
    };

    const tryAdd = async () => {
      if (added || cancelled) return;
      const data = await loadData();
      if (added || cancelled || map.getSource(SOURCE_ID)) return;

      try {
        map.addSource(SOURCE_ID, { type: "geojson", data });
        map.addLayer({
          id: LAYER_ID,
          type: "circle",
          source: SOURCE_ID,
          paint: {
            "circle-radius": 7,
            "circle-color": "#e11d48",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });
        added = true;
      } catch {
        return; 
      }

      // Arahkan peta supaya semua titik masuk layar.
      if (data.features.length > 0) {
        const bounds = new maplibregl.LngLatBounds();
        for (const f of data.features) {
          bounds.extend(f.geometry.coordinates as [number, number]);
        }
        map.fitBounds(bounds, { padding: 60, maxZoom: 17 });
      }

      map.on("click", LAYER_ID, (e) => {
        const f = e.features?.[0];
        if (!f) return;

        const p = f.properties ?? {};
        const coords = (f.geometry as Point).coordinates as [number, number];

        // medias tersimpan sebagai string JSON - kembalikan jadi array.
        let medias: string[] = [];
        try {
          medias = JSON.parse(p.medias || "[]");
        } catch {
          medias = [];
        }

        const foto = medias
          .map(
            (src) =>
              `<img src="${esc(src)}" alt="" style="width:100%;border-radius:6px;margin-top:6px" />`
          )
          .join("");

        const baris = (label: string, isi: unknown) =>
          `<tr><td style="padding:2px 8px 2px 0;color:#666;vertical-align:top;white-space:nowrap">${label}</td>
           <td style="padding:2px 0;word-break:break-word">${esc(isi)}</td></tr>`;

        const html = `
          <div style="font-family:system-ui,sans-serif;font-size:12px;max-height:60vh;overflow-y:auto">
            <div style="font-weight:600;font-size:14px;margin-bottom:6px">
              ${esc(p.title) || "(tanpa judul)"}
            </div>
            <div style="margin-bottom:8px;line-height:1.5">${esc(p.description)}</div>
            <table style="border-collapse:collapse;width:100%">
              ${baris("Pengguna", p.user_name)}
              ${baris("Komunitas", p.community_name)}
              ${baris("Deskripsi komunitas", p.community_description)}
              ${baris("Dibuat", p.created_at)}
              ${baris("Komentar", p.total_comment)}
              ${baris("Likes", p.likes_count)}
              ${baris("Koordinat", `${coords[0].toFixed(6)}, ${coords[1].toFixed(6)}`)}
              ${baris("ID", p._id)}
            </table>
            ${foto}
          </div>`;

        new maplibregl.Popup({ maxWidth: "320px" })
          .setLngLat(coords)
          .setHTML(html)
          .addTo(map);
      });

      map.on("mouseenter", LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });
    };

    map.on("styledata", tryAdd);
    tryAdd();

    return () => {
      cancelled = true;
      map.remove();
    };
  }, []);

  return <div ref={containerRef} style={{ height: "100%" }} />;
}