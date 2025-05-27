package repository

import "strings"

func WhereSQL(where []string) string {
	if len(where) == 0 {
		return ""
	}

	str := " WHERE "
	return str + strings.Join(where, ", ")
}
