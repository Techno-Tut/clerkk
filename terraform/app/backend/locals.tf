locals {
  common_tags = {
    ENV     = var.environment
    MODULE  = "app/backend"
    MANAGED = "TERRAFORM"
  }
}
