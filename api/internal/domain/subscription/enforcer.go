package subscription

type Feature string

const (
	FeatureAddUserBrokerAccount Feature = "add_user_broker_account"
	FeatureUpload               Feature = "upload"
)

type PlanLimitError struct {
	Code    string  `json:"code"`
	Feature Feature `json:"feature"`
}

func (e *PlanLimitError) Error() string {
	return e.Code
}

func NewPlanLimitError(feature Feature) *PlanLimitError {
	return &PlanLimitError{
		Code:    "plan_limit_exceeded",
		Feature: feature,
	}
}

type PlanLimits struct {
	MaxUserBrokerAccounts int
}

var FreePlanLimits = PlanLimits{
	MaxUserBrokerAccounts: 1,
}

var ProPlanLimits = PlanLimits{
	MaxUserBrokerAccounts: 10,
}

const MaxUserUploadBytes int64 = 1_073_741_824 // 1 GiB

type PlanEnforcer struct {
	subscription *UserSubscription // nil if user is on FREE plan
	planLimits   PlanLimits
}

func NewPlanEnforcer(subscription *UserSubscription) *PlanEnforcer {
	var planLimits PlanLimits
	if isPro(subscription) {
		planLimits = ProPlanLimits
	} else {
		planLimits = FreePlanLimits
	}

	return &PlanEnforcer{
		subscription: subscription,
		planLimits:   planLimits,
	}
}

// CanAccessAllPositions returns true if the user can access all positions,
// false if they can only access positions from the last 12 months.
func (e *PlanEnforcer) CanAccessAllPositions() bool {
	return isPro(e.subscription)
}

func (e *PlanEnforcer) CanAddUserBrokerAccount(currAccountsCount int) bool {
	return e.planLimits.MaxUserBrokerAccounts > currAccountsCount
}

func (e *PlanEnforcer) CanUpload(currBytesUsed int64) bool {
	if !isPro(e.subscription) {
		return false
	}

	return currBytesUsed < MaxUserUploadBytes
}

func isPro(subscription *UserSubscription) bool {
	return subscription != nil && subscription.PlanID == PlanPro && subscription.Status == StatusActive
}
