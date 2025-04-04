from rest_framework.throttling import UserRateThrottle

class AdminRateThrottle(UserRateThrottle):
    def allow_request(self, request, view):
        # Si l'utilisateur est administrateur, il n'y a pas de limitation
        if request.user.is_staff:
            return True
        # Sinon, applique la limitation par défaut pour les utilisateurs authentifiés
        return super().allow_request(request, view)
