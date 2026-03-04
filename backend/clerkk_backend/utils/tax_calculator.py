from decimal import Decimal
from typing import Dict, List, Tuple

# Canadian Federal Tax Brackets (2024)
FEDERAL_BRACKETS = [
    (Decimal("57375"), Decimal("0.145")),
    (Decimal("114750"), Decimal("0.205")),
    (Decimal("177882"), Decimal("0.26")),
    (Decimal("253414"), Decimal("0.29")),
    (Decimal("999999999"), Decimal("0.33")),
]

# Provincial Tax Brackets
PROVINCIAL_BRACKETS = {
    "ON": [  # Ontario
        (Decimal("52886"), Decimal("0.0505")),
        (Decimal("105775"), Decimal("0.0915")),
        (Decimal("150000"), Decimal("0.1116")),
        (Decimal("220000"), Decimal("0.1216")),
        (Decimal("999999999"), Decimal("0.1316")),
    ],
}

# Basic Personal Amounts (2024)
FEDERAL_BPA = Decimal("15705")
FEDERAL_BPA_PHASE_OUT_START = Decimal("173205")
FEDERAL_BPA_PHASE_OUT_END = Decimal("246752")

PROVINCIAL_BPA = {
    "ON": Decimal("11865"),
}


def calculate_federal_bpa(income: Decimal) -> Decimal:
    """Calculate federal basic personal amount with phase-out for high earners"""
    if income <= FEDERAL_BPA_PHASE_OUT_START:
        return FEDERAL_BPA

    if income >= FEDERAL_BPA_PHASE_OUT_END:
        return Decimal("0")

    # Linear phase-out
    phase_out_range = FEDERAL_BPA_PHASE_OUT_END - FEDERAL_BPA_PHASE_OUT_START
    income_over_threshold = income - FEDERAL_BPA_PHASE_OUT_START
    reduction = (income_over_threshold / phase_out_range) * FEDERAL_BPA

    return max(FEDERAL_BPA - reduction, Decimal("0"))


def calculate_progressive_tax(
    income: Decimal, brackets: List[Tuple[Decimal, Decimal]]
) -> Decimal:
    """Calculate tax using progressive brackets"""
    tax = Decimal("0")
    previous_limit = Decimal("0")

    for limit, rate in brackets:
        if income <= previous_limit:
            break

        taxable_in_bracket = min(income, limit) - previous_limit
        tax += taxable_in_bracket * rate
        previous_limit = limit

    return tax


def calculate_canadian_tax(annual_income: Decimal, province: str = "ON") -> Dict:
    """
    Calculate Canadian federal and provincial taxes with basic personal amounts

    Args:
        annual_income: Gross annual income
        province: Province code (e.g., 'ON', 'BC', 'AB')

    Returns:
        Dict with federal_tax, provincial_tax, total_tax, effective_rate
    """
    # Get basic personal amounts
    federal_bpa = calculate_federal_bpa(annual_income)
    provincial_bpa = PROVINCIAL_BPA.get(province, Decimal("0"))

    # Calculate federal tax
    federal_tax_before_credit = calculate_progressive_tax(
        annual_income, FEDERAL_BRACKETS
    )
    federal_bpa_credit = federal_bpa * Decimal("0.15")  # 15% credit on BPA
    federal_tax = max(federal_tax_before_credit - federal_bpa_credit, Decimal("0"))

    # Calculate provincial tax
    provincial_brackets = PROVINCIAL_BRACKETS.get(province, PROVINCIAL_BRACKETS["ON"])
    provincial_tax_before_credit = calculate_progressive_tax(
        annual_income, provincial_brackets
    )
    provincial_bpa_credit = provincial_bpa * Decimal(
        "0.0505"
    )  # 5.05% credit on BPA (ON lowest rate)
    provincial_tax = max(
        provincial_tax_before_credit - provincial_bpa_credit, Decimal("0")
    )

    # Calculate marginal tax rate (highest bracket reached)
    federal_marginal = Decimal("0")
    for limit, rate in FEDERAL_BRACKETS:
        if annual_income <= limit:
            federal_marginal = rate
            break

    provincial_marginal = Decimal("0")
    for limit, rate in provincial_brackets:
        if annual_income <= limit:
            provincial_marginal = rate
            break

    marginal_rate = (federal_marginal + provincial_marginal) * 100

    # Total tax
    total_tax = federal_tax + provincial_tax

    # Effective tax rate
    effective_rate = (
        (total_tax / annual_income * 100) if annual_income > 0 else Decimal("0")
    )

    return {
        "federal_tax": round(federal_tax, 2),
        "provincial_tax": round(provincial_tax, 2),
        "total_tax": round(total_tax, 2),
        "effective_rate": round(effective_rate, 2),
        "marginal_rate": round(marginal_rate, 2),
        "monthly_tax": round(total_tax / 12, 2),
    }
