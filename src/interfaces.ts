export interface CacheOptions {
	capacity?: number
	ttl?: number // Default TTL in seconds
}

export interface EvictEvent<K, V> {
	key: K
	value: V
	reason: "capacity" | "expired"
}

export interface CacheableOptions {
	ttl: number // Seconds
	capacity?: number
	keyGenerator?: (...args: any[]) => string
}
