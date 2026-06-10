import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Sidebar } from '../../components/layout/Sidebar';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';

interface Product {
  id: number;
  name: string;
  price: number;
  categoryName: string;
  available: boolean;
}

interface OrderItem {
  product: Product;
  quantity: number;
}

const ORDER_TYPES = [
  { key: 'DINE_IN', label: 'Salón' },
  { key: 'TAKEAWAY', label: 'Para llevar' },
  { key: 'PLATFORM', label: 'Delivery' },
];

export default function POSPage() {
  const { employee } = useAuthStore();
  const [orderType, setOrderType] = useState('DINE_IN');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [amountReceived, setAmountReceived] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products', employee?.branchId],
    queryFn: () =>
      api.get<Product[]>('/api/products', { params: { branchId: employee?.branchId } })
        .then((r) => r.data.filter((p) => p.available)),
    enabled: !!employee?.branchId,
  });

  useEffect(() => {
    console.log('productos cargados:', products);
  }, [products]);

  const categories = [...new Set(products.map((p) => p.categoryName))];
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const addItem = (product: Product) => {
    setOrderItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQty = (productId: number, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((i) =>
          i.product.id === productId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const subtotal = orderItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const total = subtotal;

  const processPayment = useMutation({
    mutationFn: () =>
      api.post('/api/payments', {
        orderId: currentOrderId,
        paymentMethodId: paymentMethod === 'CASH' ? 1 : paymentMethod === 'CARD' ? 2 : 3,
        amount: total,
      }),
    onSuccess: () => {
      setPaymentOpen(false);
      setSuccessOpen(true);
    },
  });

  const handleConfirmOrder = async () => {
    if (orderItems.length === 0) {
      console.log('handleConfirmOrder: no hay items');
      return;
    }
    setIsCreating(true);
    try {
      console.log('handleConfirmOrder: creando pedido', { branchId: employee?.branchId, employeeId: employee?.id, orderTypeId: 1, orderStatusId: 1 });
      const orderRes = await api.post('/api/orders', {
        branchId: employee?.branchId,
        employeeId: employee?.id,
        orderTypeId: 1,
        orderStatusId: 1,
      });
      const orderId = orderRes.data.id ?? orderRes.data.data?.id;
      console.log('handleConfirmOrder: pedido creado, ID:', orderId);

      for (const item of orderItems) {
        console.log('handleConfirmOrder: agregando item', { productId: item.product.id, quantity: item.quantity, unitPrice: item.product.price });
        await api.post(`/api/orders/${orderId}/items`, {
          productId: item.product.id,
          quantity: item.quantity,
          unitPrice: item.product.price,
        });
      }
      console.log('handleConfirmOrder: todos los items agregados');
      setCurrentOrderId(orderId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      console.error('handleConfirmOrder: ERROR', err);
      alert('Error al crear pedido: ' + msg);
    } finally {
      setIsCreating(false);
    }
  };

  const resetOrder = () => {
    setOrderItems([]);
    setCurrentOrderId(null);
    setAmountReceived('');
    setPaymentMethod('CASH');
  };

  const filteredProducts = activeCategory
    ? products.filter((p) => p.categoryName === activeCategory)
    : products;

  const change = Math.max(0, parseFloat(amountReceived || '0') - total);

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between bg-card border-b px-6 py-3">
          <h1 className="text-lg font-semibold text-foreground">POS</h1>
          <div className="flex gap-2">
            {ORDER_TYPES.map((t) => (
              <Button
                key={t.key}
                variant={orderType === t.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrderType(t.key)}
              >
                {t.label}
              </Button>
            ))}
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* LEFT: product catalog */}
          <div className="flex-1 flex flex-col overflow-hidden p-4">
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="mb-3 flex-wrap h-auto">
                {categories.map((cat) => (
                  <TabsTrigger key={cat} value={cat} className="text-xs">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
              <TabsContent value={activeCategory} className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                      onClick={() => addItem(product)}
                    >
                      <CardContent className="p-3 space-y-1">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-lg font-bold text-primary">${product.price.toLocaleString()}</p>
                        <Badge variant="secondary" className="text-xs">{product.categoryName}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT: order summary */}
          <div className="w-80 lg:w-96 bg-card border-l flex flex-col">
            <div className="p-4 border-b">
              <h2 className="font-semibold text-foreground">Pedido actual</h2>
              <p className="text-xs text-muted-foreground">{orderItems.length} ítem(s)</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {orderItems.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ${item.product.price.toLocaleString()} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="xs" variant="outline" onClick={() => updateQty(item.product.id, -1)}>
                      −
                    </Button>
                    <span className="w-6 text-center text-sm font-medium text-foreground">{item.quantity}</span>
                    <Button size="xs" variant="outline" onClick={() => updateQty(item.product.id, 1)}>
                      +
                    </Button>
                  </div>
                  <p className="text-sm font-semibold text-foreground w-16 text-right">
                    ${(item.product.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              ))}
              {orderItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Selecciona productos para agregar al pedido
                </p>
              )}
            </div>

            <div className="p-4 border-t space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Descuento</span>
                <span>$0</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold text-foreground">
                <span>Total</span>
                <span>${total.toLocaleString()}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  variant="secondary"
                  disabled={orderItems.length === 0 || isCreating}
                  onClick={handleConfirmOrder}
                >
                  {isCreating ? 'Creando...' : 'Confirmar pedido'}
                </Button>
                <Button
                  className="flex-1"
                  disabled={!currentOrderId}
                  onClick={() => setPaymentOpen(true)}
                >
                  Cobrar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PAYMENT DIALOG */}
      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-sm bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Cobrar pedido</DialogTitle>
            <DialogDescription>Total a cobrar: ${total.toLocaleString()}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Método de pago</label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Efectivo</SelectItem>
                  <SelectItem value="CARD">Tarjeta</SelectItem>
                  <SelectItem value="TRANSFER">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'CASH' && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">
                  Monto recibido
                </label>
                <input
                  type="number"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-lg bg-input border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                {parseFloat(amountReceived || '0') >= total && (
                  <p className="text-sm text-green-400">
                    Vuelto: ${change.toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={
                processPayment.isPending ||
                (paymentMethod === 'CASH' && parseFloat(amountReceived || '0') < total)
              }
              onClick={() => processPayment.mutate()}
            >
              {processPayment.isPending ? 'Procesando...' : 'Procesar pago'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SUCCESS DIALOG */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm bg-card text-foreground text-center">
          <div className="flex flex-col items-center gap-4 py-6">
            <svg className="size-14 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-foreground">¡Pago procesado!</h2>
            <p className="text-sm text-muted-foreground">Pedido #{currentOrderId}</p>
            <p className="text-lg font-semibold text-foreground">Total cobrado: ${total.toLocaleString()}</p>
            {paymentMethod === 'CASH' && change > 0 && (
              <p className="text-sm text-green-500">Vuelto: ${change.toLocaleString()}</p>
            )}
            <Button
              className="mt-2"
              onClick={() => {
                setSuccessOpen(false);
                resetOrder();
              }}
            >
              Nuevo pedido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
