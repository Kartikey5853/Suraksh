# Suraksh - models package
from app.models.user import User
from app.models.otp import OTPRecord
from app.models.document import Document
from app.models.verification import AadhaarVerification
from app.models.signature import Signature
from app.models.document_request import DocumentRequest

__all__ = ["User", "OTPRecord", "Document", "AadhaarVerification", "Signature", "DocumentRequest"]
