from enum import Enum


class Currency(str, Enum):
    CAD = "CAD"
    USD = "USD"
    INR = "INR"
    EUR = "EUR"


class IncomeEventType(str, Enum):
    PAY = "pay"
    BONUS = "bonus"
    RSU = "rsu"
    OTHER = "other"
