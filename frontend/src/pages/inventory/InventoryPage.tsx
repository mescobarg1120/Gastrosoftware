import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sidebar } from '../../components/layout/Sidebar';
import { Header } from '../../components/layout/Header';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import type {
  ProductResponse,
  RawMaterialResponse,
  CreateProductRequest,
  UpdateProductRequest,
  Category,
  IntermediateStockResponse,
  ProductionRequest,
  RecipeResponse,
  RecipeItemResponse,
  CreateRecipeRequest,
  CreateRecipeItemRequest,
  CreateRawMaterialRequest,
  UpdateRawMaterialRequest,
  AdjustStockRequest,
} from '../../types';

/* ───── Form defaults ───── */
const emptyProductForm = { name: '', productType: 'PREPARED', price: '', categoryId: '', description: '' };
const emptyRecipeForm = { name: '', size: '', isIntermediate: false, yieldQty: '', yieldUnit: '' };
const emptyIngredientForm = { ingredientType: 'RAW', materialId: '', subRecipeId: '', quantityRequired: '', unit: '' };
const emptyMaterialForm = { name: '', unit: 'kg', stockQty: '', minStock: '', avgUnitCost: '' };
const emptyAdjustForm = { type: 'ENTRADA', quantity: '', reason: '' };

/* ───── ProductTable ───── */
function ProductTable({ products, onToggle, onViewRecipes, onEdit, loading }: {
  products: ProductResponse[]; onToggle: (id: number) => void;
  onViewRecipes: (p: ProductResponse) => void; onEdit: (p: ProductResponse) => void; loading: boolean;
}) {
  if (loading) return <p className="text-center text-muted-foreground py-8">Cargando productos...</p>;
  if (!products.length) return <p className="text-center text-muted-foreground py-8">No hay productos</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-slate-700 text-left text-muted-foreground">
          <th className="py-3 px-4 font-medium">Nombre</th>
          <th className="py-3 px-4 font-medium">Tipo</th>
          <th className="py-3 px-4 font-medium">Precio</th>
          <th className="py-3 px-4 font-medium">Categoría</th>
          <th className="py-3 px-4 font-medium">Disponible</th>
          <th className="py-3 px-4 font-medium">Acción</th>
        </tr></thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/50">
              <td className="py-3 px-4 text-foreground font-medium">{p.name}</td>
              <td className="py-3 px-4 text-muted-foreground">{p.productType}</td>
              <td className="py-3 px-4 text-foreground">${p.price.toLocaleString()}</td>
              <td className="py-3 px-4 text-muted-foreground">{p.categoryName}</td>
              <td className="py-3 px-4"><Badge variant={p.available ? 'default' : 'secondary'}>{p.available ? 'Sí' : 'No'}</Badge></td>
              <td className="py-3 px-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(p)}>Editar</Button>
                <Button size="sm" variant="outline" onClick={() => onViewRecipes(p)}>Ver recetas</Button>
                <Button size="sm" variant="outline" onClick={() => onToggle(p.id)}>{p.available ? 'Desactivar' : 'Activar'}</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ───── IntermediateTable ───── */
function IntermediateTable({ items, onViewIngredients, loading }: {
  items: IntermediateStockResponse[];
  onViewIngredients: (item: IntermediateStockResponse) => void;
  loading: boolean;
}) {
  if (loading) return <p className="text-center text-muted-foreground py-8">Cargando pre-elaboraciones...</p>;
  if (!items.length) return <p className="text-center text-muted-foreground py-8">No hay pre-elaboraciones</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-slate-700 text-left text-muted-foreground">
          <th className="py-3 px-4 font-medium">Nombre receta</th>
          <th className="py-3 px-4 font-medium">Stock actual</th>
          <th className="py-3 px-4 font-medium">Unidad</th>
          <th className="py-3 px-4 font-medium">Última producción</th>
          <th className="py-3 px-4 font-medium">Acción</th>
        </tr></thead>
        <tbody>
          {items.map((item) => {
            const lowStock = item.stockQty < 10;
            return (
              <tr key={item.id ?? item.recipeId} className={`border-b border-slate-800 hover:bg-slate-800/50 ${lowStock ? 'bg-yellow-900/20' : ''}`}>
                <td className={`py-3 px-4 font-medium ${lowStock ? 'text-yellow-300' : 'text-foreground'}`}>{item.recipeName}</td>
                <td className={`py-3 px-4 ${lowStock ? 'text-yellow-300 font-semibold' : 'text-foreground'}`}>{Number(item.stockQty).toFixed(2)}</td>
                <td className="py-3 px-4 text-muted-foreground">{item.unit}</td>
                <td className="py-3 px-4 text-muted-foreground">{item.lastProducedAt ? new Date(item.lastProducedAt).toLocaleString() : '—'}</td>
                <td className="py-3 px-4">
                  <Button size="sm" variant="outline" onClick={() => onViewIngredients(item)}>Ver ingredientes</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ───── RawMaterialTable ───── */
function RawMaterialTable({ materials, onEdit, onAdjustStock, loading }: {
  materials: RawMaterialResponse[];
  onEdit: (m: RawMaterialResponse) => void;
  onAdjustStock: (m: RawMaterialResponse) => void;
  loading: boolean;
}) {
  if (loading) return <p className="text-center text-muted-foreground py-8">Cargando materias primas...</p>;
  if (!materials.length) return <p className="text-center text-muted-foreground py-8">No hay materias primas</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-slate-700 text-left text-muted-foreground">
          <th className="py-3 px-4 font-medium">Nombre</th>
          <th className="py-3 px-4 font-medium">Unidad</th>
          <th className="py-3 px-4 font-medium">Stock actual</th>
          <th className="py-3 px-4 font-medium">Stock mínimo</th>
          <th className="py-3 px-4 font-medium">Costo promedio</th>
          <th className="py-3 px-4 font-medium">Acción</th>
        </tr></thead>
        <tbody>
          {materials.map((m) => {
            const lowStock = m.stockQty < m.minStock;
            return (
              <tr key={m.id} className={`border-b border-slate-800 hover:bg-slate-800/50 ${lowStock ? 'bg-red-900/20' : ''}`}>
                <td className={`py-3 px-4 font-medium ${lowStock ? 'text-red-300' : 'text-foreground'}`}>{m.name}</td>
                <td className="py-3 px-4 text-muted-foreground">{m.unit}</td>
                <td className={`py-3 px-4 ${lowStock ? 'text-red-300 font-semibold' : 'text-foreground'}`}>{Number(m.stockQty).toFixed(2)}</td>
                <td className="py-3 px-4 text-muted-foreground">{Number(m.minStock).toFixed(2)}</td>
                <td className="py-3 px-4 text-foreground">${Number(m.avgUnitCost).toFixed(2)}</td>
                <td className="py-3 px-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(m)}>Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => onAdjustStock(m)}>Ajustar stock</Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ───── IngredientListModal ───── */
function IngredientListModal({ recipeId, recipeName, intermediates, rawMaterials, open, onOpenChange }: {
  recipeId: number; recipeName: string;
  intermediates: RecipeResponse[]; rawMaterials: RawMaterialResponse[];
  open: boolean; onOpenChange: (v: boolean) => void;
}) {
  const [items, setItems] = useState<RecipeItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyIngredientForm);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/recipes/${recipeId}`);
      const recipe: RecipeResponse = res.data;
      setItems(recipe.items ?? []);
    } catch { setItems([]); } finally { setLoading(false); }
  };

  useEffect(() => { if (open) fetchItems(); }, [open, recipeId]);

  const handleAdd = async () => {
    if (!form.quantityRequired || !form.unit) return;
    setSubmitting(true);
    try {
      const body: CreateRecipeItemRequest = {
        ingredientType: form.ingredientType,
        quantityRequired: Number(form.quantityRequired),
        unit: form.unit,
      };
      if (form.ingredientType === 'RAW') body.materialId = Number(form.materialId);
      else body.subRecipeId = Number(form.subRecipeId);
      await api.post(`/api/recipes/${recipeId}/items`, body);
      setAdding(false);
      setForm(emptyIngredientForm);
      fetchItems();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  const handleRemove = async (itemId: number) => {
    try { await api.delete(`/api/recipes/${recipeId}/items/${itemId}`); fetchItems(); }
    catch (err) { console.error(err); }
  };

  const handleEditQty = async (itemId: number) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;
      await api.post(`/api/recipes/${recipeId}/items`, {
        ingredientType: item.ingredientType,
        materialId: item.ingredientType === 'RAW' ? item.materialId : undefined,
        subRecipeId: item.ingredientType === 'INTERMEDIATE' ? item.subRecipeId : undefined,
        quantityRequired: Number(editQty),
        unit: item.unit,
      });
      await api.delete(`/api/recipes/${recipeId}/items/${itemId}`);
      setEditingId(null);
      fetchItems();
    } catch (err) { console.error(err); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card text-foreground max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Ingredientes — {recipeName}</DialogTitle></DialogHeader>
        {loading ? <p className="text-center text-muted-foreground py-4">Cargando...</p> : (
          <div className="space-y-3">
            {items.length === 0 && <p className="text-center text-muted-foreground py-4">Sin ingredientes</p>}
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-slate-800 rounded p-3 border border-slate-700">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-foreground font-medium">{item.materialName ?? item.subRecipeName}</span>
                    <Badge className={`text-[10px] border-0 ${item.ingredientType === 'RAW' ? 'bg-blue-600' : 'bg-purple-600'} text-white`}>
                      {item.ingredientType === 'RAW' ? 'MP' : 'PRE'}
                    </Badge>
                  </div>
                  {editingId === item.id ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input type="number" className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-foreground" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
                      <span className="text-xs text-muted-foreground">{item.unit}</span>
                      <Button size="xs" onClick={() => handleEditQty(item.id)}>OK</Button>
                      <Button size="xs" variant="outline" onClick={() => setEditingId(null)}>X</Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-0.5">{Number(item.quantity).toFixed(2)} {item.unit}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button size="xs" variant="ghost" onClick={() => { setEditingId(item.id); setEditQty(String(item.quantity)); }}>Editar</Button>
                  <Button size="xs" variant="ghost" className="text-red-400" onClick={() => handleRemove(item.id)}>Eliminar</Button>
                </div>
              </div>
            ))}
            {adding ? (
              <div className="bg-slate-800 rounded p-3 border border-slate-700 space-y-2">
                <h4 className="text-xs font-semibold text-foreground">Agregar ingrediente</h4>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Tipo</label>
                  <select className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={form.ingredientType} onChange={(e) => setForm({ ...form, ingredientType: e.target.value })}>
                    <option value="RAW">Materia prima</option>
                    <option value="INTERMEDIATE">Pre-elaboración</option>
                  </select>
                </div>
                {form.ingredientType === 'RAW' ? (
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Materia prima</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={form.materialId} onChange={(e) => setForm({ ...form, materialId: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {rawMaterials.map((rm) => (<option key={rm.id} value={rm.id}>{rm.name}</option>))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Pre-elaboración</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={form.subRecipeId} onChange={(e) => setForm({ ...form, subRecipeId: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {intermediates.filter((r) => r.id !== recipeId).map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}
                    </select>
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">Cantidad</label>
                    <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={form.quantityRequired} onChange={(e) => setForm({ ...form, quantityRequired: e.target.value })} />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-muted-foreground mb-1">Unidad</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="lt">lt</option>
                      <option value="ml">ml</option>
                      <option value="unidad">unidad</option>
                      <option value="bollo">bollo</option>
                      <option value="pizca">pizca</option>
                      <option value="taza">taza</option>
                      <option value="cucharada">cucharada</option>
                      <option value="cucharadita">cucharadita</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => { setAdding(false); setForm(emptyIngredientForm); }}>Cancelar</Button>
                  <Button size="sm" onClick={handleAdd} disabled={submitting}>{submitting ? '...' : 'Agregar'}</Button>
                </div>
              </div>
            ) : (
              <Button size="sm" className="w-full" onClick={() => setAdding(true)}>Agregar ingrediente</Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ───── RecipesModal ───── */
function RecipesModal({ product, open, onOpenChange, rawMaterials, intermediates }: {
  product: ProductResponse; open: boolean; onOpenChange: (v: boolean) => void;
  rawMaterials: RawMaterialResponse[]; intermediates: RecipeResponse[];
}) {
  const [recipes, setRecipes] = useState<RecipeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(emptyRecipeForm);
  const [submitting, setSubmitting] = useState(false);
  const [addingFor, setAddingFor] = useState<number | null>(null);
  const [ingForm, setIngForm] = useState(emptyIngredientForm);
  const [ingSubmitting, setIngSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editQty, setEditQty] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/recipes/product/${product.id}`);
      setRecipes(res.data ?? []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { if (open) fetch(); }, [open, product.id]);

  const handleCreate = async () => {
    if (!form.name) return;
    setSubmitting(true);
    try {
      await api.post('/api/recipes', {
        productId: product.id, name: form.name, size: form.size || undefined,
        isIntermediate: form.isIntermediate, yieldQty: form.yieldQty ? Number(form.yieldQty) : undefined,
        yieldUnit: form.yieldUnit || undefined,
      } as CreateRecipeRequest);
      setShowNew(false); setForm(emptyRecipeForm); fetch();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };

  const handleAddIng = async (recipeId: number) => {
    if (!ingForm.quantityRequired || !ingForm.unit) return;
    setIngSubmitting(true);
    try {
      const body: CreateRecipeItemRequest = { ingredientType: ingForm.ingredientType, quantityRequired: Number(ingForm.quantityRequired), unit: ingForm.unit };
      if (ingForm.ingredientType === 'RAW') body.materialId = Number(ingForm.materialId);
      else body.subRecipeId = Number(ingForm.subRecipeId);
      await api.post(`/api/recipes/${recipeId}/items`, body);
      setAddingFor(null); setIngForm(emptyIngredientForm); fetch();
    } catch (err) { console.error(err); } finally { setIngSubmitting(false); }
  };

  const handleRemoveIng = async (recipeId: number, itemId: number) => {
    try { await api.delete(`/api/recipes/${recipeId}/items/${itemId}`); fetch(); }
    catch (err) { console.error(err); }
  };

  const handleEditIng = async (recipeId: number, itemId: number) => {
    try {
      const item = recipes.find(r => r.id === recipeId)?.items.find(i => i.id === itemId);
      if (!item) return;
      await api.post(`/api/recipes/${recipeId}/items`, {
        ingredientType: item.ingredientType,
        materialId: item.ingredientType === 'RAW' ? item.materialId : undefined,
        subRecipeId: item.ingredientType === 'INTERMEDIATE' ? item.subRecipeId : undefined,
        quantityRequired: Number(editQty),
        unit: item.unit,
      });
      await api.delete(`/api/recipes/${recipeId}/items/${itemId}`);
      setEditingId(null); fetch();
    } catch (err) { console.error(err); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl bg-card text-foreground max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Recetas de {product.name}</DialogTitle></DialogHeader>
        {loading ? <p className="text-center text-muted-foreground py-4">Cargando...</p> : (
          <div className="space-y-4">
            <div className="flex justify-end"><Button size="sm" onClick={() => setShowNew(true)}>Nueva receta</Button></div>
            {showNew && (
              <div className="bg-slate-800 rounded-lg p-4 space-y-3 border border-slate-700">
                <h4 className="text-sm font-semibold">Nueva receta</h4>
                <div><label className="block text-xs text-muted-foreground mb-1">Nombre</label><input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div><label className="block text-xs text-muted-foreground mb-1">Tamaño</label><input className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} placeholder="PERSONAL, FAMILIAR..." /></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isIntermediate} onChange={(e) => setForm({ ...form, isIntermediate: e.target.checked })} className="accent-blue-600" /> Es pre-elaboración</label>
                <div className="flex gap-3">
                  <div className="flex-1"><label className="block text-xs text-muted-foreground mb-1">Rendimiento cantidad</label><input type="number" className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={form.yieldQty} onChange={(e) => setForm({ ...form, yieldQty: e.target.value })} /></div>
                    <div className="flex-1"><label className="block text-xs text-muted-foreground mb-1">Rendimiento unidad</label><select className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={form.yieldUnit} onChange={(e) => setForm({ ...form, yieldUnit: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="lt">lt</option>
                      <option value="ml">ml</option>
                      <option value="unidad">unidad</option>
                      <option value="bollo">bollo</option>
                      <option value="pizca">pizca</option>
                      <option value="taza">taza</option>
                      <option value="cucharada">cucharada</option>
                      <option value="cucharadita">cucharadita</option>
                    </select></div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => { setShowNew(false); setForm(emptyRecipeForm); }}>Cancelar</Button>
                  <Button size="sm" onClick={handleCreate} disabled={submitting}>{submitting ? '...' : 'Guardar'}</Button>
                </div>
              </div>
            )}
            {recipes.length === 0 ? <p className="text-center text-muted-foreground py-4">Sin recetas</p> : recipes.map((r) => (
              <div key={r.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{r.name}</h4>
                    <p className="text-xs text-muted-foreground">{r.size && `${r.size} · `}{r.isIntermediate ? 'Pre-elaboración' : 'Receta final'}{r.yieldQty && ` · Rinde: ${r.yieldQty}${r.yieldUnit ? ` ${r.yieldUnit}` : ''}`}</p>
                  </div>
                </div>
                {r.items.length > 0 && (
                  <div className="space-y-1">
                    {r.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs bg-slate-900 rounded px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-[10px] border-0 ${item.ingredientType === 'RAW' ? 'bg-blue-600' : 'bg-purple-600'} text-white`}>{item.ingredientType === 'RAW' ? 'MP' : 'PRE'}</Badge>
                          <span className="text-foreground">{item.materialName ?? item.subRecipeName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {editingId === item.id ? (
                            <><input type="number" className="w-16 bg-slate-800 border border-slate-700 rounded px-1 py-0.5 text-xs text-foreground" value={editQty} onChange={(e) => setEditQty(e.target.value)} />
                              <button className="text-green-400" onClick={() => handleEditIng(r.id, item.id)}>OK</button>
                              <button className="text-muted-foreground" onClick={() => setEditingId(null)}>X</button></>
                          ) : (
                            <><span className="text-muted-foreground">{Number(item.quantity).toFixed(2)} {item.unit}</span>
                              <button className="text-blue-400 hover:text-blue-300" onClick={() => { setEditingId(item.id); setEditQty(String(item.quantity)); }}>Editar</button></>
                          )}
                          <button className="text-red-400 hover:text-red-300" onClick={() => handleRemoveIng(r.id, item.id)}>Eliminar</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {addingFor === r.id ? (
                  <div className="bg-slate-900 rounded p-3 space-y-2">
                    <h5 className="text-xs font-semibold">Agregar ingrediente</h5>
                    <div><label className="block text-xs text-muted-foreground mb-1">Tipo</label>
                      <select className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={ingForm.ingredientType} onChange={(e) => { const v = e.target.value; setIngForm({ ...ingForm, ingredientType: v, unit: v === 'RAW' ? '' : ingForm.unit, subRecipeId: v === 'RAW' ? '' : ingForm.subRecipeId, materialId: v === 'INTERMEDIATE' ? '' : ingForm.materialId }); }}>
                        <option value="RAW">Materia prima</option><option value="INTERMEDIATE">Pre-elaboración</option>
                      </select></div>
                    {ingForm.ingredientType === 'RAW' ? (
                      <div><label className="block text-xs text-muted-foreground mb-1">Materia prima</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={ingForm.materialId} onChange={(e) => setIngForm({ ...ingForm, materialId: e.target.value })}>
                          <option value="">Seleccionar...</option>{rawMaterials.map((rm) => (<option key={rm.id} value={rm.id}>{rm.name}</option>))}
                        </select></div>
                    ) : (
                      <div><label className="block text-xs text-muted-foreground mb-1">Pre-elaboración</label>
                        <select className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={ingForm.subRecipeId} onChange={(e) => { const v = e.target.value; const recipe = intermediates.find((x) => x.id === Number(v)); setIngForm({ ...ingForm, subRecipeId: v, unit: recipe ? recipe.yieldUnit : '' }); }}>
                          <option value="">Seleccionar...</option>{intermediates.filter((x) => x.id !== r.id).map((x) => (<option key={x.id} value={x.id}>{x.name}</option>))}
                        </select></div>
                    )}
                    <div className="flex gap-3">
                      <div className="flex-1"><label className="block text-xs text-muted-foreground mb-1">Cantidad</label><input type="number" className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={ingForm.quantityRequired} onChange={(e) => setIngForm({ ...ingForm, quantityRequired: e.target.value })} /></div>
                      <div className="flex-1"><label className="block text-xs text-muted-foreground mb-1">Unidad</label><select disabled={ingForm.ingredientType === 'INTERMEDIATE'} className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-foreground" value={ingForm.unit} onChange={(e) => setIngForm({ ...ingForm, unit: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="lt">lt</option>
                      <option value="ml">ml</option>
                      <option value="unidad">unidad</option>
                      <option value="bollo">bollo</option>
                      <option value="pizca">pizca</option>
                      <option value="taza">taza</option>
                      <option value="cucharada">cucharada</option>
                      <option value="cucharadita">cucharadita</option>
                    </select></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" variant="outline" onClick={() => { setAddingFor(null); setIngForm(emptyIngredientForm); }}>Cancelar</Button>
                      <Button size="sm" onClick={() => handleAddIng(r.id)} disabled={ingSubmitting}>{ingSubmitting ? '...' : 'Agregar'}</Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="text-xs" onClick={() => { setAddingFor(r.id); setIngForm(emptyIngredientForm); }}>Agregar ingrediente</Button>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ───── Main Page ───── */
export default function InventoryPage() {
  const { employee } = useAuthStore();
  const [tab, setTab] = useState<'products' | 'intermediates' | 'materials'>('products');
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [materials, setMaterials] = useState<RawMaterialResponse[]>([]);
  const [intermediates, setIntermediates] = useState<IntermediateStockResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [intermediateRecipes, setIntermediateRecipes] = useState<RecipeResponse[]>([]);

  /* Product form */
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [submitting, setSubmitting] = useState(false);

  /* Edit product */
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductResponse | null>(null);
  const [editProductForm, setEditProductForm] = useState(emptyProductForm);
  const [editProductSubmitting, setEditProductSubmitting] = useState(false);

  /* Production form */
  const [productionDialogOpen, setProductionDialogOpen] = useState(false);
  const [productionRecipeId, setProductionRecipeId] = useState('');
  const [productionQty, setProductionQty] = useState('');
  const [submittingProduction, setSubmittingProduction] = useState(false);

  /* Material forms */
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [materialForm, setMaterialForm] = useState(emptyMaterialForm);
  const [materialSubmitting, setMaterialSubmitting] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterialResponse | null>(null);
  const [editMaterialForm, setEditMaterialForm] = useState(emptyMaterialForm);
  const [editMaterialOpen, setEditMaterialOpen] = useState(false);
  const [editMaterialSubmitting, setEditMaterialSubmitting] = useState(false);
  const [adjustMaterial, setAdjustMaterial] = useState<RawMaterialResponse | null>(null);
  const [adjustForm, setAdjustForm] = useState(emptyAdjustForm);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  /* Intermediate forms */
  const [newIntermediateOpen, setNewIntermediateOpen] = useState(false);
  const [newIntForm, setNewIntForm] = useState(emptyRecipeForm);
  const [newIntSubmitting, setNewIntSubmitting] = useState(false);
  const [ingredientListTarget, setIngredientListTarget] = useState<IntermediateStockResponse | null>(null);

  /* Recipes modal */
  const [recipeProduct, setRecipeProduct] = useState<ProductResponse | null>(null);

  /* Data fetching */
  const fetchProducts = async () => {
    try { const res = await api.get('/api/products', { params: { branchId: employee?.branchId } }); setProducts(res.data ?? []); }
    catch (err) { console.error(err); }
  };
  const fetchMaterials = async () => {
    if (!employee?.branchId) return;
    try { const res = await api.get(`/api/inventory/branch/${employee.branchId}`); setMaterials(res.data ?? []); }
    catch (err) { console.error(err); }
  };
  const fetchIntermediates = async () => {
    if (!employee?.branchId) return;
    try { const res = await api.get(`/api/inventory/branch/${employee.branchId}/intermediates`); setIntermediates(res.data ?? []); }
    catch (err) { console.error(err); }
  };
  const fetchCategories = async () => {
    try { const res = await api.get('/api/products/categories'); setCategories(res.data ?? []); }
    catch (err) { console.error(err); }
  };
  const fetchIntermediateRecipes = async () => {
    try { const res = await api.get('/api/recipes/intermediates'); setIntermediateRecipes(res.data ?? []); }
    catch (err) { console.error(err); }
  };

  useEffect(() => {
    setLoading(true);
    if (tab === 'products') { Promise.all([fetchProducts(), fetchCategories(), fetchIntermediateRecipes()]).finally(() => setLoading(false)); }
    else if (tab === 'intermediates') { Promise.all([fetchIntermediates(), fetchIntermediateRecipes()]).finally(() => setLoading(false)); }
    else { fetchMaterials().finally(() => setLoading(false)); }
  }, [tab, employee?.branchId]);

  const handleToggle = async (id: number) => {
    try { const res = await api.patch(`/api/products/${id}/toggle`); setProducts((prev) => prev.map((p) => (p.id === id ? res.data : p))); }
    catch (err) { console.error(err); }
  };
  const handleCreateProduct = async () => {
    if (!productForm.name || !productForm.price || !productForm.categoryId) return;
    setSubmitting(true);
    try {
      await api.post('/api/products', {
        name: productForm.name, productType: productForm.productType, price: Number(productForm.price),
        categoryId: Number(productForm.categoryId), description: productForm.description || undefined,
      } as CreateProductRequest);
      setProductDialogOpen(false); setProductForm(emptyProductForm); fetchProducts();
    } catch (err) { console.error(err); } finally { setSubmitting(false); }
  };
  const handleUpdateProduct = async () => {
    if (!editProduct || !editProductForm.name || !editProductForm.price || !editProductForm.categoryId) return;
    setEditProductSubmitting(true);
    try {
      await api.put(`/api/products/${editProduct.id}`, {
        name: editProductForm.name,
        productType: editProductForm.productType,
        price: Number(editProductForm.price),
        categoryId: Number(editProductForm.categoryId),
        description: editProductForm.description || undefined,
      } as UpdateProductRequest);
      setEditProductOpen(false); setEditProduct(null); setEditProductForm(emptyProductForm); fetchProducts();
    } catch (err) { console.error(err); } finally { setEditProductSubmitting(false); }
  };
  const handleRecordProduction = async () => {
    if (!productionRecipeId || !productionQty || !employee?.branchId || !employee?.id) return;
    setSubmittingProduction(true);
    try {
      await api.post('/api/inventory/production', {
        recipeId: Number(productionRecipeId), branchId: employee.branchId, employeeId: employee.id, quantityProduced: Number(productionQty),
      } as ProductionRequest);
      setProductionDialogOpen(false); setProductionRecipeId(''); setProductionQty('');
      Promise.all([fetchIntermediates(), fetchIntermediateRecipes()]);
    } catch (err) { console.error(err); } finally { setSubmittingProduction(false); }
  };

  /* Material CRUD */
  const handleCreateMaterial = async () => {
    if (!materialForm.name || !materialForm.stockQty || !materialForm.minStock || !materialForm.avgUnitCost || !employee?.branchId) return;
    setMaterialSubmitting(true);
    try {
      await api.post('/api/inventory/materials', {
        branchId: employee.branchId, name: materialForm.name, unit: materialForm.unit,
        stockQty: Number(materialForm.stockQty), minStock: Number(materialForm.minStock), avgUnitCost: Number(materialForm.avgUnitCost),
      } as CreateRawMaterialRequest);
      setMaterialDialogOpen(false); setMaterialForm(emptyMaterialForm); fetchMaterials();
    } catch (err) { console.error(err); } finally { setMaterialSubmitting(false); }
  };
  const handleEditMaterial = async () => {
    if (!editingMaterial) return;
    setEditMaterialSubmitting(true);
    try {
      await api.put(`/api/inventory/materials/${editingMaterial.id}`, {
        name: editMaterialForm.name || undefined, unit: editMaterialForm.unit || undefined,
        minStock: editMaterialForm.minStock ? Number(editMaterialForm.minStock) : undefined,
      } as UpdateRawMaterialRequest);
      setEditMaterialOpen(false); setEditingMaterial(null); fetchMaterials();
    } catch (err) { console.error(err); } finally { setEditMaterialSubmitting(false); }
  };
  const handleAdjustStock = async () => {
    if (!adjustMaterial || !adjustForm.quantity || !adjustForm.reason) return;
    setAdjustSubmitting(true);
    try {
      await api.post(`/api/inventory/materials/${adjustMaterial.id}/adjust`, {
        type: adjustForm.type, quantity: Number(adjustForm.quantity), reason: adjustForm.reason,
      } as AdjustStockRequest);
      setAdjustOpen(false); setAdjustMaterial(null); setAdjustForm(emptyAdjustForm); fetchMaterials();
    } catch (err) { console.error(err); } finally { setAdjustSubmitting(false); }
  };

  /* Intermediate CRUD */
  const handleCreateIntermediate = async () => {
    if (!newIntForm.name || !employee?.branchId) return;
    setNewIntSubmitting(true);
    try {
      await api.post('/api/recipes', {
        productId: 0, name: newIntForm.name, size: newIntForm.size || undefined,
        isIntermediate: true, yieldQty: newIntForm.yieldQty ? Number(newIntForm.yieldQty) : undefined,
        yieldUnit: newIntForm.yieldUnit || undefined,
      });
      setNewIntermediateOpen(false); setNewIntForm(emptyRecipeForm);
      Promise.all([fetchIntermediates(), fetchIntermediateRecipes()]);
    } catch (err) { console.error(err); } finally { setNewIntSubmitting(false); }
  };

  return (
    <div className="flex h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Inventario" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex gap-1 bg-slate-800 rounded-lg p-1 w-fit mb-6">
            {(['products', 'intermediates', 'materials'] as const).map((t) => (
              <button key={t} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`} onClick={() => setTab(t)}>
                {t === 'products' ? 'Productos' : t === 'intermediates' ? 'Pre-elaboraciones' : 'Materias Primas'}
              </button>
            ))}
          </div>

          {/* TAB: Productos */}
          {tab === 'products' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Productos</h2>
                <button className="h-7 px-2.5 text-[0.8rem] bg-primary text-primary-foreground hover:bg-primary/80 rounded-md font-medium whitespace-nowrap" onClick={() => setProductDialogOpen(true)}>Nuevo producto</button>
                <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                  <DialogContent className="sm:max-w-md bg-card text-foreground">
                    <DialogHeader><DialogTitle>Nuevo producto</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><label className="block text-sm font-medium mb-1">Nombre</label><input className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></div>
                      <div><label className="block text-sm font-medium mb-1">Tipo</label><select className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={productForm.productType} onChange={(e) => setProductForm({ ...productForm, productType: e.target.value })}><option value="PREPARED">PREPARED</option><option value="SIMPLE">SIMPLE</option></select></div>
                      <div><label className="block text-sm font-medium mb-1">Precio</label><input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} /></div>
                      <div><label className="block text-sm font-medium mb-1">Categoría</label><select className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}><option value="">Seleccionar...</option>{categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>
                      <div><label className="block text-sm font-medium mb-1">Descripción</label><textarea className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => setProductDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateProduct} disabled={submitting}>{submitting ? 'Guardando...' : 'Guardar'}</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                {/* Edit product dialog */}
                <Dialog open={editProductOpen} onOpenChange={setEditProductOpen}>
                  <DialogContent className="sm:max-w-md bg-card text-foreground">
                    <DialogHeader><DialogTitle>Editar producto</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><label className="block text-sm font-medium mb-1">Nombre</label><input className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={editProductForm.name} onChange={(e) => setEditProductForm({ ...editProductForm, name: e.target.value })} /></div>
                      <div><label className="block text-sm font-medium mb-1">Tipo</label><select className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={editProductForm.productType} onChange={(e) => setEditProductForm({ ...editProductForm, productType: e.target.value })}><option value="PREPARED">PREPARED</option><option value="SIMPLE">SIMPLE</option></select></div>
                      <div><label className="block text-sm font-medium mb-1">Precio</label><input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={editProductForm.price} onChange={(e) => setEditProductForm({ ...editProductForm, price: e.target.value })} /></div>
                      <div><label className="block text-sm font-medium mb-1">Categoría</label><select className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={editProductForm.categoryId} onChange={(e) => setEditProductForm({ ...editProductForm, categoryId: e.target.value })}><option value="">Seleccionar...</option>{categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div>
                      <div><label className="block text-sm font-medium mb-1">Descripción</label><textarea className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={editProductForm.description} onChange={(e) => setEditProductForm({ ...editProductForm, description: e.target.value })} /></div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => { setEditProductOpen(false); setEditProduct(null); setEditProductForm(emptyProductForm); }}>Cancelar</Button>
                        <Button onClick={handleUpdateProduct} disabled={editProductSubmitting}>{editProductSubmitting ? 'Guardando...' : 'Guardar'}</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <ProductTable products={products} onToggle={handleToggle} onViewRecipes={setRecipeProduct} onEdit={(p) => { setEditProduct(p); setEditProductForm({ name: p.name, productType: p.productType, price: String(p.price), categoryId: String(p.categoryId ?? ''), description: p.description ?? '' }); setEditProductOpen(true); }} loading={loading} />
            </div>
          )}

          {/* TAB: Pre-elaboraciones */}
          {tab === 'intermediates' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Pre-elaboraciones</h2>
                <div className="flex gap-2">
                  <button className="h-7 px-2.5 text-[0.8rem] bg-primary text-primary-foreground hover:bg-primary/80 rounded-md font-medium whitespace-nowrap" onClick={() => setNewIntermediateOpen(true)}>Nueva pre-elaboración</button>
                  <button className="h-7 px-2.5 text-[0.8rem] bg-primary text-primary-foreground hover:bg-primary/80 rounded-md font-medium whitespace-nowrap" onClick={() => setProductionDialogOpen(true)}>Registrar producción</button>
                </div>
                <Dialog open={productionDialogOpen} onOpenChange={setProductionDialogOpen}>
                  <DialogContent className="sm:max-w-md bg-card text-foreground">
                    <DialogHeader><DialogTitle>Registrar producción</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><label className="block text-sm font-medium mb-1">Pre-elaboración</label><select className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={productionRecipeId} onChange={(e) => setProductionRecipeId(e.target.value)}><option value="">Seleccionar...</option>{intermediateRecipes.map((r) => (<option key={r.id} value={r.id}>{r.name}</option>))}</select></div>
                      <div><label className="block text-sm font-medium mb-1">Cantidad producida</label><input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={productionQty} onChange={(e) => setProductionQty(e.target.value)} /></div>
                      <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setProductionDialogOpen(false)}>Cancelar</Button><Button onClick={handleRecordProduction} disabled={submittingProduction}>{submittingProduction ? 'Guardando...' : 'Guardar'}</Button></div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog open={newIntermediateOpen} onOpenChange={setNewIntermediateOpen}>
                  <DialogContent className="sm:max-w-md bg-card text-foreground">
                    <DialogHeader><DialogTitle>Nueva pre-elaboración</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><label className="block text-sm font-medium mb-1">Nombre</label><input className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={newIntForm.name} onChange={(e) => setNewIntForm({ ...newIntForm, name: e.target.value })} /></div>
                      <div><label className="block text-sm font-medium mb-1">Tamaño</label><input className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={newIntForm.size} onChange={(e) => setNewIntForm({ ...newIntForm, size: e.target.value })} placeholder="PERSONAL, FAMILIAR..." /></div>
                      <div className="flex gap-3">
                        <div className="flex-1"><label className="block text-sm font-medium mb-1">Rendimiento cantidad</label><input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={newIntForm.yieldQty} onChange={(e) => setNewIntForm({ ...newIntForm, yieldQty: e.target.value })} /></div>
                        <div className="flex-1"><label className="block text-sm font-medium mb-1">Rendimiento unidad</label><select className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={newIntForm.yieldUnit} onChange={(e) => setNewIntForm({ ...newIntForm, yieldUnit: e.target.value })}>
                          <option value="">Seleccionar...</option>
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="lt">lt</option>
                          <option value="ml">ml</option>
                          <option value="unidad">unidad</option>
                          <option value="bollo">bollo</option>
                          <option value="pizca">pizca</option>
                          <option value="taza">taza</option>
                          <option value="cucharada">cucharada</option>
                          <option value="cucharadita">cucharadita</option>
                        </select></div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setNewIntermediateOpen(false)}>Cancelar</Button><Button onClick={handleCreateIntermediate} disabled={newIntSubmitting}>{newIntSubmitting ? 'Guardando...' : 'Guardar'}</Button></div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <IntermediateTable items={intermediates} onViewIngredients={setIngredientListTarget} loading={loading} />
            </div>
          )}

          {/* TAB: Materias Primas */}
          {tab === 'materials' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Materias Primas</h2>
                <button className="h-7 px-2.5 text-[0.8rem] bg-primary text-primary-foreground hover:bg-primary/80 rounded-md font-medium whitespace-nowrap" onClick={() => setMaterialDialogOpen(true)}>Nueva materia prima</button>
                <Dialog open={materialDialogOpen} onOpenChange={setMaterialDialogOpen}>
                  <DialogContent className="sm:max-w-md bg-card text-foreground">
                    <DialogHeader><DialogTitle>Nueva materia prima</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><label className="block text-sm font-medium mb-1">Nombre</label><input className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={materialForm.name} onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })} /></div>
                      <div><label className="block text-sm font-medium mb-1">Unidad</label><select className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={materialForm.unit} onChange={(e) => setMaterialForm({ ...materialForm, unit: e.target.value })}><option value="kg">kg</option><option value="g">g</option><option value="lt">lt</option><option value="ml">ml</option><option value="unidad">unidad</option><option value="bollo">bollo</option><option value="pizca">pizca</option><option value="taza">taza</option><option value="cucharada">cucharada</option><option value="cucharadita">cucharadita</option></select></div>
                      <div className="flex gap-3">
                        <div className="flex-1"><label className="block text-sm font-medium mb-1">Stock actual</label><input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={materialForm.stockQty} onChange={(e) => setMaterialForm({ ...materialForm, stockQty: e.target.value })} /></div>
                        <div className="flex-1"><label className="block text-sm font-medium mb-1">Stock mínimo</label><input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={materialForm.minStock} onChange={(e) => setMaterialForm({ ...materialForm, minStock: e.target.value })} /></div>
                      </div>
                      <div><label className="block text-sm font-medium mb-1">Costo promedio unitario</label><input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={materialForm.avgUnitCost} onChange={(e) => setMaterialForm({ ...materialForm, avgUnitCost: e.target.value })} /></div>
                      <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setMaterialDialogOpen(false)}>Cancelar</Button><Button onClick={handleCreateMaterial} disabled={materialSubmitting}>{materialSubmitting ? 'Guardando...' : 'Guardar'}</Button></div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <RawMaterialTable materials={materials} onEdit={(m) => { setEditingMaterial(m); setEditMaterialForm({ name: m.name, unit: m.unit, stockQty: '', minStock: String(m.minStock), avgUnitCost: '' }); setEditMaterialOpen(true); }} onAdjustStock={(m) => { setAdjustMaterial(m); setAdjustForm(emptyAdjustForm); setAdjustOpen(true); }} loading={loading} />
              {/* Edit material dialog */}
              <Dialog open={editMaterialOpen} onOpenChange={setEditMaterialOpen}>
                <DialogContent className="sm:max-w-md bg-card text-foreground">
                  <DialogHeader><DialogTitle>Editar materia prima</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Nombre</label><input className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={editMaterialForm.name} onChange={(e) => setEditMaterialForm({ ...editMaterialForm, name: e.target.value })} /></div>
                    <div><label className="block text-sm font-medium mb-1">Unidad</label><select className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={editMaterialForm.unit} onChange={(e) => setEditMaterialForm({ ...editMaterialForm, unit: e.target.value })}><option value="kg">kg</option><option value="g">g</option><option value="lt">lt</option><option value="ml">ml</option><option value="unidad">unidad</option><option value="bollo">bollo</option><option value="pizca">pizca</option><option value="taza">taza</option><option value="cucharada">cucharada</option><option value="cucharadita">cucharadita</option></select></div>
                    <div><label className="block text-sm font-medium mb-1">Stock mínimo</label><input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={editMaterialForm.minStock} onChange={(e) => setEditMaterialForm({ ...editMaterialForm, minStock: e.target.value })} /></div>
                    <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setEditMaterialOpen(false)}>Cancelar</Button><Button onClick={handleEditMaterial} disabled={editMaterialSubmitting}>{editMaterialSubmitting ? 'Guardando...' : 'Guardar'}</Button></div>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Adjust stock dialog */}
              <Dialog open={adjustOpen} onOpenChange={setAdjustOpen}>
                <DialogContent className="sm:max-w-md bg-card text-foreground">
                  <DialogHeader><DialogTitle>Ajustar stock — {adjustMaterial?.name}</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Tipo</label><select className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={adjustForm.type} onChange={(e) => setAdjustForm({ ...adjustForm, type: e.target.value })}><option value="ENTRADA">Entrada</option><option value="SALIDA">Salida</option></select></div>
                    <div><label className="block text-sm font-medium mb-1">Cantidad</label><input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={adjustForm.quantity} onChange={(e) => setAdjustForm({ ...adjustForm, quantity: e.target.value })} /></div>
                    <div><label className="block text-sm font-medium mb-1">Motivo</label><input className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-sm text-foreground" value={adjustForm.reason} onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })} /></div>
                    <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={() => setAdjustOpen(false)}>Cancelar</Button><Button onClick={handleAdjustStock} disabled={adjustSubmitting}>{adjustSubmitting ? 'Guardando...' : 'Guardar'}</Button></div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </main>
      </div>

      {/* Modales globales */}
      {recipeProduct && (
        <RecipesModal product={recipeProduct} open={!!recipeProduct} onOpenChange={(v) => { if (!v) setRecipeProduct(null); }} rawMaterials={materials} intermediates={intermediateRecipes} />
      )}
      {ingredientListTarget && (
        <IngredientListModal recipeId={ingredientListTarget.recipeId} recipeName={ingredientListTarget.recipeName} intermediates={intermediateRecipes} rawMaterials={materials} open={!!ingredientListTarget} onOpenChange={(v) => { if (!v) setIngredientListTarget(null); }} />
      )}
    </div>
  );
}
