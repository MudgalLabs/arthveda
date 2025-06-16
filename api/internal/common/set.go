package common

func ExistsInSet[K comparable, V any](set map[K]V, key K) bool {
	_, ok := set[key]
	return ok
}
