package analytics

import "github.com/jackc/pgx/v5/pgxpool"

type Reader interface {
}

type ReadWriter interface {
	Reader
}

type repository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) ReadWriter {
	return &repository{db: db}
}
