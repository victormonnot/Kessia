from rest_framework.routers import DefaultRouter

from .views import ProposalViewSet, RequestViewSet

router = DefaultRouter()
router.register(r"requests", RequestViewSet, basename="request")
router.register(r"proposals", ProposalViewSet, basename="proposal")

urlpatterns = router.urls
