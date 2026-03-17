from enum import Enum


class Currency(str, Enum):
    CAD = "CAD"
    USD = "USD"
    INR = "INR"
    EUR = "EUR"
