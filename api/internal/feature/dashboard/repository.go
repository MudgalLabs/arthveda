package dashboard

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface{}

type Writer interface{}

type ReadWriter interface {
	Reader
	Writer
}

type dashboardRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *dashboardRepository {
	return &dashboardRepository{db}
}
