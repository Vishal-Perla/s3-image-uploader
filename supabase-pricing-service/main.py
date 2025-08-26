import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from supabase import create_client, Client

# ---------------------------
# Env & Supabase client
# ---------------------------
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ---------------------------
# OOP: Entities
# ---------------------------
class Product(BaseModel):
    id: Optional[int] = None
    slug: str
    name: str
    description: str = ""

class SubscriptionIn(BaseModel):
    user_id: str
    product_id: int
    plan_id: int

class Plan(BaseModel):
    id: Optional[int] = None
    product_id: int
    name: str
    price_cents: int = Field(ge=0)
    currency: str = "USD"
    billing_period: str = Field(pattern="^(monthly|yearly)$")
    features: List[str] = []
    is_active: bool = True

class CustomerOverride(BaseModel):
    id: Optional[int] = None
    user_id: Optional[str] = None  # UUID as string
    product_id: int
    plan_id: Optional[int] = None
    override_price_cents: int = Field(ge=0)
    currency: str = "USD"
    reason: str = ""
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None

# ---------------------------
# OOP: Repository
# ---------------------------
class PricingRepository:
    def __init__(self, client: Client):
        self.client = client

    # Products
    def get_product_by_slug(self, slug: str) -> Product:
        r = self.client.table("products").select("*").eq("slug", slug).limit(1).execute()
        if not r.data:
            raise HTTPException(404, f"Product '{slug}' not found")
        return Product(**r.data[0])

    def create_product(self, product: Product) -> Product:
        r = self.client.table("products").insert(product.model_dump(exclude_none=True)).execute()
        return Product(**r.data[0])

    # Plans
    def create_plan(self, plan: Plan) -> Plan:
        payload = plan.model_dump(exclude_none=True)
        r = self.client.table("plans").insert(payload).execute()
        return Plan(**r.data[0])

    def list_active_plans_for_product(self, product_id: int) -> List[Plan]:
        r = (
            self.client.table("plans")
            .select("*")
            .eq("product_id", product_id)
            .eq("is_active", True)
            .order("price_cents", desc=False)
            .execute()
        )
        return [Plan(**row) for row in r.data]

    # Overrides
    def upsert_override(self, ov: CustomerOverride) -> CustomerOverride:
        payload = ov.model_dump(exclude_none=True)
        r = self.client.table("customer_overrides").insert(payload).execute()
        return CustomerOverride(**r.data[0])

    def find_overrides_for_user_and_product(self, user_id: Optional[str], product_id: int) -> List[CustomerOverride]:
        if not user_id:
            return []
        r = (
            self.client.table("customer_overrides")
            .select("*")
            .eq("product_id", product_id)
            .eq("user_id", user_id)
            .execute()
        )
        return [CustomerOverride(**row) for row in r.data]

    # Subscriptions
    def upsert_subscription(self, user_id: str, product_id: int, plan_id: int):
        # Simple upsert: remove existing row for (user, product), then insert new
        self.client.table("subscriptions").delete().eq("user_id", user_id).eq("product_id", product_id).execute()
        r = self.client.table("subscriptions").insert({
            "user_id": user_id,
            "product_id": product_id,
            "plan_id": plan_id,
            "status": "active"
        }).execute()
        return r.data[0]

    def get_user_subscription_for_product(self, user_id: str, product_id: int):
        r = (
            self.client.table("subscriptions")
            .select("id,user_id,product_id,plan_id,status,created_at")
            .eq("user_id", user_id)
            .eq("product_id", product_id)
            .limit(1)
            .execute()
        )
        return r.data[0] if r.data else None

# ---------------------------
# OOP: Service (business logic)
# ---------------------------
class PricingService:
    def __init__(self, repo: PricingRepository):
        self.repo = repo

    def get_pricing_for_product(
        self, product_slug: str, user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        product = self.repo.get_product_by_slug(product_slug)
        plans = self.repo.list_active_plans_for_product(product.id)
        overrides = self.repo.find_overrides_for_user_and_product(user_id, product.id)
        now = datetime.now(timezone.utc)

        # Build a map of plan_id -> best override, and a global (plan_id=None) override
        plan_specific: Dict[int, CustomerOverride] = {}
        global_override: Optional[CustomerOverride] = None
        for ov in overrides:
            valid = True
            if ov.starts_at and ov.starts_at > now:
                valid = False
            if ov.ends_at and ov.ends_at < now:
                valid = False
            if not valid:
                continue

            if ov.plan_id is None:
                if not global_override or ov.override_price_cents < global_override.override_price_cents:
                    global_override = ov
            else:
                curr = plan_specific.get(ov.plan_id)
                if (curr is None) or (ov.override_price_cents < curr.override_price_cents):
                    plan_specific[ov.plan_id] = ov

        result_plans = []
        for p in plans:
            eff_price = p.price_cents
            eff_currency = p.currency

            if p.id in plan_specific:
                eff_price = plan_specific[p.id].override_price_cents
                eff_currency = plan_specific[p.id].currency
            elif global_override:
                eff_price = global_override.override_price_cents
                eff_currency = global_override.currency

            result_plans.append({
                "plan_id": p.id,
                "name": p.name,
                "billing_period": p.billing_period,
                "list_price_cents": p.price_cents,
                "effective_price_cents": eff_price,
                "currency": eff_currency,
                "features": p.features,
                "is_active": p.is_active
            })

        return {
            "product": {
                "id": product.id,
                "slug": product.slug,
                "name": product.name,
                "description": product.description
            },
            "plans": result_plans,
            "user_id": user_id
        }

    def get_subscription_by_slug(self, product_slug: str, user_id: str):
        product = self.repo.get_product_by_slug(product_slug)
        sub = self.repo.get_user_subscription_for_product(user_id, product.id)
        return {
            "product": {"id": product.id, "slug": product.slug, "name": product.name},
            "subscription": sub
        }

# ---------------------------
# FastAPI app + routes
# ---------------------------
app = FastAPI(title="Supabase Pricing Service", version="1.0.0")
origins = [os.getenv("ALLOWED_ORIGIN", "http://localhost:3000")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

repo = PricingRepository(supabase)
service = PricingService(repo)

# Health/root
@app.get("/")
def root():
    return {"message": "Supabase Pricing Service is running. See /docs for API, or /public/pricing/{product_slug}."}

# Public: Get pricing table (optionally user_id for overrides)
@app.get("/public/pricing/{product_slug}")
def get_public_pricing(product_slug: str, user_id: Optional[str] = None):
    return service.get_pricing_for_product(product_slug, user_id)

# Public: Create/replace a subscription (user picks plan)
@app.post("/public/subscribe")
def subscribe(payload: SubscriptionIn):
    # NOTE: For production, verify a Supabase JWT instead of trusting user_id from the client.
    saved = repo.upsert_subscription(payload.user_id, payload.product_id, payload.plan_id)
    return {"ok": True, "subscription": saved}

# Public: Get a user's subscription for a product (by slug)
@app.get("/public/subscription/{product_slug}")
def get_subscription(product_slug: str, user_id: str):
    # NOTE: For production, verify JWT and derive user_id from token.
    return service.get_subscription_by_slug(product_slug, user_id)

# Admin: create a product
@app.post("/admin/products")
def create_product(product: Product):
    return repo.create_product(product)

# Admin: create a plan
@app.post("/admin/plans")
def create_plan(plan: Plan):
    return repo.create_plan(plan)

# Admin: add an override (e.g., custom quote for a user)
@app.post("/admin/overrides")
def add_override(override: CustomerOverride):
    if override.starts_at and override.ends_at and override.ends_at < override.starts_at:
        raise HTTPException(400, "ends_at cannot be earlier than starts_at")
    return repo.upsert_override(override)
