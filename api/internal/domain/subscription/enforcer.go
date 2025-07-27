package subscription

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

func (e *PlanEnforcer) CanAccessFullAnalytics() bool {
	return e.IsPro()
}
