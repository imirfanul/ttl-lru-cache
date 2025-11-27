import { EventEmitter } from "events"
import { CacheNode } from "./CacheNode"
import { CacheOptions, EvictEvent } from "./interfaces"

export class TTLLRUCache<K = string, V = any> extends EventEmitter {
	private capacity: number
	private defaultTTL: number
	private cache: Map<K, CacheNode<K, V>>
	private head: CacheNode<K, V> | null
	private tail: CacheNode<K, V> | null
	public size: number

	constructor(options?: CacheOptions) {
		super()
		this.capacity = options?.capacity ?? 100
		this.defaultTTL = (options?.ttl ?? 0) * 1000
		this.cache = new Map<K, CacheNode<K, V>>()
		this.head = null
		this.tail = null
		this.size = 0
	}

	public get(key: K): V | undefined {
		const node = this.cache.get(key)
		if (!node) return undefined

		// Check TTL (Lazy Expiration)
		if (this.isExpired(node)) {
			this.removeNode(node)
			this.emitEvict(node, "expired")
			return undefined
		}

		// Refresh Usage (LRU)
		this.moveToHead(node)
		return node.value
	}

	public set(key: K, value: V, ttlSeconds?: number): void {
		const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL
		const expiry = ttl > 0 ? Date.now() + ttl : null

		if (this.cache.has(key)) {
			const node = this.cache.get(key)!
			node.value = value
			node.expiry = expiry
			this.moveToHead(node)
		} else {
			const newNode = new CacheNode(key, value, expiry)

			if (this.size >= this.capacity) {
				if (this.tail) {
					const lruNode = this.tail
					this.removeNode(lruNode)
					this.emitEvict(lruNode, "capacity")
				}
			}

			this.cache.set(key, newNode)
			this.addToHead(newNode)
			this.size++
		}
	}

	public clear(): void {
		this.head = null
		this.tail = null
		this.size = 0
		this.cache.clear()
	}

	// --- O(1) Linked List Operations ---

	private moveToHead(node: CacheNode<K, V>): void {
		if (node === this.head) return

		if (node.prev) node.prev.next = node.next
		if (node.next) node.next.prev = node.prev
		if (node === this.tail) this.tail = node.prev

		node.next = this.head
		node.prev = null
		if (this.head) this.head.prev = node
		this.head = node
		if (!this.tail) this.tail = node
	}

	private addToHead(node: CacheNode<K, V>): void {
		node.next = this.head
		node.prev = null
		if (this.head) this.head.prev = node
		this.head = node
		if (!this.tail) this.tail = node
	}

	private removeNode(node: CacheNode<K, V>): void {
		this.cache.delete(node.key)
		this.size--

		if (node.prev) node.prev.next = node.next
		if (node.next) node.next.prev = node.prev
		if (node === this.head) this.head = node.next
		if (node === this.tail) this.tail = node.prev
	}

	private isExpired(node: CacheNode<K, V>): boolean {
		return node.expiry !== null && node.expiry < Date.now()
	}

	private emitEvict(
		node: CacheNode<K, V>,
		reason: "capacity" | "expired"
	): void {
		const event: EvictEvent<K, V> = {
			key: node.key,
			value: node.value,
			reason
		}
		this.emit("evict", event)
	}
}
