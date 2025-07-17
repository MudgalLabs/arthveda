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

		// TODO: Have 2 log levels - development and production separated.
		level := zap.InfoLevel
		levelEnv := env.LOG_LEVEL
		if levelEnv != "" {
			levelFromEnv, err := zapcore.ParseLevel(levelEnv)
			if err != nil {
				log.Println(
					fmt.Errorf("invalid level, defaulting to INFO: %w", err),
				)
			} else {
				level = levelFromEnv
			}
		}

		logLevel := zap.NewAtomicLevelAt(level)

		developmentCfg := zap.NewDevelopmentEncoderConfig()
		developmentCfg.EncodeLevel = zapcore.CapitalColorLevelEncoder
		consoleEncoder := zapcore.NewConsoleEncoder(developmentCfg)

		productionCfg := zap.NewProductionEncoderConfig()
		productionCfg.TimeKey = "timestamp"
		productionCfg.EncodeTime = zapcore.ISO8601TimeEncoder

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

		var cores []zapcore.Core
		cores = append(cores, zapcore.NewCore(consoleEncoder, stdout, logLevel))

		// Only add file logger if env.LOG_FILE is set
		if env.LOG_FILE != "" {
			// prepend "/app/logs/" if the file path does not start with it
			filePath := env.LOG_FILE
			if filePath[:10] != "/app/logs/" {
				filePath = "/app/logs/" + filePath
			}
			file := zapcore.AddSync(&lumberjack.Logger{
				Filename:   filePath,
				MaxSize:    256, // megabytes
				MaxBackups: 4,   // Maximum number of old log files to keep
				MaxAge:     7,   // days
			})
			cores = append(cores, zapcore.NewCore(fileEncoder, file, logLevel).
				With([]zapcore.Field{zap.String("git_revision", gitRevision)}),
			)
		}

		core := zapcore.NewTee(cores...)
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
	}
	if l := logger; l != nil {
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
