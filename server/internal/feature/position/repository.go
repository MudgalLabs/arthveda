package position

import (
	"arthveda/internal/common"
	"arthveda/internal/dbx"
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	Search(ctx context.Context, payload SearchPayload) ([]*Position, int, error)
}

type Writer interface {
	Create(ctx context.Context, position *Position) error
	Delete(ctx context.Context, ID uuid.UUID) error
}

type ReadWriter interface {
	Reader
	Writer
}

//
// PostgreSQL implementation
//

const (
	searchFieldCreatedBy           common.SearchField = "created_by"
	searchFieldOpened              common.SearchField = "opened"
	searchFieldSymbol              common.SearchField = "symbol"
	searchFieldInstrument          common.SearchField = "instrument"
	searchFieldDirection           common.SearchField = "direction"
	searchFieldStatus              common.SearchField = "status"
	searchFieldRFactor             common.SearchField = "r_factor"
	searchFieldGrossPnL            common.SearchField = "gross_pnl"
	searchFieldNetPnL              common.SearchField = "net_pnl"
	searchFieldNetReturnPercentage common.SearchField = "net_return_percentage"
	searchFieldChargesPercentage   common.SearchField = "charges_percentage"
	searchFieldBrokerID            common.SearchField = "broker_id"
)

type searchFilter struct {
	// Only ADMIN clients should have access to `CreatedBy`
	// For people using arthveda.io client, this filter will be set to their user ID.
	CreatedBy *uuid.UUID `json:"created_by"`

	Opened                      *common.DateRangeFilter `json:"opened"`
	Symbol                      *string                 `json:"symbol"`
	Instrument                  *Instrument             `json:"instrument"`
	Direction                   *Direction              `json:"direction"`
	Status                      *Status                 `json:"status"`
	RFactor                     *float64                `json:"r_factor"`
	RFactorOperator             *dbx.Operator           `json:"r_factor_operator"`
	GrossPnL                    *string                 `json:"gross_pnl"`
	GrossPnLOperator            *dbx.Operator           `json:"gross_pnl_operator"`
	NetPnL                      *string                 `json:"net_pnl"`
	NetPnLOperator              *dbx.Operator           `json:"net_pnl_operator"`
	NetReturnPercentage         *float64                `json:"net_return_percentage"`
	NetReturnPercentageOperator *dbx.Operator           `json:"net_return_percentage_operator"`
	ChargesPercentage           *float64                `json:"charges_percentage"`
	ChargesPercentageOperator   *dbx.Operator           `json:"charges_percentage_operator"`
}

var allowedSortFields = []common.SearchField{
	searchFieldOpened,
	searchFieldSymbol,
	searchFieldInstrument,
	searchFieldDirection,
	searchFieldStatus,
	searchFieldRFactor,
	searchFieldGrossPnL,
	searchFieldNetPnL,
	searchFieldNetReturnPercentage,
	searchFieldChargesPercentage,
}

var searchFieldsSQLColumn = map[common.SearchField]string{
	searchFieldCreatedBy:           "p.created_by",
	searchFieldOpened:              "p.opened_at",
	searchFieldSymbol:              "UPPER(p.symbol)", // Make sure to do `strings.ToUpper` when passing the symbol filter value.
	searchFieldInstrument:          "p.instrument",
	searchFieldDirection:           "p.direction",
	searchFieldStatus:              "p.status",
	searchFieldRFactor:             "p.r_factor",
	searchFieldGrossPnL:            "p.gross_pnl_amount",
	searchFieldNetPnL:              "p.net_pnl_amount",
	searchFieldNetReturnPercentage: "p.net_return_percentage",
	searchFieldChargesPercentage:   "p.charges_as_percentage_of_net_pnl",
	searchFieldBrokerID:            "p.broker_id",
}

type positionRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) *positionRepository {
	return &positionRepository{db}
}

func (r *positionRepository) Create(ctx context.Context, position *Position) error {
	const sql = `
        INSERT INTO position (
            id, created_by, created_at, updated_at, symbol, instrument, currency,
            risk_amount, charges_amount, direction, status, opened_at, closed_at,
            gross_pnl_amount, net_pnl_amount, r_factor, net_return_percentage,
            charges_as_percentage_of_net_pnl, open_quantity, open_average_price_amount,
            broker_id
        )
        VALUES (
            @id, @created_by, @created_at, @updated_at, @symbol, @instrument, @currency,
            @risk_amount, @charges_amount, @direction, @status, @opened_at, @closed_at,
            @gross_pnl_amount, @net_pnl_amount, @r_factor, @net_return_percentage,
            @charges_as_percentage_of_net_pnl, @open_quantity, @open_average_price_amount,
            @broker_id
        )
    `

	_, err := r.db.Exec(ctx, sql, pgx.NamedArgs{
		"id":                               position.ID,
		"created_by":                       position.CreatedBy,
		"created_at":                       position.CreatedAt,
		"updated_at":                       position.UpdatedAt,
		"symbol":                           position.Symbol,
		"instrument":                       position.Instrument,
		"currency":                         position.Currency,
		"risk_amount":                      position.RiskAmount,
		"charges_amount":                   position.ChargesAmount,
		"direction":                        position.Direction,
		"status":                           position.Status,
		"opened_at":                        position.OpenedAt,
		"closed_at":                        position.ClosedAt,
		"gross_pnl_amount":                 position.GrossPnLAmount,
		"net_pnl_amount":                   position.NetPnLAmount,
		"r_factor":                         position.RFactor,
		"net_return_percentage":            position.NetReturnPercentage,
		"charges_as_percentage_of_net_pnl": position.ChargesAsPercentageOfNetPnL,
		"open_quantity":                    position.OpenQuantity,
		"open_average_price_amount":        position.OpenAveragePriceAmount,
		"broker_id":                        position.BrokerID,
	})

	if err != nil {
		return fmt.Errorf("sql exec: %w", err)
	}

	return nil
}

func (r *positionRepository) Delete(ctx context.Context, ID uuid.UUID) error {
	const sql = `
        DELETE FROM position
        WHERE id = @id
    `

	_, err := r.db.Exec(ctx, sql, pgx.NamedArgs{"id": ID})
	if err != nil {
		return fmt.Errorf("sql exec: %w", err)
	}

	return nil
}

// TODO: Add a flag argument like `attach_trades` and if true, we should loop through
// the position(s) and fetch theit trade(s) and append it so `Postiion.Trades`.
func (r *positionRepository) Search(ctx context.Context, p SearchPayload) ([]*Position, int, error) {
	baseSQL := `
		SELECT
            p.id, p.created_by, p.created_at, p.updated_at,
            p.symbol, p.instrument, p.currency, p.risk_amount, p.charges_amount,
            p.direction, p.status, p.opened_at, p.closed_at,
            p.gross_pnl_amount, p.net_pnl_amount, p.r_factor, p.net_return_percentage,
            p.charges_as_percentage_of_net_pnl, p.open_quantity, p.open_average_price_amount,
            p.broker_id
        FROM
			position p`

	b := dbx.NewSQLBuilder(baseSQL)

	if p.Filters.CreatedBy != nil {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldCreatedBy], "=", p.Filters.CreatedBy)
	}

	if p.Filters.Symbol != nil && *p.Filters.Symbol != "" {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldSymbol], "=", strings.ToUpper(*p.Filters.Symbol))
	}

	if p.Filters.Opened != nil {
		if p.Filters.Opened.From != nil {
			b.AddCompareFilter(searchFieldsSQLColumn[searchFieldOpened], ">=", p.Filters.Opened.From)
		}
		if p.Filters.Opened.To != nil {
			b.AddCompareFilter(searchFieldsSQLColumn[searchFieldOpened], "<=", p.Filters.Opened.To)
		}
	}

	if p.Filters.Instrument != nil && *p.Filters.Instrument != "" {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldInstrument], "=", *p.Filters.Instrument)
	}

	if p.Filters.Direction != nil && *p.Filters.Direction != "" {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldDirection], "=", *p.Filters.Direction)
	}

	if p.Filters.Status != nil && *p.Filters.Status != "" && *p.Filters.Status != "all" {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldStatus], "=", *p.Filters.Status)
	}

	if p.Filters.RFactor != nil {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldRFactor], *p.Filters.RFactorOperator, *p.Filters.RFactor)
	}

	if p.Filters.GrossPnL != nil && *p.Filters.GrossPnL != "" {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldGrossPnL], *p.Filters.GrossPnLOperator, *p.Filters.GrossPnL)
	}

	if p.Filters.NetPnL != nil && *p.Filters.NetPnL != "" {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldNetPnL], *p.Filters.NetPnLOperator, *p.Filters.NetPnL)
	}

	if p.Filters.NetReturnPercentage != nil {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldNetReturnPercentage], *p.Filters.NetReturnPercentageOperator, *p.Filters.NetReturnPercentage)
	}

	if p.Filters.ChargesPercentage != nil {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldChargesPercentage], *p.Filters.ChargesPercentageOperator, *p.Filters.ChargesPercentage)
	}

	b.AddSorting(searchFieldsSQLColumn[p.Sort.Field], p.Sort.Order)
	b.AddPagination(p.Pagination.Limit, p.Pagination.Offset())

	sql, args := b.Build()

	rows, err := r.db.Query(ctx, sql, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("query: %w", err)
	}

	defer rows.Close()

	positions := []*Position{}

	for rows.Next() {
		var pos Position

		err := rows.Scan(
			&pos.ID, &pos.CreatedBy, &pos.CreatedAt, &pos.UpdatedAt,
			&pos.Symbol, &pos.Instrument, &pos.Currency, &pos.RiskAmount, &pos.ChargesAmount,
			&pos.Direction, &pos.Status, &pos.OpenedAt, &pos.ClosedAt,
			&pos.GrossPnLAmount, &pos.NetPnLAmount, &pos.RFactor, &pos.NetReturnPercentage,
			&pos.ChargesAsPercentageOfNetPnL, &pos.OpenQuantity, &pos.OpenAveragePriceAmount,
			&pos.BrokerID,
		)

		if err != nil {
			return nil, 0, fmt.Errorf("scan: %w", err)
		}

		positions = append(positions, &pos)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("rows err: %w", err)
	}

	var total int
	countSQL, countArgs := b.Count()

	err = r.db.QueryRow(ctx, countSQL, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	return positions, total, nil
}
