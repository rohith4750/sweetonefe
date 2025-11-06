import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { quickBillApi } from '@/api/quick-bill.api';
import { QuickBillProduct, CreateQuickBillRequest, QuickBillResponse, QuickBillErrorResponse } from '@/types/quick-bill.types';
import { Button, Input, Loading, Modal, toast, ConfirmationModal, SearchBar } from '@/components/common';
import { formatCurrency } from '@/utils/formatters';
import { useAuthStore } from '@/store/authStore';
import { useInvalidateQueries } from '@/hooks/useInvalidateQueries';
import './QuickBill.css';

interface CartItem {
  sweet_id: number;
  name: string;
  unit_price: number;
  quantity: number;
  available_stock: number;
}

export const QuickBill: React.FC = () => {
  const { user } = useAuthStore();
  const invalidate = useInvalidateQueries();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [billResponse, setBillResponse] = useState<QuickBillResponse | null>(null);
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [pendingCustomerName, setPendingCustomerName] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Categories - can be extended later
  const categories = ['All', 'Ladoos', 'Barfis', 'Bengali Sweets', 'Halwa', 'Dry Fruit'];

  // Get user's branch_id if they are a branch user
  useEffect(() => {
    if (user?.branch_id) {
      setBranchId(user.branch_id);
    } else {
      setBranchId(undefined);
    }
  }, [user]);

  const { data: products, isLoading } = useQuery({
    queryKey: ['quick-bill-products', branchId],
    queryFn: () => quickBillApi.getProducts(branchId),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateQuickBillRequest) => quickBillApi.create(data),
    onSuccess: (response) => {
      invalidate('quick-bill');
      setBillResponse(response);
      setIsSuccessModalOpen(true);
      setCart([]);
      reset();
      
      if (response.warnings) {
        toast.warning(response.warnings.message);
      } else {
        toast.success('Quick bill created successfully!');
      }
    },
    onError: (error: any) => {
      const errorData = error.response?.data as QuickBillErrorResponse;
      const errorMessage = error?.response?.data?.message || error?.response?.data?.error;
      if (errorData?.insufficient_stock) {
        toast.error(errorData.message || 'Insufficient stock for all items');
      } else if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error('Failed to create quick bill');
      }
    },
  });

  const { register, handleSubmit, reset } = useForm<{ customer_name: string }>({
    defaultValues: {
      customer_name: '',
    },
  });

  const handleAddToCart = (product: QuickBillProduct) => {
    const existingItem = cart.find(item => item.sweet_id === product.sweet_id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.sweet_id === product.sweet_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        sweet_id: product.sweet_id,
        name: product.name,
        unit_price: product.unit_price,
        quantity: 1,
        available_stock: product.available_stock,
      }]);
    }
  };

  const handleUpdateQuantity = (sweet_id: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.sweet_id !== sweet_id));
    } else {
      const product = products?.find(p => p.sweet_id === sweet_id);
      if (product && quantity > product.available_stock) {
        toast.error(`Maximum available stock is ${product.available_stock}`);
        return;
      }
      setCart(cart.map(item =>
        item.sweet_id === sweet_id
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const handleRemoveFromCart = (sweet_id: number) => {
    setCart(cart.filter(item => item.sweet_id !== sweet_id));
  };

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    
    let filtered = products;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by category (simple keyword matching - can be improved)
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        (selectedCategory === 'Ladoos' && product.name.toLowerCase().includes('ladoo')) ||
        (selectedCategory === 'Barfis' && product.name.toLowerCase().includes('barfi')) ||
        (selectedCategory === 'Bengali Sweets' && (
          product.name.toLowerCase().includes('rasgulla') ||
          product.name.toLowerCase().includes('sandesh') ||
          product.name.toLowerCase().includes('mishti')
        )) ||
        (selectedCategory === 'Halwa' && product.name.toLowerCase().includes('halwa')) ||
        (selectedCategory === 'Dry Fruit' && (
          product.name.toLowerCase().includes('kaju') ||
          product.name.toLowerCase().includes('pista') ||
          product.name.toLowerCase().includes('badam')
        ))
      );
    }
    
    return filtered;
  }, [products, searchTerm, selectedCategory]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
  }, [cart]);

  const taxRate = 0.05; // 5% GST
  const tax = useMemo(() => {
    return subtotal * taxRate;
  }, [subtotal, taxRate]);

  const grandTotal = useMemo(() => {
    return subtotal + tax;
  }, [subtotal, tax]);

  const onSubmit = (data: { customer_name: string }) => {
    if (cart.length === 0) {
      toast.error('Please add at least one item to the cart');
      return;
    }

    // Check for insufficient stock
    const hasInsufficientStock = cart.some(item => {
      const product = products?.find(p => p.sweet_id === item.sweet_id);
      return product && item.quantity > product.available_stock;
    });

    if (hasInsufficientStock) {
      toast.error('Some items have insufficient stock. Please adjust quantities.');
      return;
    }

    // Store customer name and show confirmation modal
    setPendingCustomerName(data.customer_name || '');
    setIsConfirmationModalOpen(true);
  };

  const handleConfirmBill = () => {
    const request: CreateQuickBillRequest = {
      customer_name: pendingCustomerName || undefined,
      items: cart.map(item => ({
        sweet_id: item.sweet_id,
        quantity: item.quantity,
      })),
    };

    createMutation.mutate(request);
  };

  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalOpen(false);
    setPendingCustomerName('');
  };

  const handleCloseSuccessModal = () => {
    setIsSuccessModalOpen(false);
    setBillResponse(null);
  };

  if (isLoading) return <Loading />;

  return (
    <div className="quick-bill">
      <div className="quick-bill-header">
        <h1 className="quick-bill-title">Quick Bill Generator</h1>
        <div className="quick-bill-header-info">
          <div className="header-brand">
            <div className="brand-icon">🍬</div>
            <span className="brand-name">Sweet Shop</span>
          </div>
          <div className="header-time">
            <span className="time">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
            <span className="date">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>

      <div className="quick-bill-content">
        <div className="quick-bill-products">
          <div className="products-search">
            <SearchBar
              placeholder="Search for sweets..."
              onSearch={setSearchTerm}
              className="quick-bill-search"
            />
          </div>

          <div className="category-filters">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-filter ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="products-scrollable">
            {!products || products.length === 0 ? (
              <div className="quick-bill-empty">
                <p>No products available in stock</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="quick-bill-empty">
                <p>No products found matching your search</p>
              </div>
            ) : (
              <div className="products-grid">
                {filteredProducts.map((product) => {
                  const cartItem = cart.find(item => item.sweet_id === product.sweet_id);
                  const isInCart = !!cartItem;
                  
                  return (
                    <div key={product.sweet_id} className={`product-card ${product.is_low_stock ? 'low-stock' : ''}`}>
                      <div className="product-image">
                        <div className="product-image-placeholder">
                          {product.name.charAt(0)}
                        </div>
                        {product.is_low_stock && (
                          <span className="low-stock-badge">Low Stock</span>
                        )}
                      </div>
                      <div className="product-info">
                        <h3 className="product-name">{product.name}</h3>
                        <div className="product-price-stock">
                          <span className="product-price">{formatCurrency(product.unit_price)}</span>
                          <span className="product-stock">Stock: {product.available_stock}</span>
                        </div>
                        {isInCart ? (
                          <div className="product-quantity-controls">
                            <button
                              className="quantity-btn minus"
                              onClick={() => handleUpdateQuantity(product.sweet_id, cartItem.quantity - 1)}
                            >
                              -
                            </button>
                            <span className="quantity-display">{cartItem.quantity}</span>
                            <button
                              className="quantity-btn plus"
                              onClick={() => handleUpdateQuantity(product.sweet_id, cartItem.quantity + 1)}
                              disabled={cartItem.quantity >= product.available_stock}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.available_stock <= 0}
                            className="add-to-cart-btn"
                          >
                            Add to Cart
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="quick-bill-cart">
          <div className="cart-header">
            <h2>Current Order</h2>
          </div>

          {cart.length === 0 ? (
            <div className="cart-empty">
              <p>Your cart is empty</p>
              <p className="cart-empty-hint">Select products to add to cart</p>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item) => {
                  const product = products?.find(p => p.sweet_id === item.sweet_id);
                  return (
                    <div key={item.sweet_id} className="cart-item">
                      <div className="cart-item-image">
                        <div className="cart-item-image-placeholder">
                          {item.name.charAt(0)}
                        </div>
                      </div>
                      <div className="cart-item-info">
                        <h4 className="cart-item-name">{item.name}</h4>
                        <p className="cart-item-price">{formatCurrency(item.unit_price)}</p>
                        {product && item.quantity > product.available_stock && (
                          <p className="stock-warning">Insufficient stock</p>
                        )}
                        <div className="cart-item-quantity-control">
                          <button
                            className="cart-quantity-btn minus"
                            onClick={() => handleUpdateQuantity(item.sweet_id, item.quantity - 1)}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            className="cart-quantity-input"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value) || 0;
                              handleUpdateQuantity(item.sweet_id, newQuantity);
                            }}
                            min="1"
                            max={product?.available_stock || item.quantity}
                          />
                          <button
                            className="cart-quantity-btn plus"
                            onClick={() => handleUpdateQuantity(item.sweet_id, item.quantity + 1)}
                            disabled={item.quantity >= (product?.available_stock || item.quantity)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="cart-item-actions">
                        <span className="cart-item-total">{formatCurrency(item.unit_price * item.quantity)}</span>
                        <button
                          className="cart-item-remove"
                          onClick={() => handleRemoveFromCart(item.sweet_id)}
                          title="Remove item"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="cart-summary">
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Input
                    label="Customer Name (Optional)"
                    placeholder="Walk-in Customer"
                    {...register('customer_name')}
                    fullWidth
                    className="customer-name-input"
                  />
                  
                  <div className="billing-summary">
                    <div className="summary-row">
                      <span className="summary-label">Subtotal</span>
                      <span className="summary-value">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Tax (5% GST)</span>
                      <span className="summary-value">{formatCurrency(tax)}</span>
                    </div>
                    <div className="summary-row grand-total">
                      <span className="summary-label">Grand Total</span>
                      <span className="summary-value">{formatCurrency(grandTotal)}</span>
                    </div>
                  </div>

                  <div className="cart-actions">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCart([])}
                      className="clear-order-btn"
                    >
                      Clear Order
                    </Button>
                    <Button
                      type="submit"
                      isLoading={createMutation.isPending}
                      className="generate-bill-btn"
                    >
                      Generate Bill
                    </Button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmationModalOpen}
        onClose={handleCloseConfirmationModal}
        onConfirm={handleConfirmBill}
        title="Confirm Quick Bill"
        confirmLabel="Confirm & Create Bill"
        cancelLabel="Cancel"
        isLoading={createMutation.isPending}
        size="lg"
        closeOnOverlayClick={false}
        infoItems={[
          {
            label: 'Customer Name',
            value: pendingCustomerName || 'Walk-in Customer',
          },
          {
            label: 'Branch',
            value: user?.Branches?.name || 'N/A',
          },
        ]}
        tableData={{
          columns: [
            { key: 'name', header: 'Product' },
            { key: 'quantity', header: 'Quantity' },
            { key: 'unit_price', header: 'Unit Price', render: (value) => formatCurrency(value) },
            { key: 'total', header: 'Total', render: (value) => formatCurrency(value) },
          ],
          rows: cart.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.unit_price * item.quantity,
          })),
          summary: {
            label: 'Grand Total:',
            value: formatCurrency(grandTotal),
          },
        }}
        warning="⚠️ This will immediately deduct stock and create a completed order."
      />

      {/* Success Modal */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseSuccessModal}
        title="Bill Created Successfully"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseSuccessModal}>
              Close
            </Button>
          </div>
        }
      >
        {billResponse && (
          <div className="bill-success">
            <div className="bill-info">
              <p><strong>Order ID:</strong> {billResponse.order_id}</p>
              <p><strong>Customer:</strong> {billResponse.customer_name}</p>
              <p><strong>Branch:</strong> {billResponse.Branches?.name || 'N/A'}</p>
              <p><strong>Total Amount:</strong> {formatCurrency(billResponse.total_amount)}</p>
              <p><strong>Status:</strong> {billResponse.status}</p>
              <p><strong>Created At:</strong> {new Date(billResponse.created_at).toLocaleString()}</p>
            </div>

            <div className="bill-items">
              <h3>Items:</h3>
              <table className="bill-items-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                    {billResponse.OrderItems.some(item => item.partial_fulfillment) && (
                      <th>Status</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {billResponse.OrderItems.map((item) => (
                    <tr key={item.item_id}>
                      <td>{item.FinishedGoods?.name || 'N/A'}</td>
                      <td>
                        {item.quantity}
                        {item.partial_fulfillment && (
                          <span className="partial-badge"> (Requested: {item.requested_quantity})</span>
                        )}
                      </td>
                      <td>{formatCurrency(item.unit_price)}</td>
                      <td>{formatCurrency(item.total)}</td>
                      {billResponse.OrderItems.some(i => i.partial_fulfillment) && (
                        <td>
                          {item.partial_fulfillment ? (
                            <span className="partial-badge">Partial</span>
                          ) : (
                            <span className="fulfilled-badge">Fulfilled</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {billResponse.warnings && (
              <div className="bill-warnings">
                <h3>⚠️ Warnings:</h3>
                <p>{billResponse.warnings.message}</p>
                <ul>
                  {billResponse.warnings.insufficient_stock.map((item, index) => (
                    <li key={index}>
                      <strong>{item.sweet_name}</strong>: Requested {item.requested_quantity}, 
                      Available {item.available_stock}, Shortfall {item.shortfall}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

