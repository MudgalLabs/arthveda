package common

import (
	"math"
)

type Pagination struct {
	Page  int `query:"page" json:"page" validate:"gte=1"`
	Limit int `query:"limit" json:"limit" validate:"gte=1,lte=1000"`
}

func (p *Pagination) ApplyDefaults() {
	if p.Page == 0 {
		p.Page = 1
	}
	if p.Limit == 0 {
		p.Limit = 10
	}
}

func (p Pagination) Offset() int {
	return (p.Page - 1) * p.Limit
}

func (p Pagination) totalPages(totalItems int) int {
	if p.Limit == 0 {
		return 0
	}
	return int(math.Ceil(float64(totalItems) / float64(p.Limit)))
}

type PaginationMeta struct {
	Pagination
	TotalItems int `json:"total_items"`
	TotalPages int `json:"total_pages"`
}

func (p *Pagination) GetMeta(totalItems int) PaginationMeta {
	return PaginationMeta{
		Pagination: *p,
		TotalItems: totalItems,
		TotalPages: p.totalPages(totalItems),
	}
}
