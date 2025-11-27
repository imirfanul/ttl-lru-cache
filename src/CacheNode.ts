export class CacheNode<K, V> {
	key: K
	value: V
	expiry: number | null
	prev: CacheNode<K, V> | null
	next: CacheNode<K, V> | null

	constructor(key: K, value: V, expiry: number | null = null) {
		this.key = key
		this.value = value
		this.expiry = expiry
		this.prev = null
		this.next = null
	}
}
