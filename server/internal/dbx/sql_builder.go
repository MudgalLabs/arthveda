package dbx

import (
	"fmt"
	"strings"
	"time"
)

type DateRange struct {
	From time.Time `json:"from"`
	To   time.Time `json:"to"`
}

type Operator string

const (
	OperatorGTE Operator = "gte"
	OperatorGT  Operator = "gt"
	OperatorLTE Operator = "lte"
	OperatorLT  Operator = "lt"
	OperatorEQ  Operator = "eq"
)

func (o *Operator) String() string {
	return string(*o)
}

func (o *Operator) SQL() string {
	switch *o {
	case OperatorGTE:
		return ">="
	case OperatorGT:
		return ">"
	case OperatorLTE:
		return "<="
	case OperatorLT:
		return "<"
	case OperatorEQ:
		return "=="
	}

	panic(fmt.Sprintf("found invalid operator: %s", o))
}

type SQLBuilder struct {
	base    strings.Builder
	where   []string
	order   string
	limit   string
	offset  string
	groupBy []string
	args    []any
	argNum  int
}

// NewSQLBuilder initializes the SQL builder with a base SELECT clause.
func NewSQLBuilder(baseSQL string) *SQLBuilder {
	var sb strings.Builder
	sb.WriteString(baseSQL)

	return &SQLBuilder{
		base:    sb,
		where:   []string{},
		groupBy: []string{},
		args:    []any{},
		argNum:  1,
	}
}

// AddCompareFilter adds a single condition like "column = $N", "column >= $N"
func (b *SQLBuilder) AddCompareFilter(column string, operator string, value any) {
	if column == "" || operator == "" || value == nil {
		return
	}
	condition := fmt.Sprintf("%s %s $%d", column, operator, b.nextArg())
	b.where = append(b.where, condition)
	b.args = append(b.args, value)
}

// AddBetweenFilter adds a BETWEEN condition like "column BETWEEN $N AND $N+1"
func (b *SQLBuilder) AddBetweenFilter(column string, from, to any) {
	if from == nil || to == nil {
		return
	}
	condition := fmt.Sprintf("%s BETWEEN $%d AND $%d", column, b.argNum, b.argNum+1)
	b.where = append(b.where, condition)
	b.args = append(b.args, from, to)
	b.argNum += 2
}

// AddArrayFilter adds a condition like "column = ANY($N)" for array values
func (b *SQLBuilder) AddArrayFilter(column string, values []any) {
	if len(values) == 0 {
		return
	}
	condition := fmt.Sprintf("%s = ANY($%d)", column, b.nextArg())
	b.where = append(b.where, condition)
	b.args = append(b.args, values)
}

func (b *SQLBuilder) AddGroupBy(columns ...string) {
	b.groupBy = append(b.groupBy, columns...)
}

// AddSorting adds an ORDER BY clause.
func (b *SQLBuilder) AddSorting(field, order string) {
	if field == "" {
		return
	}
	if order != "ASC" && order != "DESC" {
		order = "ASC"
	}
	b.order = fmt.Sprintf("ORDER BY %s %s", field, order)
}

// AddPagination adds LIMIT/OFFSET clauses.
func (b *SQLBuilder) AddPagination(limit, offset int) {
	if limit > 0 {
		b.limit = fmt.Sprintf("LIMIT %d", limit)
	}
	if offset > 0 {
		b.offset = fmt.Sprintf("OFFSET %d", offset)
	}
}

// Build returns the final SQL query and args.
func (b *SQLBuilder) Build() (string, []any) {
	var final strings.Builder
	final.WriteString(b.base.String())

	if len(b.where) > 0 {
		final.WriteString(" WHERE ")
		final.WriteString(strings.Join(b.where, " AND "))
	}
	if len(b.groupBy) > 0 {
		final.WriteString(" GROUP BY ")
		final.WriteString(strings.Join(b.groupBy, ", "))
	}
	if b.order != "" {
		final.WriteString(" ")
		final.WriteString(b.order)
	}
	if b.limit != "" {
		final.WriteString(" ")
		final.WriteString(b.limit)
	}
	if b.offset != "" {
		final.WriteString(" ")
		final.WriteString(b.offset)
	}

	return final.String(), b.args
}

// CountSQL builds a SQL query for counting number of rows with filters (no order/limit/offset).
func (b *SQLBuilder) Count() (string, []any) {
	var sb strings.Builder
	sb.WriteString("SELECT COUNT(*) FROM (")

	base := b.base.String()

	fromIndex := strings.Index(strings.ToUpper(base), "FROM")
	if fromIndex == -1 {
		panic("base SQL must include FROM clause")
	}
	sb.WriteString("SELECT 1 ")
	sb.WriteString(base[fromIndex:]) // FROM ... onwards

	if len(b.where) > 0 {
		sb.WriteString(" WHERE ")
		sb.WriteString(strings.Join(b.where, " AND "))
	}

	if len(b.groupBy) > 0 {
		sb.WriteString(" GROUP BY ")
		sb.WriteString(strings.Join(b.groupBy, ", "))
	}
	sb.WriteString(") AS count_alias")

	return sb.String(), b.args
}

func (b *SQLBuilder) nextArg() int {
	arg := b.argNum
	b.argNum++
	return arg
}
