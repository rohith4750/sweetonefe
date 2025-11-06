import { useQueryClient } from '@tanstack/react-query';

/**
 * Entity types that can trigger cache invalidation
 */
export type EntityType =
  | 'users'
  | 'branches'
  | 'raw-materials'
  | 'finished-goods'
  | 'recipes'
  | 'production'
  | 'distribution'
  | 'orders'
  | 'quick-bill'
  | 'returns'
  | 'branch-stock'
  | 'bill-history';

/**
 * Mapping of entity types to their related query keys that need invalidation
 */
const entityQueryMap: Record<EntityType, string[]> = {
  users: ['users'],
  branches: ['branches'],
  'raw-materials': ['raw-materials'],
  'finished-goods': [
    'finished-goods',
    'quick-bill-products', // Quick bill products depend on finished goods
    'branch-stock', // Branch stock displays finished goods
  ],
  recipes: ['recipes'],
  production: [
    'production',
    'finished-goods', // Production affects finished goods stock
  ],
  distribution: [
    'distribution',
    'finished-goods', // Stock removed from warehouse
    'branch-stock', // Stock added to branch
  ],
  orders: [
    'orders',
    'bill-history', // Completed orders appear in bill history
    'bill-history-all', // All bills query
  ],
  'quick-bill': [
    'quick-bill-products',
    'orders',
    'bill-history',
    'bill-history-all',
    'branch-stock', // Quick bills affect branch stock
  ],
  returns: [
    'returns',
    'finished-goods', // Returns affect finished goods stock
    'branch-stock', // Returns affect branch stock
  ],
  'branch-stock': ['branch-stock'],
  'bill-history': ['bill-history', 'bill-history-all'],
};

/**
 * Universal hook for invalidating related queries
 * 
 * @example
 * const invalidate = useInvalidateQueries();
 * 
 * // Invalidate all queries related to finished goods
 * invalidate('finished-goods');
 * 
 * // Invalidate multiple entities
 * invalidate(['finished-goods', 'branch-stock']);
 * 
 * // Invalidate with additional custom keys
 * invalidate('orders', ['custom-key']);
 */
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();

  return (
    entity: EntityType | EntityType[],
    additionalKeys: string[] = []
  ) => {
    const entities = Array.isArray(entity) ? entity : [entity];
    const allKeys = new Set<string>();

    // Add keys for all specified entities
    entities.forEach((e) => {
      const keys = entityQueryMap[e] || [];
      keys.forEach((key) => allKeys.add(key));
    });

    // Add additional custom keys
    additionalKeys.forEach((key) => allKeys.add(key));

    // Invalidate all collected keys
    allKeys.forEach((key) => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };
};

