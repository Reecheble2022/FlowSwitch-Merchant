import { useEffect, useRef } from 'react';
import { MapPin, TrendingUp, Target, Navigation } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import type { AgentAIReport } from '../../types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ContextPanelProps {
  report: AgentAIReport | null;
}

export function ContextPanel({ report }: ContextPanelProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (report?.primaryCluster && mapContainerRef.current && !mapRef.current) {
      const map = L.map(mapContainerRef.current).setView(
        [report.primaryCluster.centroid.lat, report.primaryCluster.centroid.lng],
        13
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapRef.current = map;
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [report?.primaryCluster]);

  useEffect(() => {
    if (mapRef.current && report?.clusters) {
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polygon) {
          mapRef.current?.removeLayer(layer);
        }
      });

      report.clusters.forEach((cluster) => {
        cluster.points.forEach((point) => {
          L.marker([point.lat, point.lng])
            .addTo(mapRef.current!)
            .bindPopup(`Verified at ${new Date(point.timestamp).toLocaleString()}`);
        });
      });

      if (report.primaryCluster && report.primaryCluster.points.length >= 3) {
        const hull = convexHull(report.primaryCluster.points.map(p => [p.lat, p.lng]));
        L.polygon(hull, { color: '#00D66B', fillColor: '#00D66B', fillOpacity: 0.1 }).addTo(mapRef.current!);
      }
    }
  }, [report?.clusters]);

  if (!report) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Start a conversation to see location insights
          </p>
        </div>
      </div>
    );
  }

  const { summary, locationPhoto, locationBlurb, primaryCluster, clusters, outliers, movement } = report;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {summary.primaryLocation && (
        <Card className="overflow-hidden shadow-soft-lg border-slate-200/50 dark:border-slate-800/50">
          {locationPhoto && (
            <div className="relative h-48 overflow-hidden">
              <img
                src={locationPhoto.url}
                alt={locationPhoto.caption}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                <p className="text-white text-sm font-medium">{locationPhoto.caption}</p>
                <p className="text-white/70 text-xs mt-1">{locationPhoto.attribution}</p>
              </div>
            </div>
          )}

          <CardContent className="p-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-green" />
              Location Details
            </h3>

            {locationBlurb && (
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4 leading-relaxed">
                {locationBlurb.text}
              </p>
            )}

            <div className="space-y-2 text-sm">
              {summary.primaryLocation.townOrSuburb && (
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-500 w-20">Area:</span>
                  <span className="text-slate-900 dark:text-white font-medium">
                    {summary.primaryLocation.townOrSuburb}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-500 w-20">City:</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {summary.primaryLocation.city}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-500 w-20">Province:</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {summary.primaryLocation.provinceOrState}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-500 w-20">Country:</span>
                <span className="text-slate-900 dark:text-white font-medium">
                  {summary.primaryLocation.countryName}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-soft-lg border-slate-200/50 dark:border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-brand-cyan" />
            Quick Facts
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-brand-green/10 border border-brand-green/20">
            <div className="text-2xl font-bold text-brand-green mb-1">
              {summary.totalVerifications}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">📍 Verifications</div>
          </div>

          <div className="p-3 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20">
            <div className="text-2xl font-bold text-brand-cyan mb-1">{clusters.length}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">🧩 Clusters</div>
          </div>

          <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
            <div className="text-2xl font-bold text-warning mb-1">{outliers.length}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400">🚩 Outliers</div>
          </div>

          <div className="p-3 rounded-xl bg-brand-accent/10 border border-brand-accent/20">
            <div className="text-2xl font-bold text-brand-accent mb-1">
              {movement.lastMovementKm.toFixed(1)}km
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400">⏱️ Last move</div>
          </div>
        </CardContent>
      </Card>

      {primaryCluster && (
        <Card className="shadow-soft-lg border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-brand-accent" />
              Verification Map
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div ref={mapContainerRef} className="h-64 w-full" />
          </CardContent>
        </Card>
      )}

      {movement.totalDistanceKm > 0 && (
        <Card className="shadow-soft-lg border-slate-200/50 dark:border-slate-800/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-green" />
              Movement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total distance</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {movement.totalDistanceKm.toFixed(1)} km
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Last movement</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {movement.lastMovementKm.toFixed(1)} km
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function convexHull(points: [number, number][]): [number, number][] {
  if (points.length < 3) return points;

  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const cross = (o: [number, number], a: [number, number], b: [number, number]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: [number, number][] = [];
  for (let i = sorted.length - 1; i >= 0; i--) {
    const p = sorted[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}
