package position

import "github.com/jackc/pgx/v5/pgxpool"

type Reader interface {
}

type Writer interface{}

type ReadWriter interface {
	Reader
	Writer
}

//
// PostgreSQL implementation
//

type tradeRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *tradeRepository {
	return &tradeRepository{db}
}
