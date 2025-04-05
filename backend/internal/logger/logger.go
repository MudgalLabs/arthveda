package logger

import (
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

var Log zerolog.Logger

func Init() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	output := zerolog.ConsoleWriter{Out: os.Stdout, TimeFormat: time.RFC3339, NoColor: false}

	output.FormatLevel = func(i any) string {
		return strings.ToUpper(fmt.Sprintf("| %-6s|", i))
	}

	Log = zerolog.New(output).With().Timestamp().Logger()
	Log.Debug().Msg("Logger initialized")
}
