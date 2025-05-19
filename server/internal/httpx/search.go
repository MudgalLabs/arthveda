package httpx

// SearchPayload is the input payload to search any <resource>.
// It takes a generic to define resource filters type.
type SearchPayload[T any] struct {
	Filters    T          `json:"filters"`
	Sort       Sorting    `json:"sort"`
	Pagination Pagination `json:"pagination"`
}

// Init initialises the payload to be used by the service.
func (p *SearchPayload[T]) Init(allowedFields []string) error {
	// Apply pagination defaults.
	p.Pagination.ApplyDefaults()

	// Validate and make sure that client is sorting on an allowed field.
	return p.Sort.Validate(allowedFields)
}

// SearchResult is the output of the search performed on a <resource>.
// It takes a generic to define resource item type.
type SearchResult[T any] struct {
	Items      T              `json:"items"`
	Pagination PaginationMeta `json:"pagination"`
}

func NewSearchResult[T any](items T, meta PaginationMeta) *SearchResult[T] {
	return &SearchResult[T]{
		Items:      items,
		Pagination: meta,
	}
}
