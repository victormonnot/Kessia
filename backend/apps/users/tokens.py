"""Token generator for the signup email-confirmation link.

Subclassing ``PasswordResetTokenGenerator`` reuses Django's signed, time-limited
token machinery. Folding ``is_email_verified`` and ``email`` into the hash makes
the token effectively single-use (it stops validating once the address is
confirmed) and invalidates it if the email later changes.
"""

from django.contrib.auth.tokens import PasswordResetTokenGenerator


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{user.email}{user.is_email_verified}{timestamp}"


email_verification_token = EmailVerificationTokenGenerator()
