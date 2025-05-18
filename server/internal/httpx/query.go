package httpx

import (
	"net/http"

	"github.com/go-playground/form/v4"
	"github.com/shopspring/decimal"
)

var (
	decoder = initDecoder()
)

// Inits the decoder so that we can use QueryParams
// by adding "query" tag to struct fields.
func initDecoder() *form.Decoder {
	decoder := form.NewDecoder()

	decoder.SetTagName("query")

	decoder.RegisterCustomTypeFunc(func(vals []string) (any, error) {
		if len(vals) == 0 {
			return decimal.Zero, nil
		}
		return decimal.NewFromString(vals[0])
	}, decimal.Decimal{})

	return decoder
}

// BindQuery binds URL query parameters into the given struct pointer.
// It uses `query` tags from the struct fields.
func BindQuery(r *http.Request, dst any) error {
	return decoder.Decode(dst, r.URL.Query())
}

// BindQuery decodes query params into a struct, applies defaults, and validates it.
// func BindQuery[T any](r *http.Request) (*T, error) {
// 	var t T
// 	err := decoder.Decode(&t, r.URL.Query())
// 	if err != nil {
// 		return nil, err
// 	}
// 	return &t, nil
// }
