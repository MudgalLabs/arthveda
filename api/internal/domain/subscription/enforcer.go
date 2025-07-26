package subscription

type Enforcer interface {
	IsPro() bool

	CanSeeAnalyticsUnlimited() (bool, error)
}

type PlanEnforcer struct {
	Subscription *UserSubscription // nil if user is on FREE plan
}

func NewPlanEnforcer(subscription *UserSubscription) *PlanEnforcer {
	return &PlanEnforcer{
		Subscription: subscription,
	}
}

func (e *PlanEnforcer) IsPro() bool {
	return e.Subscription != nil && e.Subscription.PlanID == PlanPro && e.Subscription.Status == StatusActive
}

func (e *PlanEnforcer) CanSeeAnalyticsUnlimited() bool {
	return e.IsPro()
}
