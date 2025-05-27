package common

func ExistsInSet(set map[string]struct{}, str string) bool {
	_, ok := set[str]
	return ok
}
