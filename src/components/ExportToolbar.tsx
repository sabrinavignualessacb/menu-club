import React, { useState } from 'react';
import { Download, Archive, Loader2, SlidersHorizontal, CheckCircle2 } from 'lucide-react';
import { ExportProgress, ExportResolution } from '../utils/exportImage';

interface ExportToolbarProps {
  onExportCurrent: (resolution: ExportResolution) => Promise<void>;
  onExportAll: (resolution: ExportResolution) => Promise<void>;
  isExporting: boolean;
  exportProgress: ExportProgress | null;
  activeTabLabel: string;
}

export const ExportToolbar: React.FC<ExportToolbarProps> = ({
  onExportCurrent,
  onExportAll,
  isExporting,
  exportProgress,
  activeTabLabel,
}) => {
  const [resolution, setResolution] = useState<ExportResolution>(1080);
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="bg-white/45 backdrop-blur-md border border-white/60 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 text-slate-800">
      {/* Left info */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-700 shadow-2xs">
          <Download className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Export PNG Haute Fidélité
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 text-[10px] font-bold border border-emerald-500/30">
              {resolution} &times; {resolution} px
            </span>
          </h4>
          <p className="text-xs text-slate-600">
            Format carré 1:1 idéal pour Instagram, réseaux, emails, affichage & impression
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Resolution selector button */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-2 bg-white/70 hover:bg-white text-slate-800 border border-white/80 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            title="Changer la résolution d'export"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Format :</span> {resolution}&times;{resolution}
          </button>

          {showSettings && (
            <div className="absolute right-0 bottom-full mb-2 w-56 bg-white/95 backdrop-blur-xl border border-white/90 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in text-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-500 px-2 py-1 block">
                Format &amp; Résolution de sortie
              </span>
              <button
                onClick={() => {
                  setResolution(500);
                  setShowSettings(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  resolution === 500 ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold">500 &times; 500 px</div>
                  <div className="text-[10px] opacity-80">Format Web / Vignette léger</div>
                </div>
                {resolution === 500 && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setResolution(1080);
                  setShowSettings(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  resolution === 1080 ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold">1080 &times; 1080 px</div>
                  <div className="text-[10px] opacity-80">Standard HD Réseaux Sociaux</div>
                </div>
                {resolution === 1080 && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setResolution(1440);
                  setShowSettings(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  resolution === 1440 ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold">1440 &times; 1440 px</div>
                  <div className="text-[10px] opacity-80">2K QHD Haute Qualité</div>
                </div>
                {resolution === 1440 && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setResolution(2160);
                  setShowSettings(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                  resolution === 2160 ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div>
                  <div className="font-bold">2160 &times; 2160 px</div>
                  <div className="text-[10px] opacity-80">4K Ultra HD &amp; Impression</div>
                </div>
                {resolution === 2160 && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Export Current Page Button */}
        <button
          onClick={() => onExportCurrent(resolution)}
          disabled={isExporting}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 cursor-pointer"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          <span>Exporter {activeTabLabel} ({resolution}p)</span>
        </button>

        {/* Export ALL 6 Pages (ZIP) Button */}
        <button
          onClick={() => onExportAll(resolution)}
          disabled={isExporting}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-extrabold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          {isExporting ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
          ) : (
            <Archive className="w-4 h-4 text-slate-950" />
          )}
          <span>Tout exporter ({resolution}p ZIP)</span>
        </button>
      </div>

      {/* Export progress modal overlay */}
      {isExporting && exportProgress && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-xl border border-white/80 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl animate-in zoom-in-95 text-slate-800">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Génération des PNG en cours...</h3>
              <p className="text-xs text-slate-600 mt-1">{exportProgress.label}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 to-amber-500 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${(exportProgress.current / exportProgress.total) * 100}%`,
                }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-500 font-semibold">
              <span>Résolution {resolution}&times;{resolution}px</span>
              <span>
                {exportProgress.current} / {exportProgress.total}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

