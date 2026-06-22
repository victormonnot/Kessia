from django.urls import path

from . import views

urlpatterns = [
    path("admin/stats/", views.stats, name="admin-stats"),
    # Users
    path("admin/users/", views.AdminUserList.as_view(), name="admin-users"),
    path("admin/users/<int:pk>/", views.AdminUserDetail.as_view(), name="admin-user-detail"),
    path("admin/users/<int:pk>/suspend/", views.user_suspend, name="admin-user-suspend"),
    path("admin/users/<int:pk>/unsuspend/", views.user_unsuspend, name="admin-user-unsuspend"),
    path("admin/users/<int:pk>/verify/", views.user_verify, name="admin-user-verify"),
    path("admin/users/<int:pk>/unverify/", views.user_unverify, name="admin-user-unverify"),
    path("admin/users/<int:pk>/anonymize/", views.user_anonymize, name="admin-user-anonymize"),
    # Listings
    path("admin/listings/", views.AdminListingList.as_view(), name="admin-listings"),
    path("admin/listings/<int:pk>/remove/", views.listing_remove, name="admin-listing-remove"),
    path("admin/listings/<int:pk>/restore/", views.listing_restore, name="admin-listing-restore"),
    # Requests
    path("admin/requests/", views.AdminRequestList.as_view(), name="admin-requests"),
    path("admin/requests/<int:pk>/remove/", views.request_remove, name="admin-request-remove"),
    path("admin/requests/<int:pk>/restore/", views.request_restore, name="admin-request-restore"),
    # Reviews
    path("admin/reviews/", views.AdminReviewList.as_view(), name="admin-reviews"),
    path("admin/reviews/<int:pk>/remove/", views.review_remove, name="admin-review-remove"),
    path("admin/reviews/<int:pk>/restore/", views.review_restore, name="admin-review-restore"),
    # Orders & disputes
    path("admin/orders/", views.AdminOrderList.as_view(), name="admin-orders"),
    path("admin/orders/<int:pk>/", views.AdminOrderDetail.as_view(), name="admin-order-detail"),
    path("admin/orders/<int:pk>/refund/", views.order_refund, name="admin-order-refund"),
    path("admin/orders/<int:pk>/release/", views.order_release, name="admin-order-release"),
    # Reports
    path("reports/", views.report_create, name="report-create"),
    path("admin/reports/", views.AdminReportList.as_view(), name="admin-reports"),
    path("admin/reports/<int:pk>/resolve/", views.report_resolve, name="admin-report-resolve"),
    path("admin/reports/<int:pk>/dismiss/", views.report_dismiss, name="admin-report-dismiss"),
    # Audit log
    path("admin/audit-log/", views.AdminAuditLogList.as_view(), name="admin-audit-log"),
]
