from django.urls import path

from . import views

urlpatterns = [
    path("payments/connect/onboard/", views.connect_onboard, name="payments-connect-onboard"),
    path("payments/connect/session/", views.connect_session, name="payments-connect-session"),
    path("payments/connect/status/", views.connect_status, name="payments-connect-status"),
    path("payments/orders/<int:order_id>/pay/", views.pay_order, name="payments-pay"),
    path("payments/orders/<int:order_id>/confirm/", views.confirm_payment, name="payments-confirm"),
    path("payments/webhook/", views.stripe_webhook, name="payments-webhook"),
]
