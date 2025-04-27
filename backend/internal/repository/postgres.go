package repository

import "strings"

func WhereSQL(where []string) string {
	str := " WHERE "
	return str + strings.Join(where, ", ")
}
