package position

import (
	"arthveda/internal/common"
	"arthveda/internal/dbx"
	"arthveda/internal/domain/symbol"
	"arthveda/internal/domain/types"
	"arthveda/internal/feature/tag"
	"arthveda/internal/feature/trade"
	"arthveda/internal/repository"
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Reader interface {
	GetByID(ctx context.Context, createdBy, positionID uuid.UUID) (*Position, error)
	Search(ctx context.Context, payload SearchPayload, attachTrades, attachTags bool) ([]*Position, int, error)
	SearchSymbols(ctx context.Context, userID uuid.UUID, query string) ([]string, error)
	NoOfPositionsOlderThanTwelveMonths(ctx context.Context, userID uuid.UUID) (int, error)
	TotalPositions(ctx context.Context, userID uuid.UUID) (int, error)
}

type Writer interface {
	Create(ctx context.Context, position *Position) error
	Update(ctx context.Context, position *Position) error
	Delete(ctx context.Context, positionID uuid.UUID) error
}

type ReadWriter interface {
	Reader
	Writer
}

//
// PostgreSQL implementation
//

type positionRepository struct {
	db              *pgxpool.Pool
	tradeRepository trade.ReadWriter
	tagRepository   tag.ReadWriter
}

func NewRepository(db *pgxpool.Pool, tradeRepository trade.ReadWriter, tagRepository tag.ReadWriter) *positionRepository {
	return &positionRepository{db, tradeRepository, tagRepository}
}

const (
	searchFieldID                  common.SearchField = "id"
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
	searchFieldUserBrokerAccountID common.SearchField = "broker_account_id"
	searchFieldTotalCharges        common.SearchField = "total_charges_amount"

	// We can use this field to search for positions based on their trade time.
	// Meaning if we pass April 1 to April 30, it will return all positions
	// that have trades executed in that time range.
	// Very helpful when we are looking for positions that were active during a specific time period.
	// To calculate many things like PnL, cumulative PnL in buckets, etc.
	searchFieldTradeTime common.SearchField = "trade_time"
)

type SearchFilter struct {
	// If a user is serching for a specific position, we will make sure
	// that the Position.CreatedBy matches the current user ID otherwise we will
	// return a repository.ErrNotFound error.
	ID *uuid.UUID `json:"id"`
	// Only ADMIN clients should have access to `CreatedBy`
	// For people using arthveda.io client, this filter will be set to their user ID.
	CreatedBy *uuid.UUID `json:"created_by"`

	Opened                      *common.DateRangeFilter `json:"opened"`
	Symbol                      *string                 `json:"symbol"`
	Instrument                  *types.Instrument       `json:"instrument"`
	Direction                   *Direction              `json:"direction"`
	Status                      *Status                 `json:"status"`
	RFactor                     *string                 `json:"r_factor"`
	RFactorOperator             *dbx.Operator           `json:"r_factor_operator"`
	GrossPnL                    *string                 `json:"gross_pnl"`
	GrossPnLOperator            *dbx.Operator           `json:"gross_pnl_operator"`
	NetPnL                      *string                 `json:"net_pnl"`
	NetPnLOperator              *dbx.Operator           `json:"net_pnl_operator"`
	NetReturnPercentage         *string                 `json:"net_return_percentage"`
	NetReturnPercentageOperator *dbx.Operator           `json:"net_return_percentage_operator"`
	ChargesPercentage           *string                 `json:"charges_percentage"`
	ChargesPercentageOperator   *dbx.Operator           `json:"charges_percentage_operator"`
	UserBrokerAccountID         *uuid.UUID              `json:"user_broker_account_id"`

	TradeTime *common.DateRangeFilter `json:"trade_time"`
	TagIDs    []uuid.UUID             `json:"tag_ids"`
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
	searchFieldTotalCharges,
	searchFieldTradeTime,
}

var searchFieldsSQLColumn = map[common.SearchField]string{
	searchFieldID:                  "p.id",
	searchFieldCreatedBy:           "p.created_by",
	searchFieldOpened:              "p.opened_at",
	searchFieldSymbol:              "p.symbol",
	searchFieldInstrument:          "p.instrument",
	searchFieldDirection:           "p.direction",
	searchFieldStatus:              "p.status",
	searchFieldRFactor:             "p.r_factor",
	searchFieldGrossPnL:            "p.gross_pnl_amount",
	searchFieldNetPnL:              "p.net_pnl_amount",
	searchFieldNetReturnPercentage: "p.net_return_percentage",
	searchFieldChargesPercentage:   "p.charges_as_percentage_of_net_pnl",
	searchFieldUserBrokerAccountID: "p.user_broker_account_id",
	searchFieldTotalCharges:        "p.total_charges_amount",
	searchFieldTradeTime:           "t.time", // This is used when we want to filter positions based on their trades' time.
}

func (r *positionRepository) Create(ctx context.Context, position *Position) error {
	const sql = `
        INSERT INTO position (
            id, created_by, created_at, updated_at, symbol, instrument, currency,
            risk_amount, notes, total_charges_amount, direction, status, opened_at, closed_at,
            gross_pnl_amount, net_pnl_amount, r_factor, net_return_percentage,
            charges_as_percentage_of_net_pnl, open_quantity, open_average_price_amount,
            broker_id, user_broker_account_id
        )
        VALUES (
            @id, @created_by, @created_at, @updated_at, @symbol, @instrument, @currency,
            @risk_amount, @notes, @total_charges_amount, @direction, @status, @opened_at, @closed_at,
            @gross_pnl_amount, @net_pnl_amount, @r_factor, @net_return_percentage,
            @charges_as_percentage_of_net_pnl, @open_quantity, @open_average_price_amount,
            @broker_id, @user_broker_account_id
        )
    `

	_, err := r.db.Exec(ctx, sql, pgx.NamedArgs{
		"id":                               position.ID,
		"created_by":                       position.CreatedBy,
		"created_at":                       position.CreatedAt,
		"updated_at":                       position.UpdatedAt,
		"symbol":                           symbol.Sanitize(position.Symbol, position.Instrument),
		"instrument":                       position.Instrument,
		"currency":                         position.Currency,
		"risk_amount":                      position.RiskAmount,
		"notes":                            position.Notes,
		"total_charges_amount":             position.TotalChargesAmount,
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
		"user_broker_account_id":           position.UserBrokerAccountID,
	})

	if err != nil {
		return fmt.Errorf("sql exec: %w", err)
	}

	return nil
}

func (r *positionRepository) Update(ctx context.Context, position *Position) error {
	const sql = `
        UPDATE position
        SET
            created_by = @created_by,
            created_at = @created_at,
            updated_at = @updated_at,
            symbol = @symbol,
            instrument = @instrument,
            currency = @currency,
            risk_amount = @risk_amount,
			notes = @notes,
            total_charges_amount = @total_charges_amount,
            direction = @direction,
            status = @status,
            opened_at = @opened_at,
            closed_at = @closed_at,
            gross_pnl_amount = @gross_pnl_amount,
            net_pnl_amount = @net_pnl_amount,
            r_factor = @r_factor,
            net_return_percentage = @net_return_percentage,
            charges_as_percentage_of_net_pnl = @charges_as_percentage_of_net_pnl,
            open_quantity = @open_quantity,
            open_average_price_amount = @open_average_price_amount,
            broker_id = @broker_id,
            user_broker_account_id = @user_broker_account_id
        WHERE id = @id
    `

	_, err := r.db.Exec(ctx, sql, pgx.NamedArgs{
		"id":                               position.ID,
		"created_by":                       position.CreatedBy,
		"created_at":                       position.CreatedAt,
		"updated_at":                       position.UpdatedAt,
		"symbol":                           symbol.Sanitize(position.Symbol, position.Instrument),
		"instrument":                       position.Instrument,
		"currency":                         position.Currency,
		"risk_amount":                      position.RiskAmount,
		"notes":                            position.Notes,
		"total_charges_amount":             position.TotalChargesAmount,
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
		"user_broker_account_id":           position.UserBrokerAccountID,
	})

	if err != nil {
		return fmt.Errorf("sql exec: %w", err)
	}

	return nil
}

func (r *positionRepository) Delete(ctx context.Context, positionID uuid.UUID) error {
	const sql = `
        DELETE FROM position
        WHERE id = @id
    `

	_, err := r.db.Exec(ctx, sql, pgx.NamedArgs{"id": positionID})
	if err != nil {
		return fmt.Errorf("sql exec: %w", err)
	}

	return nil
}

func (r *positionRepository) Search(ctx context.Context, p SearchPayload, attachTrades bool, attachTags bool) ([]*Position, int, error) {
	return r.findPositions(ctx, p, attachTrades, attachTags)
}

func (r *positionRepository) GetByID(ctx context.Context, createdBy, positionID uuid.UUID) (*Position, error) {
	payload := SearchPayload{
		Filters: SearchFilter{
			CreatedBy: &createdBy,
			ID:        &positionID,
		},
		Pagination: common.Pagination{Limit: 1},
	}

	positions, _, err := r.findPositions(ctx, payload, true, true) // Attach trades and tags
	if err != nil {
		return nil, err
	}

	if len(positions) == 0 {
		return nil, repository.ErrNotFound
	}

	return positions[0], nil
}

// findPositions fetches positions and, if attachTrades/attachTags is true, joins and attaches trades/tags for each position.
func (r *positionRepository) findPositions(ctx context.Context, p SearchPayload, attachTrades bool, attachTags bool) ([]*Position, int, error) {
	baseSQL := `
		SELECT
			p.id, p.created_by, p.created_at, p.updated_at,
			p.symbol, p.instrument, p.currency, p.risk_amount, p.notes, p.total_charges_amount,
			p.direction, p.status, p.opened_at, p.closed_at,
			p.gross_pnl_amount, p.net_pnl_amount, p.r_factor, p.net_return_percentage,
			p.charges_as_percentage_of_net_pnl, p.open_quantity, p.open_average_price_amount,
			p.broker_id, p.user_broker_account_id,
			uba.id, uba.broker_id, uba.name
		FROM
			position p
		LEFT JOIN user_broker_account uba ON uba.id = p.user_broker_account_id
	`

	b := dbx.NewSQLBuilder(baseSQL)

	// If TradeTime filter is present, filter positions by those having at least one trade in the range.
	if p.Filters.TradeTime != nil && (p.Filters.TradeTime.From != nil || p.Filters.TradeTime.To != nil) {
		subQuery := "SELECT DISTINCT position_id FROM trade WHERE 1=1"
		var subArgs []any
		argIdx := b.ArgNum() // get the current argument index from the builder
		if p.Filters.TradeTime.From != nil {
			subQuery += fmt.Sprintf(" AND time >= $%d", argIdx)
			subArgs = append(subArgs, p.Filters.TradeTime.From)
			argIdx++
		}
		if p.Filters.TradeTime.To != nil {
			subQuery += fmt.Sprintf(" AND time < $%d", argIdx)
			subArgs = append(subArgs, p.Filters.TradeTime.To)
			argIdx++
		}
		// Manually add the filter to the builder
		b.AppendWhere(fmt.Sprintf("p.id IN (%s)", subQuery), subArgs...)
	}

	// Add TagIDs filter if present and non-empty
	if len(p.Filters.TagIDs) > 0 {
		// Subquery for positions having at least one of the tag_ids
		subQuery := "SELECT DISTINCT position_id FROM position_tag WHERE tag_id = ANY($%d)"
		argIdx := b.ArgNum()
		b.AppendWhere(fmt.Sprintf("p.id IN ("+subQuery+")", argIdx), p.Filters.TagIDs)
	}

	if p.Filters.ID != nil {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldID], "=", p.Filters.ID)
	}

	if p.Filters.CreatedBy != nil {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldCreatedBy], "=", p.Filters.CreatedBy)
	}

	if p.Filters.Symbol != nil && *p.Filters.Symbol != "" {
		b.AddStartsWithFilter(searchFieldsSQLColumn[searchFieldSymbol], strings.ToUpper(*p.Filters.Symbol), false)
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

	if p.Filters.UserBrokerAccountID != nil {
		b.AddCompareFilter(searchFieldsSQLColumn[searchFieldUserBrokerAccountID], "=", p.Filters.UserBrokerAccountID)
	}

	if p.Sort.Field == "" {
		p.Sort.Field = searchFieldOpened
	}

	if p.Sort.Order == "" {
		p.Sort.Order = common.SortOrderDESC
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
	positionMap := map[uuid.UUID]*Position{}
	positionIDs := []uuid.UUID{}

	for rows.Next() {
		var pos Position
		var ubaID *uuid.UUID
		var ubaBrokerID *uuid.UUID
		var ubaName *string

		err := rows.Scan(
			&pos.ID, &pos.CreatedBy, &pos.CreatedAt, &pos.UpdatedAt,
			&pos.Symbol, &pos.Instrument, &pos.Currency, &pos.RiskAmount, &pos.Notes, &pos.TotalChargesAmount,
			&pos.Direction, &pos.Status, &pos.OpenedAt, &pos.ClosedAt,
			&pos.GrossPnLAmount, &pos.NetPnLAmount, &pos.RFactor, &pos.NetReturnPercentage,
			&pos.ChargesAsPercentageOfNetPnL, &pos.OpenQuantity, &pos.OpenAveragePriceAmount,
			&pos.BrokerID, &pos.UserBrokerAccountID,
			&ubaID, &ubaBrokerID, &ubaName,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("scan: %w", err)
		}

		if ubaID != nil {
			ubaSummary := UserBrokerAccountSearchValue{
				ID:       *ubaID,
				BrokerID: *ubaBrokerID,
				Name:     *ubaName,
			}
			pos.UserBrokerAccount = &ubaSummary
		}

		pos.Symbol = strings.ToUpper(pos.Symbol)
		positionMap[pos.ID] = &pos
		positions = append(positions, &pos)
		positionIDs = append(positionIDs, pos.ID)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, fmt.Errorf("rows err: %w", err)
	}

	// Attach trades if requested
	if attachTrades && len(positionIDs) > 0 {
		trades, err := r.tradeRepository.FindByPositionIDs(ctx, positionIDs)
		if err != nil {
			return nil, 0, fmt.Errorf("fetch trades: %w", err)
		}
		for _, t := range trades {
			if pos, ok := positionMap[t.PositionID]; ok {
				pos.Trades = append(pos.Trades, t)
			}
		}
		// Sort trades for each position by trade.Time
		for _, pos := range positions {
			if len(pos.Trades) > 1 {
				sort.Slice(pos.Trades, func(i, j int) bool {
					return pos.Trades[i].Time.Before(pos.Trades[j].Time)
				})
			}
		}
	}

	// Attach tags if requested
	if attachTags && len(positionIDs) > 0 {
		tagWithPosIDs, err := r.tagRepository.GetTagsByPositionIDs(ctx, positionIDs)
		if err != nil {
			return nil, 0, fmt.Errorf("fetch tags: %w", err)
		}
		for _, twp := range tagWithPosIDs {
			if pos, ok := positionMap[twp.PositionID]; ok {
				pos.Tags = append(pos.Tags, &twp.Tag)
			}
		}
	}

	// Use b.Count() directly for the count query.
	countSQL, countArgs := b.Count()
	var total int
	err = r.db.QueryRow(ctx, countSQL, countArgs...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	return positions, total, nil
}

func (r *positionRepository) SearchSymbols(ctx context.Context, userID uuid.UUID, query string) ([]string, error) {
	symbols := []string{}
	baseSQL := `
	SELECT DISTINCT UPPER(position.symbol)
	FROM position
	JOIN user_profile ON user_profile.user_id = position.created_by
	`

	b := dbx.NewSQLBuilder(baseSQL)

	b.AddCompareFilter("position.created_by", "=", userID)

	if query != "" {
		b.AddStartsWithFilter("UPPER(position.symbol)", query, false)
	}

	// Return only 20 symbols at a time.
	// TODO: Allow client to specify the limit.
	b.AddPagination(20, 0)

	b.AddSorting("UPPER(position.symbol)", common.SortOrderASC)

	sql, args := b.Build()
	rows, err := r.db.Query(ctx, sql, args...)
	if err != nil {
		return symbols, fmt.Errorf("query: %w", err)
	}

	defer rows.Close()

	for rows.Next() {
		var symbol string
		if err := rows.Scan(&symbol); err != nil {
			return symbols, fmt.Errorf("scan: %w", err)
		}
		symbols = append(symbols, symbol)
	}

	return symbols, nil
}

func (r *positionRepository) NoOfPositionsOlderThanTwelveMonths(ctx context.Context, userID uuid.UUID) (int, error) {
	twelveMonthsAgo := time.Now().UTC().AddDate(-1, 0, 0)

	const sql = `
		SELECT COUNT(id)
		FROM position
		WHERE created_by = $1 AND opened_at < $2
	`

	var count int
	err := r.db.QueryRow(ctx, sql, userID, twelveMonthsAgo).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("query: %w", err)
	}

	return count, nil
}

func (r *positionRepository) TotalPositions(ctx context.Context, userID uuid.UUID) (int, error) {
	const sql = `
		SELECT COUNT(id)
		FROM position
		WHERE created_by = $1
	`

	var count int
	err := r.db.QueryRow(ctx, sql, userID).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("query: %w", err)
	}

	return count, nil
}
