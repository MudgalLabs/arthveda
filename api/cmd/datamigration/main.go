package main

import (
	"arthveda/internal/env"
	"context"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type LegacyPosition struct {
	UserID   uuid.UUID
	BrokerID uuid.UUID
}

func main() {
	ctx := context.Background()

	env.Init("./.env")

	conn, err := pgx.Connect(ctx, env.DB_URL)
	if err != nil {
		log.Fatalf("unable to connect to DB: %v", err)
	}
	defer conn.Close(ctx)

	log.Println("Starting backfill of user_broker_account...")

	// Begin transaction
	tx, err := conn.Begin(ctx)
	if err != nil {
		log.Fatalf("unable to start transaction: %v", err)
	}
	defer func() {
		if err != nil {
			log.Println("Rolling back transaction due to error.")
			tx.Rollback(ctx)
		} else {
			log.Println("Committing transaction.")
			err = tx.Commit(ctx)
			if err != nil {
				log.Fatalf("commit failed: %v", err)
			}
		}
	}()

	// Step 1: Find distinct (user_id, broker_id) pairs
	rows, err := tx.Query(ctx, `
		SELECT DISTINCT created_by, broker_id
		FROM position
		WHERE broker_id IS NOT NULL
		  AND user_broker_account_id IS NULL
	`)
	if err != nil {
		log.Fatalf("query error: %v", err)
	}
	defer rows.Close()

	var entries []LegacyPosition
	for rows.Next() {
		var lp LegacyPosition
		if err := rows.Scan(&lp.UserID, &lp.BrokerID); err != nil {
			log.Fatalf("scan error: %v", err)
		}
		entries = append(entries, lp)
	}

	log.Printf("Found %d unique (user, broker) pairs to backfill\n", len(entries))

	// Step 2: Insert broker accounts + update positions
	for _, e := range entries {
		accountID := uuid.New()

		_, err := tx.Exec(ctx, `
			INSERT INTO user_broker_account (
				id, created_at, name, broker_id, user_id, enable_auto_sync
			) VALUES ($1, $2, $3, $4, $5, FALSE)
		`, accountID, time.Now(), "Default", e.BrokerID, e.UserID)
		if err != nil {
			log.Fatalf("insert error: %v", err)
		}

		ct, err := tx.Exec(ctx, `
			UPDATE position
			SET user_broker_account_id = $1
			WHERE broker_id = $2
			  AND created_by = $3
			  AND user_broker_account_id IS NULL
		`, accountID, e.BrokerID, e.UserID)
		if err != nil {
			log.Fatalf("update error: %v", err)
		}

		log.Printf("Backfilled user %s / broker %s — %d positions updated\n",
			e.UserID, e.BrokerID, ct.RowsAffected())
	}

	log.Println("✅ Backfill complete.")
}
