package main

import (
	"arthveda/internal/env"
	"context"
	"log"

	bodhveda "github.com/MudgalLabs/bodhveda/sdk/go"
	"github.com/jackc/pgx/v5"
)

func main() {
	log.Println("Starting creation of bodhveda recipients...")

	ctx := context.Background()

	env.Init("../../../.env")

	conn, err := pgx.Connect(ctx, env.DB_URL)
	if err != nil {
		log.Fatalf("unable to connect to DB: %v", err)
	}

	defer conn.Close(ctx)

	log.Println("Fetching user profiles...")

	sql := `
		SELECT user_id, name FROM user_profile;
	`

	rows, err := conn.Query(ctx, sql)
	if err != nil {
		log.Fatalf("query error: %v", err)
	}

	defer rows.Close()

	recipients := []bodhveda.CreateRecipientRequest{}
	for rows.Next() {
		var userID string
		var name string

		err := rows.Scan(&userID, &name)
		if err != nil {
			log.Fatalf("row scan error: %v", err)
		}

		recipients = append(recipients, bodhveda.CreateRecipientRequest{
			ID:   userID,
			Name: &name,
		})
	}

	log.Printf("Fetched %d user profiles.", len(recipients))
	log.Printf("Creating recipients in Bodhveda...")

	client := bodhveda.NewClient(env.BODHVEDA_API_KEY, &bodhveda.ClientOptions{
		APIURL: env.BODHVEDA_API_URL,
	})

	req := &bodhveda.CreateRecipientsBatchRequest{Recipients: recipients}
	res, err := client.Recipients.CreateBatch(ctx, req)
	if err != nil {
		log.Fatalf("error creating recipients: %v", err)
	}

	log.Printf("Successfully created %d recipients.", len(res.Created))
	log.Printf("Successfully updated %d recipients.", len(res.Updated))
	log.Printf("Failed to create %d recipients.", len(res.Failed))
}
