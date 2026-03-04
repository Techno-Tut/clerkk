from dependency_injector import containers, providers
from clerkk_backend.core.database import Database
from clerkk_backend.services.aws import ParameterStoreService
from clerkk_backend.services.user_service import UserService
from clerkk_backend.services.income_service import IncomeService
from clerkk_backend.services.expense_service import ExpenseService
from clerkk_backend.services.dashboard_service import DashboardService


def resolve_config_value(parameter_store, config_value):
    """Resolve config value. If starts with /inbriefs/, fetch from Parameter Store."""
    if isinstance(config_value, str) and config_value.startswith("/inbriefs/"):
        return parameter_store.get_parameter(config_value)
    return config_value


class Container(containers.DeclarativeContainer):
    config = providers.Configuration()

    """SECRET RESOLUTION"""
    parameter_store = providers.Singleton(
        ParameterStoreService, region=config.aws.region
    )

    database_url = providers.Callable(
        resolve_config_value,
        parameter_store=parameter_store,
        config_value=config.database.url,
    )

    """INFRASTRUCTURE SERVICES"""
    database = providers.Singleton(Database, database_url=database_url)

    """BUSINESS SERVICES"""
    user_service = providers.Factory(UserService, database=database)

    income_service = providers.Factory(IncomeService, database=database)

    expense_service = providers.Factory(ExpenseService, database=database)

    dashboard_service = providers.Factory(
        DashboardService,
        database=database,
        income_service=income_service,
        expense_service=expense_service,
    )
