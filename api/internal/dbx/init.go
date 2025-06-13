package dbx

import (
	"arthveda/internal/env"
	"arthveda/internal/logger"
	"arthveda/internal/session"
	"context"
	"log"
	"time"

	"github.com/alexedwards/scs/pgxstore"
	pgxdecimal "github.com/jackc/pgx-shopspring-decimal"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

func Init() (*pgxpool.Pool, error) {
	l := logger.Get()

	connectionStr := env.DB_URL
	l.Info("connecting to database")
	l.Debug("conectionStr: ", connectionStr)

	config, err := pgxpool.ParseConfig(connectionStr)
	if err != nil {
		log.Panic(err)
		return nil, err
	}

	// So that we can log SQL query on execution.
	config.ConnConfig.Tracer = &myQueryTracer{}

	config.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
		// Register `pgxdecimal` so that we can use `decimal.Decimal` for values while scaning or inserting records.
		pgxdecimal.Register(conn.TypeMap())
		return nil
	}

	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		log.Panic(err)
		return nil, err
	}

	session.Manager.Store = pgxstore.NewWithCleanupInterval(pool, 12*time.Hour)

	// Checking if the connection to the DB is working fine.
	err = pool.Ping(context.Background())
	if err != nil {
		log.Panic(err)
		return nil, err
	}

	l.Info("connected to database")

	return pool, nil
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
