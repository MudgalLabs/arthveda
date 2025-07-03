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
		return "="
	default:
		return ""
	}
}

func (o *Operator) IsValid() bool {
	switch *o {
	case OperatorGTE, OperatorGT, OperatorLTE, OperatorLT, OperatorEQ:
		return true
	default:
		return false
	}
}

// parseOperator will check if the string provided is `Operator` enum
// or a valid string SQL for compare.
func parseOperator(o Operator) string {
	// If `""` that measn `op` wasn't of type `Operator`.
	if o.SQL() != "" {
		return o.SQL()
	}

	// Allow raw SQL operators directly
	switch o.String() {
	case "=", "!=", "<", "<=", ">", ">=":
		return o.String()
	}

	return "" // invalid
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
func (b *SQLBuilder) AddCompareFilter(column string, operator Operator, value any) {
	if column == "" || operator == "" || value == nil {
		return
	}

	operatorSQL := parseOperator(operator)

	condition := fmt.Sprintf("%s %s $%d", column, operatorSQL, b.nextArg())
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

// addLikeFilter adds a LIKE condition with custom pattern (private helper)
func (b *SQLBuilder) addLikeFilter(column string, pattern string, caseSensitive bool) {
	if column == "" || pattern == "" {
		return
	}

	operator := "LIKE"
	if !caseSensitive {
		operator = "ILIKE"
	}

	condition := fmt.Sprintf("%s %s $%d", column, operator, b.nextArg())
	b.where = append(b.where, condition)
	b.args = append(b.args, pattern)
}

// AddStartsWithFilter adds a LIKE condition for prefix matching ("value%")
func (b *SQLBuilder) AddStartsWithFilter(column string, value string, caseSensitive bool) {
	if column == "" || value == "" {
		return
	}
	b.addLikeFilter(column, value+"%", caseSensitive)
}

// AddEndsWithFilter adds a LIKE condition for suffix matching ("%value")
func (b *SQLBuilder) AddEndsWithFilter(column string, value string, caseSensitive bool) {
	if column == "" || value == "" {
		return
	}
	b.addLikeFilter(column, "%"+value, caseSensitive)
}

// AddContainsFilter adds a LIKE condition for substring matching ("%value%")
func (b *SQLBuilder) AddContainsFilter(column string, value string, caseSensitive bool) {
	if column == "" || value == "" {
		return
	}
	b.addLikeFilter(column, "%"+value+"%", caseSensitive)
}

func (b *SQLBuilder) AddGroupBy(columns ...string) {
	b.groupBy = append(b.groupBy, columns...)
}

// AddSorting adds an ORDER BY clause.
func (b *SQLBuilder) AddSorting(field, order string) {
	if field == "" {
		return
	}
	if strings.ToUpper(order) != "ASC" && strings.ToUpper(order) != "DESC" {
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

// Count builds a SQL query for counting number of rows with filters (no order/limit/offset).
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

// ArgNum returns the next argument number (for manual filter building).
func (b *SQLBuilder) ArgNum() int {
	return b.argNum
}

// AppendWhere allows adding a custom WHERE clause with arguments.
func (b *SQLBuilder) AppendWhere(condition string, args ...any) {
	b.where = append(b.where, condition)
	b.args = append(b.args, args...)
	b.argNum += len(args)
}

func (b *SQLBuilder) nextArg() int {
	arg := b.argNum
	b.argNum++
	return arg
}
