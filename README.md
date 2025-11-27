
# TTL LRU Cache
A lightweight, high-performance in-memory caching library for Node.js and TypeScript. It combines a **Hash Map** with a **Doubly Linked List** to ensure **O(1)** performance for all operations.

Includes support for **Time-To-Live (TTL)** expiration, **Least Recently Used (LRU)** eviction, and **Method Decorators** for effortless caching in class-based services.
## Features

* **O(1) Complexity:** Constant time for `get`, `set`, and eviction.
* **Dual Eviction Strategy:**
    * **LRU:** Removes the least recently accessed item when capacity is reached.
    * **TTL:** Automatically expires items after a specified duration (Lazy expiration).
* **TypeScript Native:** Written in TS with full Generic `<K, V>` support.
* **Event Driven:** Emits events when items are evicted (useful for telemetry).
* **@Cacheable Decorator:** AOP-style caching for class methods (Services, Repositories).


## Installation

Install ttl-lru-cache with npm

```bash
  npm install ttl-lru-cache
```
    
# Usage / Examples


### 1\. Basic Caching

```typescript
import { TTLLRUCache } from 'ttl-lru-cache';

// Initialize with types <KeyType, ValueType>
const cache = new TTLLRUCache<string, number>({
  capacity: 100, // Max items
  ttl: 60        // Default TTL in seconds
});

// Set items
cache.set('user_count', 42);
cache.set('active_sessions', 10, 300); // Custom TTL of 300s for this item

// Get items
const count = cache.get('user_count'); // Returns 42 or undefined

// Listen for drops
cache.on('evict', (event) => {
  console.log(`Item evicted: ${event.key}. Reason: ${event.reason}`);
});
```

### 2\. Using the `@Cacheable` Decorator

Automatically cache the result of asynchronous class methods. The cache key is generated based on the arguments passed to the method.

```typescript
import { Cacheable } from 'ttl-lru-cache';

class UserService {
  
  // Caches result for 60 seconds. 
  // Cache key is automatically generated from arguments (e.g., '["123"]')
  @Cacheable({ ttl: 60, capacity: 50 })
  async getUserProfile(userId: string) {
    console.log('Fetching from Database...');
    return await db.findUser(userId);
  }

  // Custom key generator example
  @Cacheable({ 
    ttl: 300,
    keyGenerator: (id, version) => `product:${id}:v${version}`
  })
  async getProduct(id: string, version: number) {
    // ... complex logic
  }
}
```

## ⚙️ Configuration

### Cache Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `capacity` | `number` | `100` | Maximum number of items in the cache. |
| `ttl` | `number` | `0` | Default Time-To-Live in seconds (0 = no expiry). |

### Decorator Options

| Option | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `ttl` | `number` | **Yes** | Time-To-Live for cached method results (seconds). |
| `capacity` | `number` | No | Capacity specific to this method's cache (default 100). |
| `keyGenerator` | `Function` | No | Custom function to generate cache keys from arguments. |

## 🧪 Performance

This library uses a **Doubly Linked List** for order management.

  * **Set:** O(1) - Appends to Head.
  * **Get:** O(1) - Moves node to Head.
  * **Evict:** O(1) - Removes Tail node.

### 2. Comprehensive Usage Examples (`usage_examples.ts`)

You can use this file to test the library or show your team how to use it.

```typescript
import { TTLLRUCache, Cacheable } from './src';

// ==========================================
// SCENARIO 1: The "Raw" Cache (Manual Control)
// ==========================================
async function manualCacheDemo() {
  console.log('--- 1. Manual Cache Demo ---');

  // Define a type for our value
  type SessionData = { userId: number; token: string };

  const sessionCache = new TTLLRUCache<string, SessionData>({
    capacity: 3, // Small capacity to force eviction
    ttl: 2       // Short TTL to force expiration
  });

  // telemetry logging
  sessionCache.on('evict', ({ key, reason }) => {
    console.warn(`[LOG] Session killed: ${key} (Reason: ${reason})`);
  });

  console.log('1. Adding users A, B, C...');
  sessionCache.set('user_A', { userId: 1, token: 'abc' });
  sessionCache.set('user_B', { userId: 2, token: 'def' });
  sessionCache.set('user_C', { userId: 3, token: 'ghi' });

  console.log('2. Accessing user_A (moves it to "Most Recently Used")');
  sessionCache.get('user_A');

  console.log('3. Adding user_D (Triggers capacity eviction of LRU item)');
  // Since A was accessed, B is now the LRU (Least Recently Used) and should be dropped
  sessionCache.set('user_D', { userId: 4, token: 'jkl' });

  console.log('4. Waiting for TTL expiration (3 seconds)...');
  await new Promise(r => setTimeout(r, 3000));

  const result = sessionCache.get('user_D');
  console.log(`Get user_D after timeout: ${result}`); // Should be undefined
}

// ==========================================
// SCENARIO 2: The Decorator (Service Layer)
// ==========================================

// Mock Database Call
const fakeDbCall = (id: string) => 
  new Promise<string>(resolve => {
    setTimeout(() => resolve(`Product_Data_${id}`), 500); // 500ms delay
  });

class ProductService {
  
  @Cacheable({ ttl: 5 })
  async getProduct(id: string) {
    console.log(`\x1b[33m[DB HIT] Fetching product ${id} from database...\x1b[0m`);
    return await fakeDbCall(id);
  }

  // Example: Cache search results based on query string
  @Cacheable({ ttl: 10, capacity: 50 })
  async searchProducts(query: string) {
    console.log(`\x1b[33m[DB HIT] Searching for "${query}"...\x1b[0m`);
    return [`Result 1 for ${query}`, `Result 2 for ${query}`];
  }
}

async function decoratorDemo() {
  console.log('\n--- 2. Decorator Demo ---');
  const service = new ProductService();

  console.log('Call 1: (Slow)');
  console.time('Time');
  const p1 = await service.getProduct('101');
  console.timeEnd('Time');
  console.log(`Value: ${p1}`);

  console.log('Call 2: (Fast - Cached)');
  console.time('Time');
  const p2 = await service.getProduct('101');
  console.timeEnd('Time');
  console.log(`Value: ${p2}`);

  console.log('Call 3: (Slow - Different Arg)');
  await service.getProduct('999');
}

// ==========================================
// RUNNER
// ==========================================
(async () => {
  await manualCacheDemo();
  await decoratorDemo();
})();
````
## 📄 License

MIT

