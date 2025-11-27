import { TTLLRUCache } from "./TTLLRUCache"
import { CacheableOptions } from "./interfaces"

export function Cacheable(options: CacheableOptions) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor
	) {
		const originalMethod = descriptor.value

		// Create a private cache instance specifically for this method
		const cache = new TTLLRUCache<string, any>({
			ttl: options.ttl,
			capacity: options.capacity || 100
		})

		descriptor.value = async function (...args: any[]) {
			// Generate Key
			const key = options.keyGenerator
				? options.keyGenerator(...args)
				: JSON.stringify(args)

			// Check Cache
			const cachedResult = cache.get(key)
			if (cachedResult !== undefined) {
				return cachedResult
			}

			// Execute Original Method
			const result = await originalMethod.apply(this, args)

			// Store in Cache (if result is valid)
			if (result !== undefined && result !== null) {
				cache.set(key, result)
			}

			return result
		}

		return descriptor
	}
}
