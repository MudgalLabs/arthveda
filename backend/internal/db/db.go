package db

import (
	"arthveda/internal/lib/env"
	"arthveda/internal/logger"
	"context"
	"fmt"
	"log"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var DB *pgxpool.Pool

func Init() error {
	l := logger.Get()
	l.Info("connecting to database")

	connectionStr := fmt.Sprintf("host=%s port=%s dbname=%s user=%s password=%s sslmode=disable", env.DB_HOST, env.DB_PORT, env.DB_NAME, env.DB_USER, env.DB_PASSWORD)

	l.Debug("conectionStr: ", connectionStr)

	config, err := pgxpool.ParseConfig(connectionStr)
	if err != nil {
		log.Panic(err)
	}

	// So that we can log SQL query on execution.
	config.ConnConfig.Tracer = &myQueryTracer{}

	db, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Panic(err)
	}

	l.Info("connected to database")

	// Set it to global variable.
	DB = db

	return nil
}

type myQueryTracer struct {
}

func (tracer *myQueryTracer) TraceQueryStart(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryStartData) context.Context {
	l := logger.FromCtx(ctx)
	l.Debugw("executing SQL query", "sqlstr", data.SQL, "args", data.Args)
	return ctx
}

func (tracer *myQueryTracer) TraceQueryEnd(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryEndData) {
	if data.Err != nil {
		l := logger.FromCtx(ctx)
		l.Debugw("error executing SQL query", "err", data.Err)
	}
}
