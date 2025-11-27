import { TTLLRUCache } from "../src"

// --- Part 1: Raw Class Usage ---
console.log("=== 1. Testing Raw Cache Class ===")
const rawCache = new TTLLRUCache<string, string>({ capacity: 2, ttl: 2 })

rawCache.on("evict", (e) => console.log(`[Evict] ${e.key} (${e.reason})`))

rawCache.set("A", "Alpha")
rawCache.set("B", "Beta")
console.log("Get A:", rawCache.get("A")) // Refreshes A. Order: A, B. Tail: B
rawCache.set("C", "Charlie") // Capacity full. B should be evicted.

setTimeout(() => {
	console.log("Get A after timeout:", rawCache.get("A")) // Should expire
}, 2100)

// --- Part 2: Decorator Usage ---
console.log("\n=== 2. Testing @Cacheable Decorator ===")

const mockApi = (id: number): Promise<string> =>
	new Promise((r) => setTimeout(() => r(`User_${id}`), 500))

class UserService {
	private cache = new TTLLRUCache<number, Promise<string>>({ capacity: 100, ttl: 5 })

	async getUser(id: number) {
		const cached = this.cache.get(id)
		if (cached) return cached

		console.log(`Fetching from DB for ID: ${id}...`)
		const p = mockApi(id)
		this.cache.set(id, p)
		return p
	}
}

async function runDecoratorDemo() {
	const service = new UserService()

	console.time("First Call")
	const u1 = await service.getUser(100)
	console.timeEnd("First Call")
	console.log(`Result: ${u1}`)

	console.time("Second Call (Cached)")
	const u2 = await service.getUser(100)
	console.timeEnd("Second Call (Cached)")
	console.log(`Result: ${u2}`)
}

// Run the decorator demo slightly delayed so logs don't mix
setTimeout(runDecoratorDemo, 2500)
