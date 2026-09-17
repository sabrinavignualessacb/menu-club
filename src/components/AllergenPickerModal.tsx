import React, { useState, useEffect, useRef } from 'react';
import { AllergenDef } from '../types';
import { OFFICIAL_ALLERGENS } from '../data/allergens';
import { X, Check, AlertCircle, Plus, Edit2, Trash2, Palette } from 'lucide-react';

interface AllergenPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAllergens: number[];
  customText?: string;
  onSave: (allergens: number[], customText?: string) => void;
  dishName?: string;
  allergensList?: AllergenDef[];
  onAddCustomAllergen?: (allergen: AllergenDef) => void;
  onUpdateAllergen?: (allergen: AllergenDef) => void;
  onDeleteCustomAllergen?: (number: number) => void;
}

const PRESET_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#64748b', // Slate
  '#854d0e', // Brown
];

export const AllergenPickerModal: React.FC<AllergenPickerModalProps> = ({
  isOpen,
  onClose,
  selectedAllergens,
  customText = '',
  onSave,
  dishName,
  allergensList = OFFICIAL_ALLERGENS,
  onAddCustomAllergen,
  onUpdateAllergen,
  onDeleteCustomAllergen,
}) => {
  const [currentSelected, setCurrentSelected] = useState<number[]>(selectedAllergens || []);
  const [text, setText] = useState(customText || '');

  // State for creating a new custom allergen
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newNumber, setNewNumber] = useState<number>(15);
  const [newShortName, setNewShortName] = useState('');
  const [newName, setNewName] = useState('');
  const [newBgHex, setNewBgHex] = useState(PRESET_COLORS[0]);

  // State for editing an allergen
  const [editingAllergen, setEditingAllergen] = useState<AllergenDef | null>(null);

  // Synchronize selection cleanly when opening the modal
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setCurrentSelected(selectedAllergens || []);
      setText(customText || '');
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, selectedAllergens, customText]);

  useEffect(() => {
    // Determine the next available allergen number
    const maxNum = Math.max(...allergensList.map((a) => a.number), 14);
    setNewNumber(maxNum + 1);
  }, [allergensList]);

  if (!isOpen) return null;

  const toggleAllergen = (num: number) => {
    if (currentSelected.includes(num)) {
      setCurrentSelected(currentSelected.filter((n) => n !== num));
    } else {
      setCurrentSelected([...currentSelected, num].sort((a, b) => a - b));
    }
  };

  const handleApply = () => {
    onSave(currentSelected, text.trim() ? text.trim() : undefined);
    onClose();
  };

  const handleCreateAllergenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShortName.trim()) return;

    const created: AllergenDef = {
      number: newNumber,
      shortName: newShortName.trim(),
      name: newName.trim() || newShortName.trim(),
      bgHex: newBgHex,
      textColor: '#ffffff',
      isCustom: true,
    };

    if (onAddCustomAllergen) {
      onAddCustomAllergen(created);
    }
    // Auto-select newly created allergen
    setCurrentSelected((prev) => [...prev, created.number]);
    setIsCreatingNew(false);
    setNewShortName('');
    setNewName('');
  };

  const handleEditAllergenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAllergen || !editingAllergen.shortName.trim()) return;

    if (onUpdateAllergen) {
      onUpdateAllergen(editingAllergen);
    }
    setEditingAllergen(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white/85 backdrop-blur-xl border border-white/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 bg-white/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shadow-2xs">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Gestion &amp; Personnalisation des Allergènes
              </h2>
              {dishName ? (
                <p className="text-xs text-slate-600 truncate max-w-sm">
                  Pour : <span className="text-amber-800 font-bold">{dishName}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-600">
                  Sélectionnez, personnalisez ou ajoutez vos propres allergènes
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-white/30">
          {/* Top action bar: Add allergen button */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-700">
              Cochez les allergènes présents dans ce plat :
            </p>
            <button
              type="button"
              onClick={() => {
                setIsCreatingNew(!isCreatingNew);
                setEditingAllergen(null);
              }}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-900 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isCreatingNew ? 'Fermer formulaire' : 'Ajouter un allergène'}</span>
            </button>
          </div>

          {/* Form to Create a New Allergen */}
          {isCreatingNew && (
            <form
              onSubmit={handleCreateAllergenSubmit}
              className="p-4 bg-white/90 border border-amber-500/40 rounded-xl space-y-3 animate-in fade-in shadow-md"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                Créer un nouvel allergène personnalisé
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-700 mb-1 font-semibold">Numéro</label>
                  <input
                    type="number"
                    min="1"
                    value={newNumber}
                    onChange={(e) => setNewNumber(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 shadow-2xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-700 mb-1 font-semibold">Nom court *</label>
                  <input
                    type="text"
                    placeholder="ex: Miel"
                    required
                    value={newShortName}
                    onChange={(e) => setNewShortName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 shadow-2xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-700 mb-1 font-semibold">Description / Précision</label>
                  <input
                    type="text"
                    placeholder="ex: Produits de la ruche"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 shadow-2xs font-medium"
                  />
                </div>
              </div>

              {/* Color Preset Palette */}
              <div>
                <label className="block text-[11px] text-slate-700 mb-1.5 flex items-center gap-1 font-semibold">
                  <Palette className="w-3 h-3 text-amber-700" />
                  Couleur du badge
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewBgHex(c)}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer shadow-xs ${
                        newBgHex === c ? 'ring-2 ring-slate-800 scale-110 shadow-md' : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={newBgHex}
                    onChange={(e) => setNewBgHex(e.target.value)}
                    className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-0"
                    title="Choisir une couleur sur mesure"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Enregistrer l&apos;allergène
                </button>
              </div>
            </form>
          )}

          {/* Form to Edit an Existing Allergen */}
          {editingAllergen && (
            <form
              onSubmit={handleEditAllergenSubmit}
              className="p-4 bg-white/90 border border-blue-500/40 rounded-xl space-y-3 animate-in fade-in shadow-md"
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5" />
                Modifier l&apos;allergène n°{editingAllergen.number} ({editingAllergen.shortName})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-700 mb-1 font-semibold">Nom affiché</label>
                  <input
                    type="text"
                    value={editingAllergen.shortName}
                    onChange={(e) =>
                      setEditingAllergen({ ...editingAllergen, shortName: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 shadow-2xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-700 mb-1 font-semibold">Description complète</label>
                  <input
                    type="text"
                    value={editingAllergen.name}
                    onChange={(e) =>
                      setEditingAllergen({ ...editingAllergen, name: e.target.value })
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 shadow-2xs font-medium"
                  />
                </div>
              </div>

              {/* Color Preset Palette */}
              <div>
                <label className="block text-[11px] text-slate-700 mb-1.5 flex items-center gap-1 font-semibold">
                  <Palette className="w-3 h-3 text-blue-700" />
                  Couleur du badge
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setEditingAllergen({ ...editingAllergen, bgHex: c })}
                      style={{ backgroundColor: c }}
                      className={`w-6 h-6 rounded-full transition-transform cursor-pointer shadow-xs ${
                        editingAllergen.bgHex === c
                          ? 'ring-2 ring-slate-800 scale-110 shadow-md'
                          : 'opacity-80 hover:opacity-100'
                      }`}
                    />
                  ))}
                  <input
                    type="color"
                    value={editingAllergen.bgHex}
                    onChange={(e) =>
                      setEditingAllergen({ ...editingAllergen, bgHex: e.target.value })
                    }
                    className="w-6 h-6 rounded-full cursor-pointer bg-transparent border-0"
                    title="Choisir une couleur sur mesure"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAllergen(null)}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs hover:bg-slate-200 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  Sauvegarder les modifications
                </button>
              </div>
            </form>
          )}

          {/* Allergens Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {allergensList.map((allergen) => {
              const isChecked = currentSelected.includes(allergen.number);
              return (
                <div
                  key={allergen.number}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isChecked
                      ? 'border-amber-500 bg-amber-50/80 text-slate-900 shadow-xs'
                      : 'border-white/80 bg-white/70 text-slate-700 hover:border-slate-300 hover:bg-white shadow-2xs'
                  }`}
                >
                  {/* Click area to toggle selection */}
                  <button
                    type="button"
                    onClick={() => toggleAllergen(allergen.number)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0 cursor-pointer"
                  >
                    {/* Colored Badge Number */}
                    <span
                      style={{ backgroundColor: allergen.bgHex }}
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-xs ring-1 ring-black/10"
                    >
                      {allergen.number}
                    </span>

                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold truncate text-slate-900">{allergen.shortName}</p>
                        {allergen.isCustom && (
                          <span className="text-[9px] px-1 bg-amber-200 text-amber-900 font-bold rounded">
                            perso
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{allergen.name}</p>
                    </div>

                    {isChecked && (
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mr-1 shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>

                  {/* Edit / Delete quick buttons */}
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingAllergen(allergen);
                        setIsCreatingNew(false);
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 cursor-pointer"
                      title="Personnaliser cet allergène"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>

                    {allergen.isCustom && onDeleteCustomAllergen && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCustomAllergen(allergen.number);
                          setCurrentSelected((prev) => prev.filter((n) => n !== allergen.number));
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-500 hover:text-red-600 cursor-pointer"
                        title="Supprimer cet allergène"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom text optional */}
          <div className="pt-2 border-t border-slate-200/80">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Précision ou texte personnalisé (optionnel)
            </label>
            <input
              type="text"
              placeholder="ex: Traces éventuelles de sésame"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-amber-500 shadow-2xs font-medium"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 bg-white/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrentSelected([])}
            className="text-xs text-slate-500 hover:text-red-600 transition-colors font-medium cursor-pointer"
          >
            Effacer tout
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer border border-slate-300"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md transition-colors cursor-pointer"
            >
              Valider ({currentSelected.length} sélectionné{currentSelected.length > 1 ? 's' : ''})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

