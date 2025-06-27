package logger

import (
	"arthveda/internal/env"
	"context"
	"fmt"
	"log"
	"os"
	"runtime/debug"
	"sync"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

type ctxKey struct{}

var once sync.Once

var logger *zap.SugaredLogger

// Get initializes a zap.SugaredLogger instance if it has not been initialized
// already and returns the same instance for subsequent calls.
func Get() *zap.SugaredLogger {
	once.Do(func() {
		stdout := zapcore.AddSync(os.Stdout)

		// TODO: Have 2 log levels - development and production seperated.
		level := zap.InfoLevel
		levelEnv := env.LOG_LEVEL
		if levelEnv != "" {
			levelFromEnv, err := zapcore.ParseLevel(levelEnv)
			if err != nil {
				log.Println(
					fmt.Errorf("invalid level, defaulting to INFO: %w", err),
				)
			}

			level = levelFromEnv
		}

		logLevel := zap.NewAtomicLevelAt(level)

		productionCfg := zap.NewProductionEncoderConfig()
		productionCfg.TimeKey = "timestamp"
		productionCfg.EncodeTime = zapcore.ISO8601TimeEncoder

		stdoutEncoder := zapcore.NewJSONEncoder(productionCfg)

		fileEncoder := zapcore.NewJSONEncoder(productionCfg)

		var gitRevision string

		buildInfo, ok := debug.ReadBuildInfo()
		if ok {
			for _, v := range buildInfo.Settings {
				if v.Key == "vcs.revision" {
					gitRevision = v.Value
					break
				}
			}
		}

		file := zapcore.AddSync(&lumberjack.Logger{
			Filename:   env.LOG_FILE,
			MaxSize:    256, // megabytes
			MaxBackups: 4,   // Maximum number of old log files to keep
			MaxAge:     7,   // days
		})

		// log to multiple destinations (stdout and file)
		// extra fields are added to the JSON output alone
		core := zapcore.NewTee(
			zapcore.NewCore(stdoutEncoder, stdout, logLevel).With(
				[]zapcore.Field{
					zap.String("git_revision", gitRevision),
				},
			),
			zapcore.NewCore(fileEncoder, file, logLevel).
				With(
					[]zapcore.Field{
						zap.String("git_revision", gitRevision),
					},
				),
		)

		logger = zap.New(core, zap.AddCaller()).Sugar()
	})

	return logger
}

// FromCtx returns the Logger associated with the ctx. If no logger
// is associated, the default logger is returned, unless it is nil
// in which case a disabled logger is returned.
func FromCtx(ctx context.Context) *zap.SugaredLogger {
	if l, ok := ctx.Value(ctxKey{}).(*zap.SugaredLogger); ok {
		return l
	} else if l := logger; l != nil {
		return l
	}

	return zap.NewNop().Sugar()
}

// WithCtx returns a copy of ctx with the Logger attached.
func WithCtx(ctx context.Context, l *zap.SugaredLogger) context.Context {
	if lp, ok := ctx.Value(ctxKey{}).(*zap.SugaredLogger); ok {
		if lp == l {
			// Do not store same logger.
			return ctx
		}
	}

	return context.WithValue(ctx, ctxKey{}, l)
}
