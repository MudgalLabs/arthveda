package user_profile

type Service struct {
	userProfileRepository ReadWriter
}

func NewService(upr ReadWriter) *Service {
	return &Service{
		userProfileRepository: upr,
	}
}
